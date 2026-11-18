
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ShieldCheck } from "lucide-react";

export default function LiveWorkoutPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(
          (track) => track.stop()
        );
        streamRef.current = null;
      }
    };
  }, []);

  async function startCamera() {
    setError("");
    setLoading(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API unavailable");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Allow camera access in your browser."
            : "Could not start camera. Check your device and permissions."
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(
        (track) => track.stop()
      );
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  }

  return (
    <section className="workout-page">
      <div className="page-heading">
        <h1>Live Workout Trainer</h1>
        <p>
          Your AI workout training environment
        </p>
      </div>

      <div className="workout-panel">
        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />

          {!cameraOn && (
            <div className="camera-placeholder">
              <Camera size={48} />
              <h3>Camera is off</h3>
              <p>Enable your camera to preview your workout.</p>
            </div>
          )}
        </div>

        <div className="camera-actions">
          {!cameraOn ? (
            <button
              className="primary-button"
              onClick={startCamera}
              disabled={loading}
            >
              <Camera size={18} />
              {loading ? "Starting..." : "Start Camera"}
            </button>
          ) : (
            <button
              className="secondary-button"
              onClick={stopCamera}
            >
              <CameraOff size={18} />
              Stop Camera
            </button>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="privacy-note">
          <ShieldCheck size={20} />
          <span>
            Camera preview runs locally in your browser.
            Video frames are not sent to FastAPI.
          </span>
        </div>

        <p className="phase-note">
          Phase 1: Camera preview only. Pose detection,
          rep counting and posture coaching will be
          implemented in Phase 5.
        </p>
      </div>
    </section>
  );
}
