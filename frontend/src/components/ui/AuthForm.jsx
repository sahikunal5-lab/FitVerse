import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setMessage("");
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (values.password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }
    if (isSignup && values.password !== values.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    // Phase 2 is deliberately UI-only. Do not store, log, or send credentials.
    setMessage("Form looks good! Secure Supabase authentication will be connected in Phase 3.");
  };

  return (
    <main className="auth-layout container">
      <div className="auth-aside">
        <p className="section-kicker">YOUR FITNESS COMPANION</p>
        <h1>Every stronger day starts somewhere<span>.</span></h1>
        <p>Move toward your goals with a smarter fitness and nutrition experience.</p>
        <img src="/images/hero-athlete.png" alt="Fitness athlete" />
      </div>
      <div className="auth-panel">
        <span className="auth-panel__icon"><LockKeyhole size={23} /></span>
        <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
        <p className="auth-panel__subtitle">{isSignup ? "Start your FitVerse journey." : "Sign in to continue your journey."}</p>
        <p className="auth-ui-notice">UI preview only. Login and signup will be activated in Phase 3.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          {isSignup && (
            <label>Full name
              <input name="name" type="text" autoComplete="name" placeholder="Enter your name" value={values.name} onChange={handleChange} required />
            </label>
          )}
          <label>Email address
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={handleChange} required />
          </label>
          <label>Password
            <span className="password-field">
              <input name="password" type={visible ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} placeholder="At least 8 characters" value={values.password} onChange={handleChange} required />
              <button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((show) => !show)}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button>
            </span>
          </label>
          {isSignup && (
            <label>Confirm password
              <input name="confirmPassword" type={visible ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" value={values.confirmPassword} onChange={handleChange} required />
            </label>
          )}
          <button type="submit" className="button button--green auth-submit">
            {isSignup ? "Create account (preview)" : "Login (preview)"} <ArrowRight size={18} />
          </button>
          {message && <p className="form-message" role="status">{message}</p>}
        </form>
        <p className="auth-switch">
          {isSignup ? "Already have an account? " : "New to FitVerse? "}
          <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Login" : "Create an account"}</Link>
        </p>
      </div>
    </main>
  );
}
