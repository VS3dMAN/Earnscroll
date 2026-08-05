import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
    Canvas,
    Picture,
    Skia,
    createPicture,
    PaintStyle,
    StrokeCap,
    type SkSize,
} from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import type { ISharedValue } from 'react-native-worklets-core';
import { CONFIDENCE_THRESHOLD, POSE_FLOAT_COUNT } from '@/utils/poseMath';
import {
    POSE_BUFFER_LENGTH,
    POSE_IDX_FRAME_H,
    POSE_IDX_FRAME_W,
    POSE_IDX_KEYPOINTS,
    POSE_IDX_ROTATION,
    POSE_IDX_TIMESTAMP,
    POSE_IDX_VALID,
    SKELETON_BONES,
    SKELETON_JOINTS,
    projectKeypoint,
    type PreviewGeometry,
    type Rotation,
} from '@/utils/poseProjection';

/**
 * Draws the tracked skeleton over the camera preview.
 *
 * Data path (no JS-thread hop anywhere):
 *
 *   frame processor worklet  --write-->  `pose` (worklets-core shared value)
 *   Reanimated useFrameCallback (UI thread)  --read-->  EMA  -->  Reanimated shared value
 *   useDerivedValue  -->  SkPicture  -->  <Picture> on the Skia canvas
 *
 * Reading a worklets-core shared value from a Reanimated worklet is the same pattern
 * VisionCamera itself uses in `SkiaCameraCanvas`.
 *
 * The EMA here smooths *rendered positions only*. It is deliberately separate state
 * from `smoothedAngle` in the frame processor — nothing in this file can affect rep
 * counting.
 */

// Smoothing on rendered joint positions. At ~15fps inference and 60fps UI this also
// interpolates between inference results, which hides the frame-skip completely.
const RENDER_EMA_ALPHA = 0.35;

// If a joint reappears after being invisible, snap to it instead of sliding in from
// wherever it used to be.
const RESEED_SCORE = 0.05;

// UI frames without a fresh inference result before the skeleton fades out.
const STALE_FRAMES_HOLD = 12; // ~200ms
const STALE_FRAMES_FADE = 18; // then ~300ms to fade fully

const JOINT_RADIUS = 5;
const JOINT_CORE_RADIUS = 2;
const BONE_WIDTH = 3;

// Matches the HUD accent in NativeWorkoutCamera / constants/colors.ts.
const ACCENT = '#00D9FF';
const JOINT_CORE = '#FFFFFF';

// Confidence at which a joint reaches full opacity. Below this it fades toward
// MIN_ALPHA rather than popping in and out at the threshold.
const FULL_ALPHA_SCORE = 0.75;
const MIN_ALPHA = 0.25;

type Props = {
    /** Transport buffer published by the frame processor. See POSE_IDX_* in poseProjection. */
    pose: ISharedValue<number[]>;
    /** Front-camera previews are mirrored, so the skeleton must be mirrored too. */
    mirrored: boolean;
    /** Must match the <Camera resizeMode> prop. VisionCamera defaults to 'cover'. */
    resizeMode?: 'cover' | 'contain';
};

