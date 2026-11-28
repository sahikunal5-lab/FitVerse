
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Save,
} from "lucide-react";

import {
  getCachedFitnessProfile,
  saveCachedFitnessProfile,
} from "../../services/profileCache";


// ==========================================
// EMPTY FITNESS FORM
// ==========================================

const emptyForm = {
  age: "",
  height_cm: "",
  weight_kg: "",
  fitness_goal: "",
  experience_level: "",
  activity_level: "",
};


// ==========================================
// CONVERT API DATA TO FORM VALUES
// ==========================================

function toFormValues(data) {

  if (!data) return { ...emptyForm };

  return {
    age: String(data.age ?? ""),
    height_cm: String(data.height_cm ?? ""),
    weight_kg: String(data.weight_kg ?? ""),
    fitness_goal: data.fitness_goal ?? "",
    experience_level: data.experience_level ?? "",
    activity_level: data.activity_level ?? "",
  };

}


// ==========================================
// VALIDATE OPTIONAL NUMERIC INPUTS
// ==========================================

function optionalNumber(
  value,
  label,
  min,
  max,
  integer = false
) {

  if (value.trim() === "") return null;

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < min ||
    number > max
  ) {
    throw new Error(
      `${label} must be between ${min} and ${max}.`
    );
  }

  if (integer && !Number.isInteger(number)) {
    throw new Error(
      `${label} must be a whole number.`
    );
  }

  if (
    !integer &&
    Math.abs(number * 10 - Math.round(number * 10)) > 1e-6
  ) {
    throw new Error(
      `${label} allows only one decimal place.`
    );
  }

  return number;
}


// ==========================================
// FITNESS PREFERENCES COMPONENT
// ==========================================

