
import {
  Dumbbell,
  Target,
  Camera,
  Layers,
} from "lucide-react";

import {
  EXERCISES,
  WORKOUT_LIMITS,
} from "../workoutConfig";


export default function WorkoutPlan({
  plan,
  onChange,
  disabled = false,
}) {

  const selectedExercise = EXERCISES.find(
    (exercise) => exercise.id === plan.exerciseId
  );


  // Update individual workout configuration fields

  function updatePlan(field, value) {

    onChange((previousPlan) => ({
      ...previousPlan,
      [field]: value,
    }));
  }


  // Keep numeric values within allowed limits

  function normalizeNumber(value, min, max) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.min(
      max,
      Math.max(min, Math.trunc(number))
    );
  }


  return (

    <div className="workout-plan">

      {/* Heading */}

      <div className="workout-plan-heading">

        <div className="workout-plan-icon">
          <Dumbbell size={24} />
        </div>

        <div>

          <h2>Configure Your Workout</h2>

          <p>Customize your training session.</p>

        </div>

      </div>


      {/* Workout Form */}

      <div className="workout-plan-grid">

        {/* Exercise Selection */}

        <div className="workout-plan-field">

          <label htmlFor="workout-exercise">
            Select Exercise
          </label>

          <select
            id="workout-exercise"
            value={plan.exerciseId}
            disabled={disabled}
            onChange={(event) =>
              updatePlan(
                "exerciseId",
                event.target.value
              )
            }
          >

            {EXERCISES.map((exercise) => (

              <option
                key={exercise.id}
                value={exercise.id}
              >
                {exercise.name}
              </option>

            ))}

          </select>

        </div>


        {/* Number of Sets */}

        <div className="workout-plan-field">

          <label htmlFor="workout-sets">
            Number of Sets
          </label>

          <input
            id="workout-sets"
            type="number"
            min={WORKOUT_LIMITS.minSets}
            max={WORKOUT_LIMITS.maxSets}
            step={1}
            value={plan.sets}
            disabled={disabled}
            onChange={(event) =>
              updatePlan(
                "sets",
                event.target.value === ""
                  ? ""
                  : Number(event.target.value)
              )
            }
            onBlur={() =>
              updatePlan(
                "sets",
                normalizeNumber(
                  plan.sets,
                  WORKOUT_LIMITS.minSets,
                  WORKOUT_LIMITS.maxSets
                )
              )
            }
          />

        </div>


        {/* Repetitions Per Set */}

        <div className="workout-plan-field">

          <label htmlFor="workout-reps">
            Reps Per Set
          </label>

          <input
            id="workout-reps"
            type="number"
            min={WORKOUT_LIMITS.minReps}
            max={WORKOUT_LIMITS.maxReps}
            step={1}
            value={plan.repsPerSet}
            disabled={disabled}
            onChange={(event) =>
              updatePlan(
                "repsPerSet",
                event.target.value === ""
                  ? ""
                  : Number(event.target.value)
              )
            }
            onBlur={() =>
              updatePlan(
                "repsPerSet",
                normalizeNumber(
                  plan.repsPerSet,
                  WORKOUT_LIMITS.minReps,
                  WORKOUT_LIMITS.maxReps
                )
              )
            }
          />

        </div>

      </div>


      {/* Workout Information */}

      <div className="workout-plan-summary">

        <div className="workout-plan-stat">

          <Layers size={20} />

          <div>

            <span>Muscle Group</span>

            <strong>
              {selectedExercise?.muscleGroup ?? "N/A"}
            </strong>

          </div>

        </div>


        <div className="workout-plan-stat">

          <Camera size={20} />

          <div>

            <span>Camera Position</span>

            <strong>
              {selectedExercise?.cameraPosition ?? "N/A"}
            </strong>

          </div>

        </div>


        <div className="workout-plan-stat">

          <Target size={20} />

          <div>

            <span>Target Reps</span>

            <strong>
              {
                normalizeNumber(
                  plan.sets,
                  WORKOUT_LIMITS.minSets,
                  WORKOUT_LIMITS.maxSets
                ) *
                normalizeNumber(
                  plan.repsPerSet,
                  WORKOUT_LIMITS.minReps,
                  WORKOUT_LIMITS.maxReps
                )
              }
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}
