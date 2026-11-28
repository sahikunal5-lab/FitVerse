
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  ArrowLeft,
  LockKeyhole,
} from "lucide-react";

import {
  requestPasswordReset,
} from "../features/auth/authService";


const confirmationMessage =
  "If an account is associated with this email, you will receive password recovery instructions.";


export default function ForgotPasswordPage() {

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");


  // ==========================================
  // HANDLE EMAIL INPUT
  // ==========================================

  function handleChange(event) {

    setEmail(event.target.value);

    setMessage("");
    setError("");
  }


  // ==========================================
  // HANDLE PASSWORD RESET REQUEST
  // ==========================================

  async function handleSubmit(event) {

    event.preventDefault();

    if (loading) return;

    setMessage("");
    setError("");

    setLoading(true);

    try {

      await requestPasswordReset(email);

      setMessage(confirmationMessage);

    } catch (err) {

      if (
        err?.status === 429 ||
        err?.code === "over_email_send_rate_limit" ||
        err?.code === "over_request_rate_limit"
      ) {

        setError(
          "Too many requests. Please try again later."
        );

      } else if (
        err?.name === "AuthRetryableFetchError"
      ) {

        setError(
          "Connection problem. Please try again."
        );

      } else {

        setError(
          "Unable to process the request. Please try again."
        );

      }

    } finally {

      setLoading(false);

    }
  }


  // ==========================================
  // PAGE UI
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
          Forgot your password?
        </h2>

        <p className="auth-panel__subtitle">
          Enter your registered email address
          to request a password reset link.
        </p>

        <p className="auth-ui-notice">
          We will send recovery instructions
          if the email is associated with an account.
        </p>


        <form
          className="auth-form"
          onSubmit={handleSubmit}
          aria-busy={loading}
        >

          <label>
            Email address

            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleChange}
              disabled={loading}
              required
            />

          </label>


          <button
            type="submit"
            className="button button--green auth-submit"
            disabled={loading}
          >

            {loading
              ? "Sending request..."
              : "Send reset link"}

            <ArrowRight size={18} />

          </button>


          {message && (

            <p
              className="form-message"
              role="status"
            >
              {message}
            </p>

          )}


          {error && (

            <p
              className="error-message"
              role="alert"
            >
              {error}
            </p>

          )}

        </form>


        <p className="auth-switch">

          <Link to="/login">

            <ArrowLeft size={16} />

            Back to Login

          </Link>

        </p>

      </div>

    </main>
  );
}
