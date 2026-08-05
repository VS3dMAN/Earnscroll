/**
 * Projects MoveNet keypoints onto the on-screen camera preview.
 *
 * This is the fiddly part of the skeleton overlay, so it lives here as a pure
 * function that the Node test harness can assert against (`scripts/pose-math.test.mjs`).
 *
 * The full chain is:
 *
 *   1. model space      normalised 0–1 over the *center-cropped square* of the frame
 *   2. upright square   the same square, rotated so the image is the right way up
 *   3. upright frame    square re-centered inside the full (rotated) frame in pixels
 *   4. preview box      frame scaled into the view with `cover`/`contain` letterboxing
 *   5. screen px        X mirrored for the front camera
 *
 * Because the crop is a *centered square*, a 90/180/270 rotation maps it onto itself,
 * so step 2 is a rotation within the unit square and step 3 only ever has to swap
 * which axis carries the crop offset.
 */

/** Clockwise rotation (degrees) applied to the frame buffer to make it upright. */
export type Rotation = 0 | 90 | 180 | 270;

export type PreviewGeometry = {
  /** Frame buffer dimensions, as delivered to the frame processor. */
  frameWidth: number;
  frameHeight: number;
  rotation: Rotation;
  /** Layout size of the <Camera>/<Canvas> box, in the same units you want back. */
  viewWidth: number;
  viewHeight: number;
  /** <Camera resizeMode>; VisionCamera defaults to 'cover'. */
  resizeMode: 'cover' | 'contain';
  /** Front camera previews are mirrored, so the skeleton has to be too. */
  mirrorX: boolean;
};

export type ProjectedPoint = { x: number; y: number };

/**
 * VisionCamera's `Frame.orientation` is the frame's rotation *relative to the desired
 * output orientation*, so making it upright means counter-rotating by that amount.
 *
 * If the skeleton ever comes out rotated 90° on a device, this mapping is the single
 * thing to flip.
 */
export function rotationForOrientation(orientation: string): Rotation {
  'worklet';
  if (orientation === 'landscape-left') return 270;
  if (orientation === 'portrait-upside-down') return 180;
  if (orientation === 'landscape-right') return 90;
  return 0;
}

/**
 * Map a model-space keypoint (normalised x/y over the cropped square) to a pixel
 * position inside the preview view box.
 */
export function projectKeypoint(
  modelX: number,
  modelY: number,
  g: PreviewGeometry,
): ProjectedPoint {
  'worklet';

  // 1 -> 2. Rotate within the unit square so the image is upright.
  let ux = modelX;
  let uy = modelY;
  if (g.rotation === 90) {
    ux = 1 - modelY;
    uy = modelX;
  } else if (g.rotation === 180) {
    ux = 1 - modelX;
    uy = 1 - modelY;
  } else if (g.rotation === 270) {
    ux = modelY;
    uy = 1 - modelX;
  }

  // 2 -> 3. Re-center the square inside the upright frame.
  const swapped = g.rotation === 90 || g.rotation === 270;
  const dispW = swapped ? g.frameHeight : g.frameWidth;
  const dispH = swapped ? g.frameWidth : g.frameHeight;
  const side = dispW < dispH ? dispW : dispH;
  const frameX = Math.round((dispW - side) / 2) + ux * side;
  const frameY = Math.round((dispH - side) / 2) + uy * side;

  // 3 -> 4. Scale the frame into the view the same way the preview does.
  const scaleX = g.viewWidth / dispW;
  const scaleY = g.viewHeight / dispH;
  const scale = g.resizeMode === 'contain'
    ? (scaleX < scaleY ? scaleX : scaleY)
    : (scaleX > scaleY ? scaleX : scaleY);
  const offsetX = (g.viewWidth - dispW * scale) / 2;
  const offsetY = (g.viewHeight - dispH * scale) / 2;

  let x = offsetX + frameX * scale;
  const y = offsetY + frameY * scale;

  // 4 -> 5. Front camera preview is mirrored.
  if (g.mirrorX) x = g.viewWidth - x;

  return { x, y };
}

// --- Worklet -> UI thread transport buffer -------------------------------------
//
// The frame processor publishes one flat number[] per inference. Keeping it flat
// (rather than an array of objects) keeps the shared-value write to a single
// assignment and the UI-thread read to plain indexing.

export const POSE_IDX_TIMESTAMP = 0;
export const POSE_IDX_FRAME_W = 1;
export const POSE_IDX_FRAME_H = 2;
export const POSE_IDX_ROTATION = 3;
export const POSE_IDX_VALID = 4;
/** Keypoints start here: 17 x [y, x, score]. */
export const POSE_IDX_KEYPOINTS = 5;
export const POSE_BUFFER_LENGTH = POSE_IDX_KEYPOINTS + 51;

/** Bones drawn by the overlay, as pairs of keypoint indices. */
export const SKELETON_BONES: number[][] = [
  [5, 7], [7, 9],     // left shoulder -> elbow -> wrist
  [6, 8], [8, 10],    // right shoulder -> elbow -> wrist
  [5, 6],             // shoulders
  [5, 11], [6, 12],   // torso sides
  [11, 12],           // hips
  [11, 13], [13, 15], // left hip -> knee -> ankle
  [12, 14], [14, 16], // right hip -> knee -> ankle
];

/** Joints drawn as dots: the twelve tracked body joints, plus the nose for framing. */
export const SKELETON_JOINTS: number[] = [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
