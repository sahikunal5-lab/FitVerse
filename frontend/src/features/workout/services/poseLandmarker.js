
import {
  FilesetResolver,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";


const BASE_URL = import.meta.env.BASE_URL;

const WASM_PATH = `${BASE_URL}wasm`;

const MODEL_PATH =
  `${BASE_URL}models/pose_landmarker_full.task`;


// ==========================================
// INITIALIZE POSE LANDMARKER
// ==========================================

export async function createPoseLandmarker() {

  const startTime = performance.now();


  // Load MediaPipe WASM runtime

  const vision = await FilesetResolver.forVisionTasks(
    WASM_PATH
  );


  // Initialize pretrained pose model

  const poseLandmarker =
    await PoseLandmarker.createFromOptions(
      vision,
      {

        baseOptions: {

          modelAssetPath: MODEL_PATH,

          delegate: "CPU",
        },

        runningMode: "VIDEO",

        numPoses: 1,

        minPoseDetectionConfidence: 0.5,

        minPosePresenceConfidence: 0.5,

        minTrackingConfidence: 0.5,

        outputSegmentationMasks: false,
      }
    );


  const endTime = performance.now();

  console.log(
    "[PERFORMANCE] MediaPipe initialized:",
    (endTime - startTime).toFixed(2),
    "ms"
  );


  return poseLandmarker;
}
