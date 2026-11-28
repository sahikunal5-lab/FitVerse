import { memo, useLayoutEffect, useRef } from "react";
import {
  Activity, ArrowDown, ArrowUp, ArrowUpDown, CircleCheck,
  Dumbbell, Scan, ShieldCheck, TriangleAlert,
} from "lucide-react";
import { BICEPS_CURL_LIMITS } from "../detectors/BicepsCurlDetector.js";

// Display-only helpers. The detector is the single source of truth.
export function getRepProgress(repsValue, plan) {
  const reps = Number.isFinite(Number(repsValue))
    ? Math.max(0, Math.floor(Number(repsValue))) : 0;
  const sets = Number(plan?.sets);
  const perSet = Number(plan?.repsPerSet);
  const target = Number.isInteger(sets) && sets > 0 &&
    Number.isInteger(perSet) && perSet > 0 ? sets * perSet : 0;
  return {
    reps, target,
    percent: target ? Math.min(100, Math.round(reps / target * 100)) : 0,
    reached: target > 0 && reps >= target,
  };
}

// Measure the real sticky header, including responsive menu expansion.
// Write only to the bar's CSS variable: no state update or pose-loop restart.
function useHeaderOffset(barRef) {
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const header = document.querySelector(".site-header");
    function update() {
      let offset = 0;
      if (header) {
        const style = window.getComputedStyle(header);
        if (style.position === "sticky" || style.position === "fixed") {
          offset = Math.max(0, (parseFloat(style.top) || 0) +
            header.getBoundingClientRect().height);
        }
      }
      bar.style.setProperty("--fv-header-offset", `${Math.ceil(offset)}px`);
    }
    update();
    const observer = header && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(update) : null;
    observer?.observe(header);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [barRef]);
}

export const BicepsRepBar = memo(function BicepsRepBar({
  reps, plan, tracking, correctForm, cancelled, formUnavailable,
}) {
  const barRef = useRef(null);
  useHeaderOffset(barRef);
  const progress = getRepProgress(reps, plan);
  const state = !tracking || formUnavailable ? "neutral" : correctForm ? "good" : "bad";
  const status = !tracking ? "Waiting for pose" : correctForm
    ? "Tracking" : cancelled ? "Movement rejected" : "Counting paused";

  return (
    <section ref={barRef} className="fv-rep-bar" aria-label="Biceps curl repetition counter">
      <div className="fv-rep-bar-main">
        <div className="fv-rep-bar-icon"><Dumbbell size={25} aria-hidden="true" /></div>
        <div className="fv-rep-bar-copy">
          <span className="fv-rep-bar-label">REPETITIONS</span>
          <div className="fv-rep-bar-number">
            <strong>{progress.reps}</strong>
            <span>{progress.target ? `/ ${progress.target} reps` : "reps"}</span>
          </div>
        </div>
      </div>
      {progress.target > 0 && (
        <div className="fv-rep-bar-progress">
          <div className="fv-rep-bar-progress-label">
            <span>{progress.reached ? "Target reached" : `${progress.target - progress.reps} remaining`}</span>
            <strong>{progress.percent}%</strong>
          </div>
          <progress max={progress.target} value={Math.min(progress.reps, progress.target)} aria-label="Repetition target progress" />
        </div>
      )}
      <span className={`fv-rep-bar-status ${state}`}>
        <span aria-hidden="true" />{status}
      </span>
    </section>
  );
});

const MetricCard = memo(function MetricCard({ icon: Icon, label, value, hint, state = "neutral" }) {
  return (
    <div className={`fv-camera-metric ${state}`}>
      <div className="fv-camera-metric-label">
        <span className="fv-camera-metric-icon"><Icon size={21} aria-hidden="true" /></span>
        <span>{label}</span>
      </div>
      <strong className="fv-camera-metric-value">{value}</strong>
      <small>{hint}</small>
    </div>
  );
});

export const BicepsLeftMetrics = memo(function BicepsLeftMetrics({ tracking, elbowAngle, shoulderStatus }) {
  const hasAngle = tracking && Number.isFinite(elbowAngle);
  const stable = tracking && shoulderStatus === "STABLE";
  const drifting = tracking && shoulderStatus === "ELBOW DRIFTING";
  const limits = BICEPS_CURL_LIMITS;
  return (
    <div className="fv-camera-metrics fv-camera-metrics--left" aria-label="Elbow metrics">
      <MetricCard icon={Activity} label="Elbow angle"
        value={hasAngle ? `${elbowAngle.toFixed(1)}°` : "Not Detected"}
        hint={hasAngle ? `Curl ${limits.minUpAngle}°–${limits.maxUpAngle}° · Extend ${limits.minDownAngle}°–${limits.maxDownAngle}°` : "Keep your arm visible"} />
      <MetricCard icon={stable ? CircleCheck : drifting ? TriangleAlert : ShieldCheck}
        label="Elbow stability" state={stable ? "good" : drifting ? "bad" : "neutral"}
        value={stable ? "Stable" : drifting ? "Drifting" : "Not Detected"}
        hint={stable ? "Good elbow position" : drifting ? "Keep your elbow still" : "Waiting for arm tracking"} />
    </div>
  );
});

export const BicepsRightMetrics = memo(function BicepsRightMetrics({ tracking, stage, side }) {
  const up = tracking && stage === "up";
  const down = tracking && stage === "down";
  const arm = tracking && side === "left" ? "Left Arm"
    : tracking && side === "right" ? "Right Arm" : "Not Detected";
  return (
    <div className="fv-camera-metrics fv-camera-metrics--right" aria-label="Movement metrics">
      <MetricCard icon={up ? ArrowUp : down ? ArrowDown : ArrowUpDown}
        label="Movement stage" value={up ? "UP" : down ? "DOWN" : "Not Detected"}
        hint={up ? "Arm contracted" : down ? "Arm extended" : "No valid stage"} />
      <MetricCard icon={Scan} label="Tracked arm" value={arm}
        hint={arm === "Not Detected" ? "Waiting for landmarks" : "Active landmark tracking"} />
    </div>
  );
});
