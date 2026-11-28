import { CircleCheck, Minus, Scan, ShieldCheck, TriangleAlert } from "lucide-react";
import { BICEPS_CURL_LIMITS } from "../detectors/BicepsCurlDetector.js";
import { getRepProgress } from "./BicepsWorkoutHud.jsx";

function FeedbackRow({ label, state, hint }) {
  const Icon = state === "good" ? CircleCheck : state === "warn" ? TriangleAlert : Minus;
  return (
    <div className={`fv-feedback-row ${state}`}>
      <Icon size={20} aria-hidden="true" />
      <div><strong>{label}</strong><small>{hint}</small></div>
      <span>{state === "good" ? "Good" : state === "warn" ? "Adjust" : "Waiting"}</span>
    </div>
  );
}

// Coach remains below the camera. Rep and joint cards moved to the HUD.
export default function ExerciseMetrics({ exerciseId, metrics, plan }) {
  if (exerciseId !== "biceps_curl") {
    return <p className="phase-note">Automatic tracking for this exercise is coming soon.</p>;
  }

  const tracking = Boolean(metrics?.tracking);
  const elbow = !tracking ? "unknown" : metrics?.shoulderStatus === "STABLE"
    ? "good" : metrics?.shoulderStatus === "ELBOW DRIFTING" ? "warn" : "unknown";
  const torso = !tracking ? "unknown" : metrics?.swingStatus === "NO SWING"
    ? "good" : metrics?.swingStatus === "SWINGING" ? "warn" : "unknown";
  const countingEnabled = tracking && metrics?.isCorrectForm === true;
  const limits = BICEPS_CURL_LIMITS;
  const cancelled = (metrics?.badFormFrames ?? 0) >= limits.badFormFrameLimit;
  const targetReached = getRepProgress(metrics?.reps, plan).reached;
  const rawAngle = metrics?.elbowAngle;

  // Keep the short coach messages; form warnings take priority over celebration.
  let formType = "waiting";
  let formMessage = "Keep your arm visible.";
  if (tracking && elbow === "warn" && torso === "warn") {
    formType = "error";
    formMessage = "Stand upright. Keep elbows still.";
  } else if (tracking && elbow === "warn") {
    formType = "error";
    formMessage = "Keep your elbows still.";
  } else if (tracking && torso === "warn") {
    formType = "error";
    formMessage = "Stand upright.";
  } else if (targetReached) {
    formType = "success";
    formMessage = "Great job! Target reached.";
  } else if (!tracking) {
    formMessage = "Keep your arm visible.";
  } else if (torso === "unknown") {
    formMessage = "Keep your torso visible.";
  } else if (!countingEnabled) {
    formMessage = "Correct your position.";
  } else if (metrics?.stage === "waiting") {
    formMessage = "Extend your arm.";
  } else if (metrics?.stage === "down") {
    formType = "success";
    formMessage = "Curl up slowly.";
    if (Number.isFinite(rawAngle) && rawAngle < limits.minUpAngle) {
      formType = "waiting";
      formMessage = "Relax your curl slightly.";
    }
  } else if (metrics?.stage === "up") {
    formType = "success";
    formMessage = "Lower your arm slowly.";
  }

  const status = formType === "error" ? (cancelled ? "Movement rejected" : "Counting paused")
    : targetReached ? "Target reached" : !tracking ? "Waiting"
    : countingEnabled ? "Counting enabled" : "Counting paused";

  return (
    <section className="fv-analysis fv-coach-panel" aria-label="Biceps curl form feedback">
      <div className={`fv-coach-message ${formType}`}>
        <div className="fv-coach-heading">
          {formType === "error" ? <TriangleAlert size={20} aria-hidden="true" />
            : formType === "success" ? <CircleCheck size={20} aria-hidden="true" />
            : <Scan size={20} aria-hidden="true" />}
          <h3>AI Personal Coach</h3>
          <span className="fv-coach-status">{status}</span>
        </div>
        <p>{formMessage}</p>
      </div>
      <div className="fv-feedback">
        <h3><ShieldCheck size={19} aria-hidden="true" /> AI Form Feedback</h3>
        <FeedbackRow label="Elbow alignment" state={elbow}
          hint={elbow === "warn" ? "Keep your elbows still." : elbow === "good" ? "Good elbow position." : "Keep your arm visible."} />
        <FeedbackRow label="Torso posture" state={torso}
          hint={torso === "warn" ? "Stand upright." : torso === "good" ? "Good torso posture." : "Keep your torso visible."} />
      </div>
      <p className="fv-analysis-footer"><ShieldCheck size={15} aria-hidden="true" /> Private, on-device AI processing</p>
    </section>
  );
}
