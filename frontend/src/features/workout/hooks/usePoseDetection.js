
import { useEffect, useRef, useState } from "react";

import {
  clearPoseCanvas,
  drawPoseSkeleton,
} from "../utils/drawPoseSkeleton.js";

import BicepsCurlDetector from
  "../detectors/BicepsCurlDetector.js";


// ==========================================
// PERFORMANCE CONFIGURATION
// ==========================================

const TARGET_FPS = 20;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const UI_UPDATE_INTERVAL = 250;


// ==========================================
// EXERCISE DETECTOR FACTORY
// ==========================================

function createExerciseDetector(exerciseId) {

  switch (exerciseId) {

    case "biceps_curl":
      return new BicepsCurlDetector();

    default:
      return null;
  }
}


// ==========================================
// POSE DETECTION HOOK
// ==========================================

export default function usePoseDetection({
  videoRef,
  canvasRef,
  enabled,
  sourceVersion,
  exerciseId,
}) {

  const poseResultRef = useRef(null);

  const [snapshot, setSnapshot] = useState(null);


  useEffect(() => {

    if (!enabled) return;

    let cancelled = false;

    let poseLandmarker = null;

    let animationFrameId = null;

    let lastVideoTime = -1;

    let lastInferenceTime = -Infinity;

    let lastUIUpdate = -Infinity;

    let lastReps = 0;

    const videoElement = videoRef.current;

    const canvas = canvasRef.current;


    // Create one detector per analysis session

    const detector =
      createExerciseDetector(exerciseId);


    poseResultRef.current = null;

    clearPoseCanvas(canvas);


    // ======================================
    // RESET ANALYSIS WHEN VIDEO IS SEEKED
    // ======================================

    function handleSeeking() {

      poseResultRef.current = null;

      lastVideoTime = -1;

      lastUIUpdate = -Infinity;

      lastReps = 0;

      detector?.reset();

      clearPoseCanvas(canvas);

      setSnapshot((previous) =>

        previous?.sourceVersion === sourceVersion &&
        previous?.exerciseId === exerciseId

          ? {
              ...previous,
              poseDetected: false,
              landmarkCount: 0,
              inferenceTime: 0,
              exerciseMetrics: null,
            }

          : previous
      );
    }

    videoElement?.addEventListener(
      "seeking",
      handleSeeking
    );


    // ======================================
    // PROCESS VIDEO FRAMES
    // ======================================

    function detectPose() {

      if (cancelled || !poseLandmarker) {
        return;
      }

      const video = videoRef.current;

      const now = performance.now();


      try {

        if (
          video &&
          video.readyState >= 2 &&
          !video.paused &&
          !video.ended &&
          !video.seeking &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          video.currentTime !== lastVideoTime &&
          now - lastInferenceTime >= FRAME_INTERVAL
        ) {

          // Handle backward playback jumps

          if (video.currentTime < lastVideoTime) {

            handleSeeking();
          }

          lastVideoTime = video.currentTime;

          lastInferenceTime = now;


          // ================================
          // MEDIAPIPE INFERENCE
          // ================================

          const inferenceStart = performance.now();

          const result =
            poseLandmarker.detectForVideo(
              video,
              inferenceStart
            );

          const inferenceDuration =
            performance.now() - inferenceStart;

          poseResultRef.current = result;

          const landmarks = result.landmarks?.[0];

          const landmarkCount =
            landmarks?.length ?? 0;


          // ================================
          // DRAW SKELETON OVER VIDEO
          // ================================

          drawPoseSkeleton(
            canvas,
            video,
            landmarks
          );


          // ================================
          // EXERCISE ANALYSIS
          // ================================

          const exerciseMetrics = detector

            ? detector.process(
                landmarks ?? [],
                video.videoWidth,
                video.videoHeight
              )

            : null;


          // ================================
          // UPDATE REACT UI
          // ================================

          const currentReps =
            exerciseMetrics?.reps ?? 0;

          const repChanged =
            currentReps !== lastReps;


          if (
            repChanged ||
            now - lastUIUpdate >= UI_UPDATE_INTERVAL
          ) {

            lastUIUpdate = now;

            lastReps = currentReps;

            setSnapshot({

              sourceVersion,
              exerciseId,

              status: "ready",

              poseDetected: landmarkCount > 0,

              landmarkCount,

              inferenceTime: inferenceDuration,

              exerciseMetrics,

              error: "",
            });
          }
        }

      } catch (err) {

        console.error(
          "Pose detection failed:",
          err
        );

        poseResultRef.current = null;

        clearPoseCanvas(canvas);

        setSnapshot({

          sourceVersion,
          exerciseId,

          status: "error",

          poseDetected: false,

          landmarkCount: 0,

          inferenceTime: 0,

          exerciseMetrics: null,

          error: "Pose detection failed.",
        });

        return;
      }


      animationFrameId =
        requestAnimationFrame(detectPose);
    }


    // ======================================
    // INITIALIZE MEDIAPIPE
    // ======================================

    async function initialize() {

      try {

        const { createPoseLandmarker } =
          await import(
            "../services/poseLandmarker.js"
          );

        if (cancelled) return;

        const model =
          await createPoseLandmarker();


        if (cancelled) {

          model.close();

          return;
        }

        poseLandmarker = model;


        setSnapshot({

          sourceVersion,
          exerciseId,

          status: "ready",

          poseDetected: false,

          landmarkCount: 0,

          inferenceTime: 0,

          exerciseMetrics: null,

          error: "",
        });


        animationFrameId =
          requestAnimationFrame(detectPose);

      } catch (err) {

        if (cancelled) return;

        console.error(
          "MediaPipe initialization failed:",
          err
        );

        setSnapshot({

          sourceVersion,
          exerciseId,

          status: "error",

          poseDetected: false,

          landmarkCount: 0,

          inferenceTime: 0,

          exerciseMetrics: null,

          error:
            "Could not initialize the AI pose model.",
        });
      }
    }

    initialize();


    // ======================================
    // CLEANUP
    // ======================================

    return () => {

      cancelled = true;

      videoElement?.removeEventListener(
        "seeking",
        handleSeeking
      );

      if (animationFrameId !== null) {

        cancelAnimationFrame(animationFrameId);
      }

      poseResultRef.current = null;

      clearPoseCanvas(canvas);

      detector?.reset();

      if (poseLandmarker) {

        poseLandmarker.close();

        poseLandmarker = null;
      }
    };

  }, [
    videoRef,
    canvasRef,
    enabled,
    sourceVersion,
    exerciseId,
  ]);


  // ==========================================
  // RETURN CURRENT ANALYSIS
  // ==========================================

  const currentSnapshot =

    enabled &&
    snapshot?.sourceVersion === sourceVersion &&
    snapshot?.exerciseId === exerciseId

      ? snapshot
      : null;


  return {

    poseResultRef,

    status: !enabled
      ? "idle"
      : currentSnapshot?.status ?? "loading",

    poseDetected:
      currentSnapshot?.poseDetected ?? false,

    landmarkCount:
      currentSnapshot?.landmarkCount ?? 0,

    inferenceTime:
      currentSnapshot?.inferenceTime ?? 0,

    exerciseMetrics:
      currentSnapshot?.exerciseMetrics ?? null,

    error:
      currentSnapshot?.error ?? "",
  };
}
