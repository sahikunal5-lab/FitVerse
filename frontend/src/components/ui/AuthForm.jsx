
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
  resendSignupConfirmation,
} from "../../features/auth/authService";


const confirmationMessage =
  "If registration is pending, check your email for a confirmation link.";


function getAuthErrorMessage(error) {
  switch (error?.code) {
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


  function handleChange(event) {
    const { name, value } = event.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }


  async function onSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setError("");

    // Validate the user's name
    if (isSignup) {
      const nameLength =
        Array.from(values.name.trim()).length;

      if (nameLength === 0 || nameLength > 100) {
        setError("Enter a name between 1 and 100 characters.");
        return;
      }
    }

    // Validate password length
    if (values.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    // Validate confirm password
    if (
      isSignup &&
      values.password !== values.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    // Login will be connected in Phase 3.6
    if (!isSignup) {
      setMessage(
        "Login will be activated in Phase 3.6."
      );
      return;
    }

    setPending("signup");

    try {
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

    } catch (error) {
      // Avoid revealing whether an account exists
      if (
        error?.code === "user_already_exists" ||
        error?.code === "email_exists"
      ) {
        setMessage(confirmationMessage);
      } else {
        setError(getAuthErrorMessage(error));
      }

    } finally {
      setPending(null);

      setValues((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
    }
  }


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

        <p>
          Move toward your goals with a smarter
          fitness and nutrition experience.
        </p>

        <img
          src="/images/hero-athlete.png"
          alt="Fitness athlete"
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
            ? "Start your FitVerse journey."
            : "Sign in to continue your journey."}
        </p>

        <p className="auth-ui-notice">
          {isSignup
            ? "Verify your email address after registration."
            : "Login will be activated in Phase 3.6."}
        </p>


        <form
          className="auth-form"
          onSubmit={onSubmit}
          aria-busy={loading}
        >

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
                minLength={8}
                placeholder="At least 8 characters"
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


          <button
            type="submit"
            className="button button--green auth-submit"
            disabled={loading}
          >

            {pending === "signup"
              ? "Creating account..."
              : isSignup
                ? "Create account"
                : "Login (preview)"}

            <ArrowRight size={18} />

          </button>


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


          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

        </form>


        <p className="auth-switch">

          {isSignup
            ? "Already have an account? "
            : "New to FitVerse? "}

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
