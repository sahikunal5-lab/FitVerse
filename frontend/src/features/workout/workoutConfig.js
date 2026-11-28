export const EXERCISES = [
  {
    id: "biceps_curl",
    name: "Biceps Curls (Dumbbell)",
    muscleGroup: "Biceps",
    cameraPosition: "Side view",
    metrics: [
      "elbowAngle",
      "shoulderStatus",
      "swingStatus",
    ],
  },
  {
    id: "squat",
    name: "Squats",
    muscleGroup: "Lower Body",
    cameraPosition: "Side view",
    metrics: [
      "kneeAngle",
      "backAngle",
      "depthStatus",
    ],
  },
  {
    id: "pushup",
    name: "Push-ups",
    muscleGroup: "Chest and Triceps",
    cameraPosition: "Side view",
    metrics: [
      "elbowAngle",
      "bodyAlignment",
      "hipStatus",
    ],
  },
  {
    id: "shoulder_press",
    name: "Shoulder Press",
    muscleGroup: "Shoulders",
    cameraPosition: "Front view",
    metrics: [
      "elbowAngle",
      "extensionStatus",
      "backArchStatus",
    ],
  },
  {
    id: "lunges",
    name: "Lunges",
    muscleGroup: "Lower Body",
    cameraPosition: "Side view",
    metrics: [
      "frontKneeAngle",
      "torsoAngle",
      "balanceStatus",
    ],
  },
];

export const DEFAULT_WORKOUT_PLAN = {
  exerciseId: "biceps_curl",
  sets: 3,
  repsPerSet: 10,
};

export const WORKOUT_LIMITS = {
  minSets: 1,
  maxSets: 50,
  minReps: 1,
  maxReps: 50,
};