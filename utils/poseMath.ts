/**
 * Pure pose maths shared by the camera frame processor and the Node test harness.
 *
 * Everything here is a module-scope `'worklet'` so the frame processor captures it
 * by reference instead of rebuilding the same closures on every single frame, and
 * every function reads straight out of the flat model output — no per-keypoint
 * object allocation.
 *
 * MoveNet output layout: 17 keypoints x [y, x, score], flattened to 51 floats.
 */

// A keypoint must clear this confidence to be trusted. Raised from 0.3 — the lower
// value let low-confidence (often wrong) joints drive rep counting.
export const CONFIDENCE_THRESHOLD = 0.4;

export const KEYPOINT_COUNT = 17;
export const POSE_FLOAT_COUNT = KEYPOINT_COUNT * 3;

/**
 * Anything indexable by number — a Float32Array from TFLite, or a plain array in
 * tests. TFLite's `runSync` is typed as returning any TypedArray including the
 * BigInt ones, hence the bigint arm; every read below goes through `Number()`.
 */
export type PoseArray = ArrayLike<number> | ArrayLike<bigint>;

export const KP = {
  NOSE: 0,
  LEFT_EYE: 1, RIGHT_EYE: 2,
  LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10,
  LEFT_HIP: 11, RIGHT_HIP: 12,
  LEFT_KNEE: 13, RIGHT_KNEE: 14,
  LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
};

export function kpY(raw: PoseArray, i: number): number {
  'worklet';
  return Number(raw[i * 3] ?? 0);
}

export function kpX(raw: PoseArray, i: number): number {
  'worklet';
  return Number(raw[i * 3 + 1] ?? 0);
}

export function kpScore(raw: PoseArray, i: number): number {
  'worklet';
  return Number(raw[i * 3 + 2] ?? 0);
}

/**
 * Interior angle at vertex `b`, in degrees, folded into [0, 180].
 * Coordinates are passed x-first to match `Math.atan2(dy, dx)` below.
 */
export function angleBetween(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): number {
  'worklet';
  const radians = Math.atan2(cy - by, cx - bx) - Math.atan2(ay - by, ax - bx);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

/**
 * Angle at keypoint `b` formed by keypoints `a`-`b`-`c`.
 * Returns -1 if any of the three is below the confidence threshold.
 */
export function angleOfTriple(raw: PoseArray, a: number, b: number, c: number): number {
  'worklet';
  if (
    kpScore(raw, a) < CONFIDENCE_THRESHOLD ||
    kpScore(raw, b) < CONFIDENCE_THRESHOLD ||
    kpScore(raw, c) < CONFIDENCE_THRESHOLD
  ) {
    return -1;
  }
  return angleBetween(
    kpX(raw, a), kpY(raw, a),
    kpX(raw, b), kpY(raw, b),
    kpX(raw, c), kpY(raw, c),
  );
}

/**
 * Pick whichever side of the body the model is more confident about (highest summed
 * confidence across the triple), then return that side's joint angle. Ties go left,
 * matching the original `pickBestSide` behaviour.
 */
export function bestSideAngle(
  raw: PoseArray,
  l0: number, l1: number, l2: number,
  r0: number, r1: number, r2: number,
): number {
  'worklet';
  const leftConf = kpScore(raw, l0) + kpScore(raw, l1) + kpScore(raw, l2);
  const rightConf = kpScore(raw, r0) + kpScore(raw, r1) + kpScore(raw, r2);
  return leftConf >= rightConf
    ? angleOfTriple(raw, l0, l1, l2)
    : angleOfTriple(raw, r0, r1, r2);
}

/**
 * How many of the 17 keypoints are confidently visible. Reads scores straight out of
 * the flat array — no `getKP()` object per keypoint.
 */
export function countConfidentKeypoints(raw: PoseArray): number {
  'worklet';
  let confident = 0;
  for (let i = 0; i < KEYPOINT_COUNT; i++) {
    if (Number(raw[i * 3 + 2] ?? 0) >= CONFIDENCE_THRESHOLD) confident++;
  }
  return confident;
}
