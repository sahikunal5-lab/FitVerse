// Body connections from the original workout_config.py.
export const BODY_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [24, 26], [25, 27], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32],
  [27, 31], [28, 32],
];

const BODY_JOINTS = [...new Set(BODY_CONNECTIONS.flat())];
const MIN_VISIBILITY = 0.5;

function isVisible(point) {
  return point && Number.isFinite(point.x) &&
    Number.isFinite(point.y) && point.visibility >= MIN_VISIBILITY;
}

export function clearPoseCanvas(canvas) {
  if (!canvas) return;
  canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawPoseSkeleton(canvas, video, landmarks) {
  if (!canvas || !video) return;

  const { videoWidth: width, videoHeight: height } = video;
  if (!width || !height) {
    clearPoseCanvas(canvas);
    return;
  }

  // Match the source aspect ratio. CSS maps both layers to the preview.
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  if (!landmarks?.length) return;

  const scale = Math.min(width, height) / 480;
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw connections only if both endpoints are visible.
  ctx.beginPath();
  for (const [start, end] of BODY_CONNECTIONS) {
    const a = landmarks[start];
    const b = landmarks[end];
    if (!isVisible(a) || !isVisible(b)) continue;
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
  }
  ctx.stroke();

  ctx.fillStyle = "#facc15";
  for (const index of BODY_JOINTS) {
    const p = landmarks[index];
    if (!isVisible(p)) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, Math.max(2.5, 4 * scale), 0, Math.PI * 2);
    ctx.fill();
  }
}
