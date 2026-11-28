// MediaPipe landmark indices used by FitVerse exercise detectors.
export const LANDMARKS = Object.freeze({
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
});

export const MIN_VISIBILITY = 0.7;

// Return null for missing or unreliable points; never count them as 0 degrees.
export function isLandmarkVisible(point, minVisibility = MIN_VISIBILITY) {
  return Boolean(point &&
    Number.isFinite(point.x) && Number.isFinite(point.y) &&
    Number.isFinite(point.visibility) && point.visibility >= minVisibility);
}

// Convert normalized image coordinates into source-video pixels.
export function getPoint(landmarks, index, width, height,
  minVisibility = MIN_VISIBILITY) {
  const point = landmarks?.[index];
  if (!Number.isFinite(width) || width <= 0 ||
      !Number.isFinite(height) || height <= 0 ||
      !isLandmarkVisible(point, minVisibility)) return null;

  return { x: point.x * width, y: point.y * height };
}

// Angle ABC in degrees, where B is the joint (pixel coordinates).
export function calculateAngle(a, b, c) {
  if (![a, b, c].every(p => p && Number.isFinite(p.x) &&
      Number.isFinite(p.y))) return null;

  const ax = a.x - b.x;
  const ay = a.y - b.y;
  const cx = c.x - b.x;
  const cy = c.y - b.y;

  const magA = Math.hypot(ax, ay);
  const magC = Math.hypot(cx, cy);
  if (magA === 0 || magC === 0 ||
      !Number.isFinite(magA) || !Number.isFinite(magC)) return null;

  // Normalize before taking the dot product to avoid numerical overflow.
  const cosine = (ax / magA) * (cx / magC) +
                 (ay / magA) * (cy / magC);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}

// Calculate an angle directly from a MediaPipe image-landmark array.
export function calculateJointAngle(landmarks, a, b, c, width, height,
  minVisibility = MIN_VISIBILITY) {
  return calculateAngle(
    getPoint(landmarks, a, width, height, minVisibility),
    getPoint(landmarks, b, width, height, minVisibility),
    getPoint(landmarks, c, width, height, minVisibility),
  );
}
