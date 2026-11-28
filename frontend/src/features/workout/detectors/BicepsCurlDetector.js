import {
  LANDMARKS,
  getPoint,
  calculateAngle,
} from "../utils/poseGeometry.js";

// Prototype thresholds: tune with real workout videos.
export const BICEPS_CURL_LIMITS = Object.freeze({
  minUpAngle: 35,
  maxUpAngle: 55,
  minDownAngle: 157,
  maxDownAngle: 180,
  elbowDriftTolerance: 0.06,
  swingThreshold: 15,
  badFormFrameLimit: 3,
});

const {
  minUpAngle: MIN_UP_ANGLE,
  maxUpAngle: MAX_UP_ANGLE,
  minDownAngle: MIN_DOWN_ANGLE,
  maxDownAngle: MAX_DOWN_ANGLE,
  elbowDriftTolerance: ELBOW_DRIFT_TOLERANCE,
  swingThreshold: SWING_THRESHOLD,
  badFormFrameLimit: BAD_FORM_FRAME_LIMIT,
} = BICEPS_CURL_LIMITS;

const ARMS = {
  left: {
    shoulder: LANDMARKS.LEFT_SHOULDER,
    elbow: LANDMARKS.LEFT_ELBOW,
    wrist: LANDMARKS.LEFT_WRIST,
    hip: LANDMARKS.LEFT_HIP,
  },
  right: {
    shoulder: LANDMARKS.RIGHT_SHOULDER,
    elbow: LANDMARKS.RIGHT_ELBOW,
    wrist: LANDMARKS.RIGHT_WRIST,
    hip: LANDMARKS.RIGHT_HIP,
  },
};

// Allow only negligible floating-point rounding at angle boundaries.
const inRange = (value, min, max) =>
  value >= min - 1e-9 && value <= max + 1e-9;

export default class BicepsCurlDetector {
  constructor() {
    this.reset();
  }

  reset() {
    this.reps = 0;
    this.stage = "waiting";
    this.side = null;
    this.badFormFrames = 0;
  }

  process(landmarks, width, height) {
    // Read shoulder, elbow and wrist; select the most visible arm.
    const readArm = (side) => {
      const ids = ARMS[side];
      const shoulder = getPoint(landmarks, ids.shoulder, width, height);
      const elbow = getPoint(landmarks, ids.elbow, width, height);
      const wrist = getPoint(landmarks, ids.wrist, width, height);
      const angle = calculateAngle(shoulder, elbow, wrist);

      if (!Number.isFinite(angle)) return null;

      const visibility = Math.min(
        landmarks[ids.shoulder].visibility,
        landmarks[ids.elbow].visibility,
        landmarks[ids.wrist].visibility,
      );
      return { side, ids, shoulder, elbow, angle, visibility };
    };

    const left = readArm("left");
    const right = readArm("right");
    const arm = (
      this.side === "left" ? left : this.side === "right" ? right : null
    ) ?? (left && right
      ? (left.visibility >= right.visibility ? left : right)
      : left ?? right);

    // Do not join partial movements across tracking loss or different arms.
    if (!arm) {
      this.stage = "waiting";
      this.side = null;
      this.badFormFrames = 0;
      return {
        reps: this.reps,
        stage: this.stage,
        side: null,
        elbowAngle: null,
        shoulderStatus: "N/A",
        swingStatus: "N/A",
        torsoAngle: null,
        tracking: false,
        isCorrectForm: false,
        badFormFrames: 0,
        elbowDrift: null,
      };
    }

    if (this.side !== arm.side) {
      this.stage = "waiting";
      this.side = arm.side;
      this.badFormFrames = 0;
    }

    // Joint angle uses only shoulder, elbow and wrist.
    const elbowAngle = arm.angle;

    // Preserve original horizontal-offset heuristic (fraction of video width).
    const drift = Math.abs(arm.elbow.x - arm.shoulder.x) / width;
    const shoulderStatus = drift <= ELBOW_DRIFT_TOLERANCE
      ? "STABLE" : "ELBOW DRIFTING";

    // Hip is used for form validation, not for the elbow-angle calculation.
    const hip = getPoint(landmarks, arm.ids.hip, width, height);
    let torsoAngle = null;
    let swingStatus = "N/A";

    if (hip) {
      const dx = arm.shoulder.x - hip.x;
      const dy = arm.shoulder.y - hip.y;
      if (Math.hypot(dx, dy) > 0) {
        torsoAngle = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
        swingStatus = torsoAngle <= SWING_THRESHOLD ? "NO SWING" : "SWINGING";
      }
    }

    const isCorrectForm = shoulderStatus === "STABLE" && swingStatus === "NO SWING";
    const isArmContracted = inRange(elbowAngle, MIN_UP_ANGLE, MAX_UP_ANGLE);
    const isArmExtended = inRange(elbowAngle, MIN_DOWN_ANGLE, MAX_DOWN_ANGLE);

    // Never advance the state or count on a bad-form frame.
    // One or two consecutive bad frames pause; three cancel the partial rep.
    if (swingStatus === "N/A") {
      this.stage = "waiting";
      this.badFormFrames = 0;
    } else if (!isCorrectForm) {
      this.badFormFrames += 1;
      if (this.badFormFrames >= BAD_FORM_FRAME_LIMIT) {
        this.stage = "waiting";
      }
    } else {
      this.badFormFrames = 0;
      if (isArmExtended) {
        if (this.stage === "up") this.reps += 1;
        this.stage = "down";
      } else if (isArmContracted && this.stage === "down") {
        this.stage = "up";
      }
    }

    return {
      reps: this.reps,
      stage: this.stage,
      side: this.side,
      elbowAngle,
      shoulderStatus,
      swingStatus,
      torsoAngle,
      tracking: true,
      isCorrectForm,
      badFormFrames: this.badFormFrames,
      elbowDrift: drift,
    };
  }
}
