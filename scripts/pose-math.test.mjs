/**
 * Standalone assertions for the pure pose maths that the workout camera depends on.
 *
 *   node scripts/pose-math.test.mjs
 *
 * Requires Node >= 22.6 (uses native TypeScript type stripping to import the .ts
 * sources directly, so the tests run against the exact code the app ships).
 *
 * Covers:
 *   - joint-angle maths and the confidence gate (rep counting)
 *   - the model -> screen coordinate transform (skeleton overlay)
 */

import assert from 'node:assert/strict';
import {
    CONFIDENCE_THRESHOLD,
    KP,
    angleBetween,
    angleOfTriple,
    bestSideAngle,
    countConfidentKeypoints,
} from '../utils/poseMath.ts';
import {
    POSE_BUFFER_LENGTH,
    POSE_IDX_KEYPOINTS,
    SKELETON_BONES,
    SKELETON_JOINTS,
    projectKeypoint,
    rotationForOrientation,
} from '../utils/poseProjection.ts';

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ok   ${name}`);
    } catch (err) {
        failed++;
        console.log(`  FAIL ${name}`);
        console.log(`       ${err.message.split('\n').join('\n       ')}`);
    }
}

function group(name) {
    console.log(`\n${name}`);
}

/** Build a 51-float MoveNet output from { index: [y, x, score] } entries. */
function pose(entries) {
    const raw = new Array(51).fill(0);
    for (const [i, [y, x, s]] of Object.entries(entries)) {
        raw[i * 3] = y;
        raw[i * 3 + 1] = x;
        raw[i * 3 + 2] = s;
    }
    return raw;
}

const near = (actual, expected, tol = 1e-9) =>
    assert.ok(
        Math.abs(actual - expected) <= tol,
        `expected ${expected}, got ${actual} (tolerance ${tol})`,
    );

// ---------------------------------------------------------------------------
group('angleBetween');

test('straight line is 180°', () => {
    near(angleBetween(0, 0, 1, 0, 2, 0), 180);
});

test('right angle is 90°', () => {
    near(angleBetween(0, 0, 1, 0, 1, 1), 90);
});

test('fully folded back on itself is 0°', () => {
    near(angleBetween(0, 0, 1, 0, 0, 0), 0);
});

test('result is always folded into [0, 180]', () => {
    // Mirror image of the 90° case: still reported as 90, never 270.
    near(angleBetween(0, 0, 1, 0, 1, -1), 90);
});

test('a deep squat knee bend reads well under SQUAT_DOWN_ANGLE (100°)', () => {
    // hip above knee, ankle beside knee — knee folded to ~45°
    const a = angleBetween(0.5, 0.4, 0.5, 0.6, 0.7, 0.6);
    assert.ok(a < 100, `expected < 100, got ${a}`);
});

test('a standing leg reads over SQUAT_UP_ANGLE (155°)', () => {
    // hip, knee, ankle nearly collinear vertically
    const a = angleBetween(0.5, 0.3, 0.5, 0.6, 0.51, 0.9);
    assert.ok(a > 155, `expected > 155, got ${a}`);
});

// ---------------------------------------------------------------------------
group('angleOfTriple — confidence gate');

test('returns -1 when any keypoint is below CONFIDENCE_THRESHOLD', () => {
    const belowOne = pose({
        11: [0.4, 0.5, 0.9],
        13: [0.6, 0.5, CONFIDENCE_THRESHOLD - 0.01],
        15: [0.8, 0.5, 0.9],
    });
    assert.equal(angleOfTriple(belowOne, KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE), -1);
});

test('exactly at the threshold is accepted', () => {
    const atThreshold = pose({
        11: [0.4, 0.5, CONFIDENCE_THRESHOLD],
        13: [0.6, 0.5, CONFIDENCE_THRESHOLD],
        15: [0.8, 0.5, CONFIDENCE_THRESHOLD],
    });
    near(angleOfTriple(atThreshold, KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE), 180);
});

test('reads y from slot 0 and x from slot 1, not the other way round', () => {
    // Vertical line in (y, x) terms. If the reader swapped the axes this would
    // still be 180°, so use an L shape that is only a right angle when read
    // correctly: hip directly above knee, ankle directly right of knee.
    const raw = pose({
        11: [0.2, 0.5, 1],
        13: [0.6, 0.5, 1],
        15: [0.6, 0.9, 1],
    });
    near(angleOfTriple(raw, KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE), 90);
});

// ---------------------------------------------------------------------------
group('bestSideAngle — side selection');

test('picks the side with the higher summed confidence', () => {
    const raw = pose({
        // left leg: bent, low confidence
        11: [0.4, 0.3, 0.5], 13: [0.6, 0.3, 0.5], 15: [0.6, 0.5, 0.5],
        // right leg: straight, high confidence
        12: [0.2, 0.7, 0.9], 14: [0.5, 0.7, 0.9], 16: [0.8, 0.7, 0.9],
    });
    const a = bestSideAngle(
        raw,
        KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE,
        KP.RIGHT_HIP, KP.RIGHT_KNEE, KP.RIGHT_ANKLE,
    );
    near(a, 180); // the straight (right) leg won
});

test('ties go to the left side', () => {
    const raw = pose({
        11: [0.2, 0.5, 0.8], 13: [0.6, 0.5, 0.8], 15: [0.6, 0.9, 0.8], // 90°
        12: [0.2, 0.7, 0.8], 14: [0.5, 0.7, 0.8], 16: [0.8, 0.7, 0.8], // 180°
    });
    const a = bestSideAngle(
        raw,
        KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE,
        KP.RIGHT_HIP, KP.RIGHT_KNEE, KP.RIGHT_ANKLE,
    );
    near(a, 90);
});

test('returns -1 if the winning side is not confident enough', () => {
    // Left wins on summed confidence but one of its joints is under threshold.
    const raw = pose({
        11: [0.2, 0.5, 0.95], 13: [0.6, 0.5, 0.95], 15: [0.6, 0.9, 0.1],
        12: [0.2, 0.7, 0.5], 14: [0.5, 0.7, 0.5], 16: [0.8, 0.7, 0.5],
    });
    const a = bestSideAngle(
        raw,
        KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE,
        KP.RIGHT_HIP, KP.RIGHT_KNEE, KP.RIGHT_ANKLE,
    );
    assert.equal(a, -1);
});

// ---------------------------------------------------------------------------
group('countConfidentKeypoints');

test('counts only keypoints at or above the threshold', () => {
    const raw = new Array(51).fill(0);
    for (let i = 0; i < 17; i++) raw[i * 3 + 2] = i < 6 ? 0.9 : 0.1;
    assert.equal(countConfidentKeypoints(raw), 6);
});

test('boundary value counts as confident', () => {
    const raw = new Array(51).fill(0);
    raw[2] = CONFIDENCE_THRESHOLD;
    raw[5] = CONFIDENCE_THRESHOLD - 1e-6;
    assert.equal(countConfidentKeypoints(raw), 1);
});

// ---------------------------------------------------------------------------
group('rotationForOrientation');

test('maps VisionCamera orientations to counter-rotations', () => {
    assert.equal(rotationForOrientation('portrait'), 0);
    assert.equal(rotationForOrientation('landscape-left'), 270);
    assert.equal(rotationForOrientation('portrait-upside-down'), 180);
    assert.equal(rotationForOrientation('landscape-right'), 90);
});

test('unknown orientation falls back to upright', () => {
    assert.equal(rotationForOrientation('nonsense'), 0);
});

// ---------------------------------------------------------------------------
group('projectKeypoint — coordinate transform');

/** Square frame, square view, no rotation, no mirroring: the identity case. */
const identity = {
    frameWidth: 480, frameHeight: 480, rotation: 0,
    viewWidth: 300, viewHeight: 300,
    resizeMode: 'cover', mirrorX: false,
};

test('model center lands at the view center (identity geometry)', () => {
    const p = projectKeypoint(0.5, 0.5, identity);
    near(p.x, 150);
    near(p.y, 150);
});

test('corners land on the view corners when the crop square fills the view', () => {
    near(projectKeypoint(0, 0, identity).x, 0);
    near(projectKeypoint(0, 0, identity).y, 0);
    near(projectKeypoint(1, 0, identity).x, 300);
    near(projectKeypoint(1, 0, identity).y, 0);
    near(projectKeypoint(0, 1, identity).x, 0);
    near(projectKeypoint(0, 1, identity).y, 300);
    near(projectKeypoint(1, 1, identity).x, 300);
    near(projectKeypoint(1, 1, identity).y, 300);
});

test('center stays centered for every rotation, resize mode and frame aspect', () => {
    for (const rotation of [0, 90, 180, 270]) {
        for (const resizeMode of ['cover', 'contain']) {
            for (const [fw, fh] of [[480, 480], [1280, 720], [720, 1280]]) {
                for (const mirrorX of [false, true]) {
                    const g = {
                        frameWidth: fw, frameHeight: fh, rotation,
                        viewWidth: 1080, viewHeight: 2160,
                        resizeMode, mirrorX,
                    };
                    const p = projectKeypoint(0.5, 0.5, g);
                    near(p.x, 540, 1e-6);
                    near(p.y, 1080, 1e-6);
                }
            }
        }
    }
});

test('mirroring reflects X about the view center and leaves Y alone', () => {
    const plain = projectKeypoint(0.2, 0.3, identity);
    const mirrored = projectKeypoint(0.2, 0.3, { ...identity, mirrorX: true });
    near(mirrored.x, identity.viewWidth - plain.x);
    near(mirrored.y, plain.y);
    // ...and it is a real mirror, not a no-op.
    assert.notEqual(mirrored.x, plain.x);
});

test('mirroring maps the left edge to the right edge', () => {
    const g = { ...identity, mirrorX: true };
    near(projectKeypoint(0, 0, g).x, 300);
    near(projectKeypoint(1, 0, g).x, 0);
});

test('90° rotation sends the model top-left to the upright top-right', () => {
    // Landscape buffer shown in a square view; crop square is 480 wide.
    const g = {
        frameWidth: 640, frameHeight: 480, rotation: 90,
        viewWidth: 480, viewHeight: 480,
        resizeMode: 'contain', mirrorX: false,
    };
    // Upright frame is 480 wide x 640 tall; 'contain' into a 480x480 view scales
    // by 0.75 and pillarboxes 60px left and right. The crop square is centered in
    // the upright frame at y offset (640-480)/2 = 80.
    const topLeft = projectKeypoint(0, 0, g);
    near(topLeft.x, 60 + 480 * 0.75); // rotated to the right edge of the square
    near(topLeft.y, 0 + 80 * 0.75);   // top edge of the square
});

test('270° rotation sends the model top-left to the upright bottom-left', () => {
    const g = {
        frameWidth: 640, frameHeight: 480, rotation: 270,
        viewWidth: 480, viewHeight: 480,
        resizeMode: 'contain', mirrorX: false,
    };
    const topLeft = projectKeypoint(0, 0, g);
    near(topLeft.x, 60);                  // left edge of the square
    near(topLeft.y, (80 + 480) * 0.75);   // bottom edge of the square
});

test('180° rotation is a point reflection of the identity case', () => {
    const g = { ...identity, rotation: 180 };
    const p = projectKeypoint(0.25, 0.75, g);
    const q = projectKeypoint(0.75, 0.25, identity);
    near(p.x, q.x);
    near(p.y, q.y);
});

test("'cover' crops the square rather than letterboxing it", () => {
    // Square frame into a portrait view: cover scales by height, so the square
    // overflows horizontally and its left/right edges land off-view.
    const g = {
        frameWidth: 480, frameHeight: 480, rotation: 0,
        viewWidth: 300, viewHeight: 600,
        resizeMode: 'cover', mirrorX: false,
    };
    near(projectKeypoint(0.5, 0, g).y, 0);
    near(projectKeypoint(0.5, 1, g).y, 600);
    assert.ok(projectKeypoint(0, 0.5, g).x < 0, 'left edge should overflow the view');
    assert.ok(projectKeypoint(1, 0.5, g).x > 300, 'right edge should overflow the view');
});

test("'contain' letterboxes the square rather than cropping it", () => {
    const g = {
        frameWidth: 480, frameHeight: 480, rotation: 0,
        viewWidth: 300, viewHeight: 600,
        resizeMode: 'contain', mirrorX: false,
    };
    near(projectKeypoint(0, 0.5, g).x, 0);
    near(projectKeypoint(1, 0.5, g).x, 300);
    near(projectKeypoint(0.5, 0, g).y, 150);
    near(projectKeypoint(0.5, 1, g).y, 450);
});

test('landscape buffer in a portrait view: the crop square is horizontally centered', () => {
    // 1280x720 buffer, already upright. Crop square is 720 wide, centered at
    // x = (1280-720)/2 = 280.
    const g = {
        frameWidth: 1280, frameHeight: 720, rotation: 0,
        viewWidth: 1280, viewHeight: 720,
        resizeMode: 'cover', mirrorX: false,
    };
    near(projectKeypoint(0, 0, g).x, 280);
    near(projectKeypoint(1, 0, g).x, 1000);
    near(projectKeypoint(0, 0, g).y, 0);
    near(projectKeypoint(0, 1, g).y, 720);
});

test('projection is monotonic in both axes (no accidental axis swap)', () => {
    const g = { ...identity, rotation: 0 };
    assert.ok(projectKeypoint(0.1, 0.5, g).x < projectKeypoint(0.9, 0.5, g).x);
    assert.ok(projectKeypoint(0.5, 0.1, g).y < projectKeypoint(0.5, 0.9, g).y);
    near(projectKeypoint(0.1, 0.5, g).y, projectKeypoint(0.9, 0.5, g).y);
});

// ---------------------------------------------------------------------------
group('skeleton topology');

test('every bone endpoint is a real keypoint index', () => {
    for (const [a, b] of SKELETON_BONES) {
        assert.ok(a >= 0 && a < 17, `bad bone index ${a}`);
        assert.ok(b >= 0 && b < 17, `bad bone index ${b}`);
        assert.notEqual(a, b);
    }
});

test('every bone endpoint is also drawn as a joint', () => {
    for (const [a, b] of SKELETON_BONES) {
        assert.ok(SKELETON_JOINTS.includes(a), `bone endpoint ${a} has no joint dot`);
        assert.ok(SKELETON_JOINTS.includes(b), `bone endpoint ${b} has no joint dot`);
    }
});

test('transport buffer is big enough for the header plus 17 keypoints', () => {
    assert.equal(POSE_BUFFER_LENGTH, POSE_IDX_KEYPOINTS + 51);
});

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