export default function PoseSkeletonOverlay({ pose, mirrored, resizeMode = 'cover' }: Props) {
    const canvasSize = useSharedValue<SkSize>({ width: 0, height: 0 });

    // Render-only state, all on the UI thread.
    const renderedPose = useSharedValue<number[]>(new Array(POSE_FLOAT_COUNT).fill(0));
    // [frameWidth, frameHeight, rotation, globalAlpha]
    const renderGeometry = useSharedValue<number[]>([0, 0, 0, 0]);
    const lastTimestamp = useSharedValue<number>(-1);
    const staleFrames = useSharedValue<number>(STALE_FRAMES_HOLD + STALE_FRAMES_FADE);

    const bonePaint = useMemo(() => {
        const p = Skia.Paint();
        p.setAntiAlias(true);
        p.setStyle(PaintStyle.Stroke);
        p.setStrokeWidth(BONE_WIDTH);
        p.setStrokeCap(StrokeCap.Round);
        p.setColor(Skia.Color(ACCENT));
        return p;
    }, []);

    const jointPaint = useMemo(() => {
        const p = Skia.Paint();
        p.setAntiAlias(true);
        p.setStyle(PaintStyle.Fill);
        p.setColor(Skia.Color(ACCENT));
        return p;
    }, []);

    const jointCorePaint = useMemo(() => {
        const p = Skia.Paint();
        p.setAntiAlias(true);
        p.setStyle(PaintStyle.Fill);
        p.setColor(Skia.Color(JOINT_CORE));
        return p;
    }, []);

    // Pull the latest inference result off the worklets-core shared value once per UI
    // frame and ease the rendered pose toward it.
    useFrameCallback(() => {
        'worklet';
        const src = pose.value;
        const hasPose =
            src != null && src.length >= POSE_BUFFER_LENGTH && src[POSE_IDX_VALID] === 1;

        // Staleness is counted in UI frames since the last *new* inference result, so
        // it needs no shared clock between the two runtimes.
        if (hasPose && src[POSE_IDX_TIMESTAMP] !== lastTimestamp.value) {
            lastTimestamp.value = src[POSE_IDX_TIMESTAMP];
            staleFrames.value = 0;
        } else if (staleFrames.value < STALE_FRAMES_HOLD + STALE_FRAMES_FADE) {
            staleFrames.value = staleFrames.value + 1;
        }

        // Fade out if inference has stalled (camera paused, model unloaded, tab blurred).
        let globalAlpha = 1;
        if (staleFrames.value > STALE_FRAMES_HOLD) {
            const over = staleFrames.value - STALE_FRAMES_HOLD;
            globalAlpha = over >= STALE_FRAMES_FADE ? 0 : 1 - over / STALE_FRAMES_FADE;
        }

        if (!hasPose || globalAlpha <= 0) {
            const prev = renderGeometry.value;
            if (prev[3] !== 0) renderGeometry.value = [prev[0], prev[1], prev[2], 0];
            return;
        }

        // Ease toward the latest keypoints on *every* UI frame, not only when a new
        // inference result arrives. At 15fps inference and 60fps UI this interpolates
        // between results, which is what hides the frame-skip.
        const dst = renderedPose.value;
        const next = new Array<number>(POSE_FLOAT_COUNT);
        for (let i = 0; i < POSE_FLOAT_COUNT; i += 3) {
            const y = src[POSE_IDX_KEYPOINTS + i];
            const x = src[POSE_IDX_KEYPOINTS + i + 1];
            const s = src[POSE_IDX_KEYPOINTS + i + 2];
            // Re-seed rather than ease when a joint comes back from nothing, so it
            // doesn't streak across the screen from its last known position.
            const reseed = dst[i + 2] < RESEED_SCORE;
            next[i] = reseed ? y : RENDER_EMA_ALPHA * y + (1 - RENDER_EMA_ALPHA) * dst[i];
            next[i + 1] = reseed ? x : RENDER_EMA_ALPHA * x + (1 - RENDER_EMA_ALPHA) * dst[i + 1];
            next[i + 2] = RENDER_EMA_ALPHA * s + (1 - RENDER_EMA_ALPHA) * dst[i + 2];
        }
        renderedPose.value = next;
        renderGeometry.value = [
            src[POSE_IDX_FRAME_W],
            src[POSE_IDX_FRAME_H],
            src[POSE_IDX_ROTATION],
            globalAlpha,
        ];
    });

    const picture = useDerivedValue(() => {
        'worklet';
        const { width, height } = canvasSize.value;
        const kp = renderedPose.value;
        const geom = renderGeometry.value;
        const globalAlpha = geom[3];
        const frameWidth = geom[0];
        const frameHeight = geom[1];

        return createPicture(
            (canvas) => {
                if (width <= 0 || height <= 0) return;
                if (globalAlpha <= 0 || frameWidth <= 0 || frameHeight <= 0) return;

                const geometry: PreviewGeometry = {
                    frameWidth,
                    frameHeight,
                    rotation: geom[2] as Rotation,
                    viewWidth: width,
                    viewHeight: height,
                    resizeMode,
                    mirrorX: mirrored,
                };

                // Project every keypoint once; bones and joints both index into these.
                const alphas = new Array<number>(17).fill(0);
                const px = new Array<number>(17).fill(0);
                const py = new Array<number>(17).fill(0);

                for (let i = 0; i < 17; i++) {
                    const score = kp[i * 3 + 2];
                    if (score < CONFIDENCE_THRESHOLD) continue;
                    const point = projectKeypoint(kp[i * 3 + 1], kp[i * 3], geometry);
                    px[i] = point.x;
                    py[i] = point.y;
                    const t = (score - CONFIDENCE_THRESHOLD) / (FULL_ALPHA_SCORE - CONFIDENCE_THRESHOLD);
                    const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
                    alphas[i] = (MIN_ALPHA + (1 - MIN_ALPHA) * clamped) * globalAlpha;
                }

                // Bones first so the joint dots sit on top of the line ends.
                for (let b = 0; b < SKELETON_BONES.length; b++) {
                    const a = SKELETON_BONES[b][0];
                    const c = SKELETON_BONES[b][1];
                    // Only draw a bone when *both* endpoints cleared the threshold.
                    if (alphas[a] <= 0 || alphas[c] <= 0) continue;
                    bonePaint.setAlphaf(alphas[a] < alphas[c] ? alphas[a] : alphas[c]);
                    canvas.drawLine(px[a], py[a], px[c], py[c], bonePaint);
                }

                for (let j = 0; j < SKELETON_JOINTS.length; j++) {
                    const i = SKELETON_JOINTS[j];
                    if (alphas[i] <= 0) continue;
                    jointPaint.setAlphaf(alphas[i]);
                    canvas.drawCircle(px[i], py[i], JOINT_RADIUS, jointPaint);
                    jointCorePaint.setAlphaf(alphas[i]);
                    canvas.drawCircle(px[i], py[i], JOINT_CORE_RADIUS, jointCorePaint);
                }
            },
            { width, height },
        );
    });

    return (
        <Canvas style={StyleSheet.absoluteFill} onSize={canvasSize} pointerEvents="none">
            <Picture picture={picture} />
        </Canvas>
    );
}
