
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import {
  signUp,
  signIn,
  resendSignupConfirmation,
} from "../../features/auth/authService";


const confirmationMessage =
  "If registration is pending, check your email for a confirmation link.";


// ==========================================
// AUTHENTICATION ERROR HANDLING
// ==========================================

function getAuthErrorMessage(error) {
  switch (error?.code) {

    case "invalid_credentials":
      return "Invalid email or password.";

    case "email_not_confirmed":
      return "Please verify your email before logging in.";

    case "weak_password":
      return "Choose a stronger password.";

    case "email_address_invalid":
      return "Please enter a valid email address.";

    case "email_address_not_authorized":
      return "Email delivery is unavailable for this address.";

    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many requests. Please try again later.";

    case "signup_disabled":
    case "email_provider_disabled":
      return "Registration is currently unavailable.";

    default:
      if (error?.status === 429) {
        return "Too many requests. Please try again later.";
      }

      if (error?.name === "AuthRetryableFetchError") {
        return "Connection problem. Please try again.";
      }

      return "Unable to complete the request. Please try again.";
  }
}


// ==========================================
// AUTHENTICATION FORM COMPONENT
// ==========================================

export default function AuthForm({ mode }) {

  const isSignup = mode === "signup";

  const emailRef = useRef(null);

  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [visible, setVisible] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [pending, setPending] = useState(null);

  const loading = pending !== null;


  // ==========================================
  // HANDLE INPUT CHANGES
  // ==========================================

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }


  // ==========================================
  // HANDLE LOGIN AND SIGNUP
  // ==========================================

  async function onSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setError("");


    // 1. Validate the user's name during signup

    if (isSignup) {
      const nameLength =
        Array.from(values.name.trim()).length;

      if (nameLength === 0 || nameLength > 100) {
        setError(
          "Enter a name between 1 and 100 characters."
        );
        return;
      }
    }


    // 2. Validate password length during signup

    if (isSignup && values.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }


    // 3. Validate confirm password

    if (
      isSignup &&
      values.password !== values.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }


    // 4. Set the current authentication operation

    setPending(isSignup ? "signup" : "login");


    try {

      // ==========================================
      // SIGNUP
      // ==========================================

      if (isSignup) {

        const data = await signUp({
          name: values.name,
          email: values.email,
          password: values.password,
        });

        if (data.session) {
          setMessage(
            "Registration successful. You are signed in."
          );
        } else {
          setMessage(confirmationMessage);
        }

      }

      // ==========================================
      // LOGIN
      // ==========================================

      else {

        const data = await signIn({
          email: values.email,
          password: values.password,
        });

        if (!data.session) {
          setError("Unable to establish a login session.");
          return;
        }

        setMessage("Login successful.");
      }


    } catch (error) {

      // Avoid revealing whether an account exists during signup

      if (
        isSignup &&
        (
          error?.code === "user_already_exists" ||
          error?.code === "email_exists"
        )
      ) {
        setMessage(confirmationMessage);
      } else {
        setError(getAuthErrorMessage(error));
      }


    } finally {

      // Stop loading

      setPending(null);

      // Clear sensitive password fields

      setValues((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
    }
  }


  // ==========================================
  // RESEND CONFIRMATION EMAIL
  // ==========================================

  async function handleResend() {

    if (loading) return;

    setMessage("");
    setError("");

    if (!emailRef.current?.reportValidity()) {
      return;
    }

    setPending("resend");

    try {

      await resendSignupConfirmation(values.email);

      setMessage(confirmationMessage);

    } catch (error) {

      if (
        error?.code === "user_not_found" ||
        error?.code === "user_already_exists" ||
        error?.code === "email_exists"
      ) {
        setMessage(confirmationMessage);
      } else {
        setError(getAuthErrorMessage(error));
      }

    } finally {
      setPending(null);
    }
  }


  // ==========================================
  // AUTHENTICATION UI
  // ==========================================

  return (

    <main className="auth-layout container">

      <div className="auth-aside">

        <p className="section-kicker">
          YOUR FITNESS COMPANION
        </p>

        <h1>
          Every stronger day starts somewhere
          <span>.</span>
        </h1>

        

        {/* Light mode image */}

        <img
          src="/images/hero-light.png"
          alt="FitOrbit fitness companion"
          className="fo-auth-image fo-auth-image--light"
        />

        {/* Dark mode image */}

        <img
          src="/images/hero-athlete.png"
          alt="FitOrbit fitness companion"
          className="fo-auth-image fo-auth-image--dark"
        />

      </div>


      <div className="auth-panel">

        <span className="auth-panel__icon">
          <LockKeyhole size={23} />
        </span>

        <h2>
          {isSignup
            ? "Create your account"
            : "Welcome back"}
        </h2>

        <p className="auth-panel__subtitle">
          {isSignup
            ? "Start your FitOrbit journey."
            : "Sign in to continue your journey."}
        </p>

        <p className="auth-ui-notice">
          {isSignup
            ? "Verify your email address after registration."
            : "Sign in securely with your verified email."}
        </p>


        <form
          className="auth-form"
          onSubmit={onSubmit}
          aria-busy={loading}
        >


          {/* Full name */}

          {isSignup && (

            <label>
              Full name

              <input
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Enter your name"
                value={values.name}
                onChange={handleChange}
                disabled={loading}
                required
              />

            </label>

          )}


          {/* Email address */}

          <label>
            Email address

            <input
              ref={emailRef}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={handleChange}
              disabled={loading}
              required
            />

          </label>


          {/* Password */}

          <label>
            Password

            <span className="password-field">

              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={
                  isSignup
                    ? "new-password"
                    : "current-password"
                }
                minLength={isSignup ? 8 : undefined}
                placeholder={
                  isSignup
                    ? "At least 8 characters"
                    : "Enter your password"
                }
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
              >
                {visible
                  ? <EyeOff size={19} />
                  : <Eye size={19} />}
              </button>

            </span>

          </label>


          {/* Confirm password */}

          {isSignup && (

            <label>
              Confirm password

              <input
                name="confirmPassword"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={values.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
              />

            </label>

          )}


          {/* Submit button */}

          <button
            type="submit"
            className="button button--green auth-submit"
            disabled={loading}
          >

            {pending === "signup"
              ? "Creating account..."
              : pending === "login"
                ? "Signing in..."
                : isSignup
                  ? "Create account"
                  : "Login"}

            <ArrowRight size={18} />

          </button>


          {/* Resend confirmation button */}

          {isSignup && (

            <button
              type="button"
              className="button button--outline"
              onClick={handleResend}
              disabled={loading}
            >

              {pending === "resend"
                ? "Requesting email..."
                : "Resend confirmation email"}

            </button>

          )}


          {/* Success message */}

          {message && (

            <p className="form-message" role="status">
              {message}
            </p>

          )}


          {/* Error message */}

          {error && (

            <p className="error-message" role="alert">
              {error}
            </p>

          )}

        </form>


        {/* Switch between login and signup */}
        {!isSignup && (

          <p className="auth-switch">

            <Link to="/forgot-password">
              Forgot your password?
            </Link>

          </p>

        )}
        <p className="auth-switch">

          {isSignup
            ? "Already have an account? "
            : "New to FitOrbit? "}

          <Link to={isSignup ? "/login" : "/signup"}>

            {isSignup
              ? "Login"
              : "Create an account"}

          </Link>

        </p>

      </div>

    </main>
  );
}