export default function FitnessPreferencesForm({
  onBack,
  userId,
}) {

  const [form, setForm] = useState({
    ...emptyForm,
  });

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);


  // ==========================================
  // LOAD FITNESS PREFERENCES WITH CACHE
  // ==========================================

  useEffect(() => {

    let active = true;

    async function loadPreferences() {

      setLoading(true);
      setLoadFailed(false);
      setError("");
      setSuccess("");

      try {

        // Use cached preferences if available.
        // Otherwise fetch from FastAPI.

        const data = await getCachedFitnessProfile(
          userId
        );

        if (active) {

          setForm(toFormValues(data));

        }

      } catch (err) {

        if (active) {

          setLoadFailed(true);

          setError(
            err.message ||
            "Unable to load fitness preferences."
          );

        }

      } finally {

        if (active) {
          setLoading(false);
        }

      }

    }

    loadPreferences();

    return () => {
      active = false;
    };

  }, [reloadKey, userId]);


  // ==========================================
  // UPDATE INPUT VALUES
  // ==========================================

  function handleChange(event) {

    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");

  }


  // ==========================================
  // SAVE FITNESS PREFERENCES WITH CACHE
  // ==========================================

  async function handleSubmit(event) {

    event.preventDefault();

    if (saving || loading || loadFailed) return;

    setError("");
    setSuccess("");

    try {

      // 1. Validate inputs

      const payload = {

        age: optionalNumber(
          form.age,
          "Age",
          13,
          120,
          true
        ),

        height_cm: optionalNumber(
          form.height_cm,
          "Height",
          50,
          250
        ),

        weight_kg: optionalNumber(
          form.weight_kg,
          "Weight",
          10,
          400
        ),

        fitness_goal:
          form.fitness_goal || null,

        experience_level:
          form.experience_level || null,

        activity_level:
          form.activity_level || null,

      };


      // 2. Start saving

      setSaving(true);


      // 3. Save to FastAPI and update cache

      const saved = await saveCachedFitnessProfile(
        userId,
        payload
      );


      // 4. Update form with saved response

      setForm(toFormValues(saved));


      // 5. Show success message

      setSuccess(
        "Fitness preferences saved successfully."
      );

    } catch (err) {

      setError(
        err.message ||
        "Unable to save fitness preferences."
      );

    } finally {

      setSaving(false);

    }

  }


  // ==========================================
  // USER INTERFACE
  // ==========================================

  return (

    <section className="fv-fitness-view">

      {/* HEADER */}

      <div className="fv-fitness-heading">

        <button
          type="button"
          className="fv-fitness-back"
          onClick={onBack}
          disabled={saving}
          aria-label="Back to account menu"
        >
          <ArrowLeft size={19} />
        </button>

        <div>
          <h3>Fitness Preferences</h3>
          <p>Personalize your FitOrbit experience</p>
        </div>

      </div>


      {/* LOADING */}

      {loading ? (

        <p
          className="fv-fitness-message"
          role="status"
        >
          Loading your preferences...
        </p>

      ) : loadFailed ? (

        /* API ERROR */

        <div
          className="fv-fitness-message"
          role="alert"
        >

          <p>{error}</p>

          <button
            type="button"
            className="fv-fitness-retry"
            onClick={() =>
              setReloadKey((n) => n + 1)
            }
          >

            <RefreshCw size={15} />
            Retry

          </button>

        </div>

      ) : (

        /* FITNESS PREFERENCES FORM */

        <form onSubmit={handleSubmit}>

          <div className="fv-fitness-grid">


            {/* AGE */}

            <label className="fv-fitness-field">

              <span>Age</span>

              <input
                type="number"
                name="age"
                min="13"
                max="120"
                step="1"
                placeholder="Years"
                value={form.age}
                onChange={handleChange}
                disabled={saving}
              />

            </label>


            {/* HEIGHT */}

            <label className="fv-fitness-field">

              <span>Height (cm)</span>

              <input
                type="number"
                name="height_cm"
                min="50"
                max="250"
                step="0.1"
                placeholder="e.g. 175"
                value={form.height_cm}
                onChange={handleChange}
                disabled={saving}
              />

            </label>


            {/* WEIGHT */}

            <label className="fv-fitness-field">

              <span>Weight (kg)</span>

              <input
                type="number"
                name="weight_kg"
                min="10"
                max="400"
                step="0.1"
                placeholder="e.g. 65"
                value={form.weight_kg}
                onChange={handleChange}
                disabled={saving}
              />

            </label>


            {/* FITNESS GOAL */}

            <label className="fv-fitness-field">

              <span>Fitness Goal</span>

              <select
                name="fitness_goal"
                value={form.fitness_goal}
                onChange={handleChange}
                disabled={saving}
              >

                <option value="">Not set</option>

                <option value="weight_loss">
                  Weight Loss
                </option>

                <option value="muscle_gain">
                  Muscle Gain
                </option>

                <option value="maintenance">
                  Maintenance
                </option>

                <option value="general_fitness">
                  General Fitness
                </option>

              </select>

            </label>


            {/* EXPERIENCE LEVEL */}

            <label className="fv-fitness-field">

              <span>Experience Level</span>

              <select
                name="experience_level"
                value={form.experience_level}
                onChange={handleChange}
                disabled={saving}
              >

                <option value="">Not set</option>

                <option value="beginner">
                  Beginner
                </option>

                <option value="intermediate">
                  Intermediate
                </option>

                <option value="advanced">
                  Advanced
                </option>

              </select>

            </label>


            {/* ACTIVITY LEVEL */}

            <label className="fv-fitness-field">

              <span>Activity Level</span>

              <select
                name="activity_level"
                value={form.activity_level}
                onChange={handleChange}
                disabled={saving}
              >

                <option value="">Not set</option>

                <option value="sedentary">
                  Sedentary
                </option>

                <option value="lightly_active">
                  Lightly Active
                </option>

                <option value="moderately_active">
                  Moderately Active
                </option>

                <option value="very_active">
                  Very Active
                </option>

              </select>

            </label>

          </div>


          {/* ERROR MESSAGE */}

          {error && (

            <p
              className="fv-fitness-error"
              role="alert"
            >

              {error}

            </p>

          )}


          {/* SUCCESS MESSAGE */}

          {success && (

            <p
              className="fv-fitness-success"
              role="status"
            >

              <CheckCircle2 size={17} />

              {success}

            </p>

          )}


          {/* SAVE BUTTON */}

          <button
            type="submit"
            className="fv-fitness-save"
            disabled={saving}
          >

            <Save size={18} />

            {saving
              ? "Saving..."
              : "Save Preferences"}

          </button>

        </form>

      )}

    </section>
  );
}
