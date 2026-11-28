import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  CameraOff,
  ShieldCheck,
  Upload,
  Video,
  FileVideo,
  X,
} from "lucide-react";

import WorkoutPlan from "../features/workout/components/WorkoutPlan";
import ExerciseMetrics from "../features/workout/components/ExerciseMetrics";
import {
  BicepsRepBar,
  BicepsLeftMetrics,
  BicepsRightMetrics,
} from "../features/workout/components/BicepsWorkoutHud.jsx";
import { BICEPS_CURL_LIMITS } from "../features/workout/detectors/BicepsCurlDetector.js";


import {
  DEFAULT_WORKOUT_PLAN,
} from "../features/workout/workoutConfig";

import usePoseDetection from
  "../features/workout/hooks/usePoseDetection";

export default function LiveWorkoutPage() {

  // ==========================================
  // REFERENCES
  // ==========================================

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoUrlRef = useRef(null);
  const requestIdRef = useRef(0);


  // ==========================================
  // STATE
  // ==========================================

  const [mode, setMode] = useState("live");

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [videoName, setVideoName] = useState("");
  const [workoutPlan, setWorkoutPlan] = useState({ ...DEFAULT_WORKOUT_PLAN, });
  const [sourceVersion, setSourceVersion] = useState(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState(null);
  const isBicepsCurl = workoutPlan.exerciseId === "biceps_curl";

  // Only updates when the intrinsic video dimensions change, not every frame.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function updateAspectRatio() {
      const { videoWidth, videoHeight } = video;
      if (videoWidth > 0 && videoHeight > 0) {
        setVideoAspectRatio(videoWidth / videoHeight);
      }
    }
    video.addEventListener("loadedmetadata", updateAspectRatio);
    video.addEventListener("resize", updateAspectRatio);
    return () => {
      video.removeEventListener("loadedmetadata", updateAspectRatio);
      video.removeEventListener("resize", updateAspectRatio);
    };
  }, []);

  // ==========================================
  // AI POSE DETECTION
  // ==========================================

  const {
    status: poseStatus,
    poseDetected,
    landmarkCount,
    inferenceTime,
    exerciseMetrics,
    error: poseError,
  } = usePoseDetection({
    videoRef,
    canvasRef,
    enabled: mode === "live" ? cameraOn : Boolean(videoName),
    sourceVersion,
    exerciseId: workoutPlan.exerciseId,
  });


  // ==========================================
  // RELEASE CAMERA AND VIDEO RESOURCES
  // ==========================================

  const releaseMedia = useCallback(() => {

    // Invalidate pending camera requests
    requestIdRef.current += 1;

    // Stop webcam tracks
    if (streamRef.current) {

      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {

      videoRef.current.pause();

      videoRef.current.srcObject = null;

      videoRef.current.removeAttribute("src");

      videoRef.current.load();
    }

    // Release uploaded video URL
    if (videoUrlRef.current) {

      URL.revokeObjectURL(videoUrlRef.current);

      videoUrlRef.current = null;
    }

  }, []);


  // Cleanup when leaving the workout page

  useEffect(() => {

    return () => {
      releaseMedia();
    };

  }, [releaseMedia]);


  // ==========================================
  // RESET MEDIA STATE
  // ==========================================

  function resetMedia() {

    releaseMedia();

    setSourceVersion((previousVersion) => previousVersion + 1);
    setVideoAspectRatio(null);

    setCameraOn(false);
    setVideoName("");
    setLoading(false);
    setError("");
  }


  // ==========================================
  // SWITCH WORKOUT MODE
  // ==========================================

  function changeMode(nextMode) {

    if (nextMode === mode) {
      return;
    }

    resetMedia();

    setMode(nextMode);
  }


  // ==========================================
  // START LIVE CAMERA
  // ==========================================

  async function startCamera() {

    resetMedia();

    setLoading(true);

    const requestId = requestIdRef.current;

    try {

      if (!navigator.mediaDevices?.getUserMedia) {

        throw new Error("Camera API unavailable");
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({

          video: {
            facingMode: "user",
          },

          audio: false,
        });


      // Stop a stream that arrived after switching
      // modes or leaving the workout page

      if (requestId !== requestIdRef.current) {

        stream.getTracks().forEach(
          (track) => track.stop()
        );

        return;
      }


      streamRef.current = stream;

      if (videoRef.current) {

        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);

    } catch (err) {

      if (requestId !== requestIdRef.current) {
        return;
      }

      resetMedia();

      setError(
        err.name === "NotAllowedError"

          ? "Camera permission denied. Allow camera access in your browser."

          : "Could not start camera. Check your device and permissions."
      );

    } finally {

      if (requestId === requestIdRef.current) {

        setLoading(false);
      }
    }
  }


  // ==========================================
  // STOP LIVE CAMERA
  // ==========================================

  function stopCamera() {

    resetMedia();
  }


  // ==========================================
  // SELECT WORKOUT VIDEO
  // ==========================================

  function handleVideoUpload(event) {

    const file = event.target.files?.[0];

    // Allow the same file to be selected again
    event.target.value = "";

    if (!file) {
      return;
    }


    // Basic video file validation

    const isVideo =
      file.type.startsWith("video/") ||
      (
        !file.type &&
        /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name)
      );

    if (!isVideo) {

      setError("Please select a valid video file.");

      return;
    }

    if (file.size === 0) {

      setError("The selected video is empty.");

      return;
    }


    // Release any previous video or camera

    resetMedia();

    try {

      // Create a local URL for the selected file

      const videoUrl = URL.createObjectURL(file);

      videoUrlRef.current = videoUrl;


      if (videoRef.current) {

        videoRef.current.src = videoUrl;

        videoRef.current.load();
      }

      setVideoName(file.name);

    } catch {

      resetMedia();

      setError("Could not load the selected video.");
    }
  }


  // ==========================================
  // HANDLE UNSUPPORTED VIDEO FORMATS
  // ==========================================

  function handleVideoError() {

    if (
      videoUrlRef.current &&
      videoRef.current?.error
    ) {

      resetMedia();

      setError(
        "This video could not be played. Try an MP4 or WebM video."
      );
    }
  }


  // ==========================================
  // REMOVE UPLOADED VIDEO
  // ==========================================

  function removeVideo() {

    resetMedia();
  }


  // ==========================================
  // USER INTERFACE
  // ==========================================

  return (

    <section className="workout-page fv-live-redesign">

      {/* Hero Heading */}

      <div className="hero-content">

        <div className="ai-badge">

          <span className="live-dot"></span>

          AI-POWERED FITNESS

        </div>

        <h1 className="hero-heading">

          Your Camera Is Now

          <br />

          <span className="highlight">

            Your Gym Coach.

          </span>

        </h1>

        <p className="hero-description">

          Train smarter. Move better. Get stronger.

        </p>

      </div>

      {/* Workout Configuration */}

      <WorkoutPlan
        plan={workoutPlan}
        onChange={setWorkoutPlan}
        disabled={loading || cameraOn || Boolean(videoName)}
      />
      {/* Workout Panel */}

      <div className={`workout-panel${isBicepsCurl ? " fv-workout-panel--biceps" : ""}`}>


        {/* Workout Mode Selection */}

        <div
          className="workout-mode-selector"
          role="group"
          aria-label="Workout video source"
        >

          <button
            type="button"
            className={`workout-mode-button ${mode === "live" ? "active" : ""
              }`}
            aria-pressed={mode === "live"}
            onClick={() => changeMode("live")}
          >

            <Video size={20} />

            Live Camera

          </button>


          <button
            type="button"
            className={`workout-mode-button ${mode === "upload" ? "active" : ""
              }`}
            aria-pressed={mode === "upload"}
            onClick={() => changeMode("upload")}
          >

            <Upload size={20} />

            Upload Video

          </button>

        </div>


        {/* Sticky bar stays inside the full-height workout panel. */}
        {isBicepsCurl && (
          <BicepsRepBar
            reps={exerciseMetrics?.reps ?? 0}
            plan={workoutPlan}
            tracking={Boolean(exerciseMetrics?.tracking)}
            correctForm={exerciseMetrics?.isCorrectForm === true}
            formUnavailable={exerciseMetrics?.swingStatus === "N/A" && exerciseMetrics?.shoulderStatus !== "ELBOW DRIFTING"}
            cancelled={(exerciseMetrics?.badFormFrames ?? 0) >= BICEPS_CURL_LIMITS.badFormFrameLimit}
          />
        )}

        {/* Keep the video and canvas mounted in the same shared preview. */}
        <div className={`fv-camera-layout${isBicepsCurl ? " fv-camera-layout--biceps" : ""}`}>
          {isBicepsCurl && (
            <BicepsLeftMetrics
              tracking={Boolean(exerciseMetrics?.tracking)}
              elbowAngle={exerciseMetrics?.elbowAngle}
              shoulderStatus={exerciseMetrics?.shoulderStatus}
            />
          )}
          <div className="fv-camera-center">
            <div
              className={`camera-preview pose-preview ${mode === "upload" ? "upload-preview" : ""}`}
              style={isBicepsCurl && videoAspectRatio ? { aspectRatio: videoAspectRatio } : undefined}
            >

              <video
                ref={videoRef}
                autoPlay={mode === "live"}
                playsInline
                muted={mode === "live"}
                controls={
                  mode === "upload" && Boolean(videoName)
                }
                onError={handleVideoError}
                className={`camera-video ${mode === "upload"
                    ? "uploaded-video"
                    : ""
                  }`}
              />


              <canvas
                ref={canvasRef}
                className="pose-overlay"
                aria-hidden="true"
              />

              {/* Live Camera Placeholder */}

              {mode === "live" && !cameraOn && (

                <div className="camera-placeholder">

                  <Camera size={48} />

                  <h3>Camera is off</h3>

                  <p>
                    Enable your camera to preview
                    your workout.
                  </p>

                </div>

              )}


              {/* Upload Video Placeholder */}

              {mode === "upload" && !videoName && (

                <div className="camera-placeholder">

                  <FileVideo size={48} />

                  <h3>No video selected</h3>

                  <p>
                    Choose a prerecorded workout video
                    from your device.
                  </p>

                </div>

              )}

            </div>
          </div>
          {isBicepsCurl && (
            <BicepsRightMetrics
              tracking={Boolean(exerciseMetrics?.tracking)}
              stage={exerciseMetrics?.stage}
              side={exerciseMetrics?.side}
            />
          )}
        </div>

        {/* AI Pose Detection Status */}

        <div className="pose-status-panel">
          <div className="pose-status-item">
            <span>AI Model</span>
            <strong className={`pose-status-value ${poseStatus}`}>
              {poseStatus === "idle"
                ? "Inactive"
                : poseStatus === "loading"
                  ? "Loading..."
                  : poseStatus === "ready"
                    ? "Ready"
                    : "Error"}
            </strong>
          </div>

          <div className="pose-status-item">
            <span>Body Detection</span>
            <strong
              className={`pose-status-value ${
                poseDetected ? "ready" : "waiting"
              }`}
            >
              {poseDetected ? "Pose Detected" : "No Pose Detected"}
            </strong>
          </div>

          <div className="pose-status-item">
            <span>Landmarks</span>
            <strong>{landmarkCount} / 33</strong>
          </div>

          <div className="pose-status-item">
            <span>Inference Time</span>
            <strong>
              {inferenceTime > 0
                ? `${inferenceTime.toFixed(2)} ms`
                : "--"}
            </strong>
          </div>
        </div>

        {poseError && (
          <p className="error-message" role="alert">
            {poseError}
          </p>
        )}

        {/* Live Camera Actions */}

        {mode === "live" && (

          <div className="camera-actions">

            {!cameraOn ? (

              <button
                type="button"
                className="primary-button"
                onClick={startCamera}
                disabled={loading}
              >

                <Camera size={18} />

                {loading
                  ? "Starting..."
                  : "Start Camera"}

              </button>

            ) : (

              <button
                type="button"
                className="secondary-button"
                onClick={stopCamera}
              >

                <CameraOff size={18} />

                Stop Camera

              </button>

            )}

          </div>

        )}


        {/* Upload Video Actions */}

        {mode === "upload" && (

          <>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              hidden
            />


            <div className="camera-actions">

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >

                <Upload size={18} />

                {videoName
                  ? "Change Video"
                  : "Choose Video"}

              </button>


              {videoName && (

                <button
                  type="button"
                  className="secondary-button"
                  onClick={removeVideo}
                >

                  <X size={18} />

                  Remove Video

                </button>

              )}

            </div>


            {videoName && (

              <div className="uploaded-file-info">

                <FileVideo size={20} />

                <span>{videoName}</span>

              </div>

            )}

            <p className="video-format-note">

              Recommended formats: MP4 and WebM.
              Playback depends on browser support.

            </p>

          </>

        )}


        {/* Error Message */}

        {error && (

          <p className="error-message" role="alert">

            {error}

          </p>

        )}


        <ExerciseMetrics
          exerciseId={workoutPlan.exerciseId}
          metrics={exerciseMetrics}
          plan={workoutPlan}
        />

        {/* Privacy Note */}

        <div className="privacy-note">

          <ShieldCheck size={20} />

          <span>

            Camera and selected videos run locally
            in your browser. Video frames are not
            sent to FastAPI.

          </span>

        </div>


        <p className="phase-note">

          AI pose detection runs locally in your browser.
          The skeleton is drawn from detected body landmarks.
          Biceps Curl repetition counting and form feedback are available.

        </p>

      </div>

    </section>
  );
}
