
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import {
  updatePassword,
  signOut,
} from "../features/auth/authService";

import {
  selectAuthStatus,
  selectRecoveryActive,
  recoveryFinished,
} from "../features/auth/authSlice";


// ==========================================
// RESET PASSWORD ERROR HANDLING
// ==========================================

function getResetErrorMessage(error) {

  switch (error?.code) {

    case "weak_password":
      return "Choose a stronger password.";

    case "same_password":
      return "Your new password must be different from the old password.";

    case "session_not_found":
    case "session_expired":
    case "otp_expired":
      return "Your session has expired. Request a new reset link.";

    case "reauthentication_needed":
      return "Additional verification is required. Please request a new reset link.";

    case "over_request_rate_limit":
      return "Too many requests. Please try again later.";

    default:

      if (error?.status === 429) {
        return "Too many requests. Please try again later.";
      }

      if (error?.name === "AuthRetryableFetchError") {
        return "Connection problem. Please try again.";
      }

      return "Unable to update password. Please try again.";
  }
}


// ==========================================
// RESET PASSWORD PAGE
// ==========================================

export default function ResetPasswordPage() {

  // ==========================================
  // 1. REDUX AUTHENTICATION STATE
  // ==========================================

  const dispatch = useDispatch();

  const authStatus = useSelector(selectAuthStatus);

  const recoveryActive = useSelector(
    selectRecoveryActive
  );


  // ==========================================
  // 2. LOCAL FORM STATE
  // ==========================================

  const [values, setValues] = useState({
    password: "",
    confirmPassword: "",
  });

  const [visible, setVisible] = useState(false);

  const [passwordUpdated, setPasswordUpdated] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [logoutWarning, setLogoutWarning] =
    useState("");


  // ==========================================
  // 3. CHECK RECOVERY URL ERRORS
  // ==========================================

  const queryParams = new URLSearchParams(
    window.location.search
  );

  const hashParams = new URLSearchParams(
    window.location.hash.slice(1)
  );

  const hasLinkError =
    queryParams.has("error") ||
    queryParams.has("error_code") ||
    hashParams.has("error") ||
    hashParams.has("error_code");


  // ==========================================
  // 4. DETERMINE RECOVERY STATUS
  // ==========================================

  const recoveryStatus = passwordUpdated
    ? "success"
    : hasLinkError
      ? "invalid"
      : recoveryActive && authStatus === "authenticated"
        ? "ready"
        : authStatus === "loading"
          ? "checking"
          : "invalid";


  // ==========================================
  // 5. HANDLE INPUT CHANGES
  // ==========================================

  function handleChange(event) {

    const { name, value } = event.target;

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }


  // ==========================================
  // 6. UPDATE USER PASSWORD
  // ==========================================

  async function handleSubmit(event) {

    event.preventDefault();

    if (loading || recoveryStatus !== "ready") {
      return;
    }

    setError("");


    // Validate password length

    if (values.password.length < 8) {

      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }


    // Validate matching passwords

    if (
      values.password !== values.confirmPassword
    ) {

      setError("Passwords do not match.");

      return;
    }


    // Start loading

    setLoading(true);


    try {

      // Update password using Supabase Auth

      await updatePassword(values.password);


      // Preserve success message after logout

      setPasswordUpdated(true);


      // Clear recovery state from Redux

      dispatch(recoveryFinished());


      // Sign out the current browser session

      try {

        await signOut();

      } catch {

        setLogoutWarning(
          "Password updated, but automatic logout failed. Please use the Logout button."
        );

      }


    } catch (err) {

      setError(getResetErrorMessage(err));

    } finally {

      // Stop loading

      setLoading(false);


      // Clear password fields

      setValues({
        password: "",
        confirmPassword: "",
      });

    }
  }


  // ==========================================
  // 7. PAGE UI
  // ==========================================

  return (

    <main className="auth-layout container">


      {/* =====================================
          LEFT SIDE: EXISTING FITNESS DESIGN
      ====================================== */}

      <div className="auth-aside">

        <p className="section-kicker">
          YOUR FITNESS COMPANION
        </p>

        <h1>
          Every stronger day starts somewhere
          <span>.</span>
        </h1>

        <p>
          Move toward your goals with a smarter
          fitness and nutrition experience.
        </p>

        <img
          src="/images/hero-athlete.png"
          alt="Fitness athlete"
        />

      </div>


      {/* =====================================
          RIGHT SIDE: RESET PASSWORD
      ====================================== */}

      <div className="auth-panel">

        <span className="auth-panel__icon">
          <LockKeyhole size={23} />
        </span>


        {/* =====================================
            CHECKING RECOVERY SESSION
        ====================================== */}

        {recoveryStatus === "checking" && (

          <p role="status">
            Verifying password reset session...
          </p>

        )}


        {/* =====================================
            INVALID OR EXPIRED LINK
        ====================================== */}

        {recoveryStatus === "invalid" && (

          <>

            <h2>Reset link unavailable</h2>

            <p className="auth-panel__subtitle">
              The recovery link is invalid, expired,
              or no active recovery session was found.
            </p>

            <p
              className="error-message"
              role="alert"
            >
              Please request a new password reset link.
            </p>

            <p className="auth-switch">

              <Link to="/forgot-password">
                Request new link
              </Link>

            </p>

          </>

        )}


        {/* =====================================
            PASSWORD UPDATED SUCCESSFULLY
        ====================================== */}

        {recoveryStatus === "success" && (

          <>

            <h2>Password updated!</h2>

            <p
              className="form-message"
              role="status"
            >
              Your password has been changed successfully.
            </p>


            {logoutWarning && (

              <p
                className="error-message"
                role="alert"
              >
                {logoutWarning}
              </p>

            )}


            <p className="auth-switch">

              <Link to="/login">
                Back to Login
              </Link>

            </p>

          </>

        )}


        {/* =====================================
            RESET PASSWORD FORM
        ====================================== */}

        {recoveryStatus === "ready" && (

          <>

            <h2>Set new password</h2>

            <p className="auth-panel__subtitle">
              Create a new password for your FitVerse account.
            </p>

            <p className="auth-ui-notice">
              Choose a strong password with at least
              8 characters.
            </p>


            <form
              className="auth-form"
              onSubmit={handleSubmit}
              aria-busy={loading}
            >


              {/* NEW PASSWORD */}

              <label>
                New password

                <span className="password-field">

                  <input
                    name="password"
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Enter new password"
                    value={values.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />


                  <button
                    type="button"
                    aria-label={
                      visible
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setVisible((show) => !show)
                    }
                    disabled={loading}
                  >

                    {visible
                      ? <EyeOff size={19} />
                      : <Eye size={19} />}

                  </button>

                </span>

              </label>


              {/* CONFIRM NEW PASSWORD */}

              <label>
                Confirm new password

                <input
                  name="confirmPassword"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />

              </label>


              {/* UPDATE PASSWORD BUTTON */}

              <button
                type="submit"
                className="button button--green auth-submit"
                disabled={loading}
              >

                {loading
                  ? "Updating password..."
                  : "Update Password"}

                <ArrowRight size={18} />

              </button>


              {/* ERROR MESSAGE */}

              {error && (

                <p
                  className="error-message"
                  role="alert"
                >
                  {error}
                </p>

              )}

            </form>

          </>

        )}

      </div>

    </main>
  );
}
