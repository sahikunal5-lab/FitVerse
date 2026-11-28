
import { useState } from "react";

import {
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import {
  fetchAuthenticatedUser,
} from "../services/authenticatedApi";

import {
  fetchMyProfile,
} from "../services/authenticatedApi";

export default function AuthCheckPage() {

  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState(null);

  const [error, setError] = useState("");


  // ==========================================
  // VERIFY BACKEND AUTHENTICATION
  // ==========================================

  async function handleVerify() {

    if (loading) return;

    setLoading(true);
    setError("");
    setUserData(null);

    try {

      const data = await fetchMyProfile();

      setUserData(data);

    } catch (err) {

      setError(
        err.message || "Authentication verification failed."
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================
  // PAGE UI
  // ==========================================

  return (

    <main className="container">

      <section style={{ padding: "40px 0" }}>

        <ShieldCheck
          size={42}
          color="#059669"
        />

        <h1>Backend Authentication Test</h1>

        <p>
          Verify your Supabase session
          with the FitOrbit FastAPI backend.
        </p>


        <button
          type="button"
          className="button button--green"
          onClick={handleVerify}
          disabled={loading}
        >

          {loading
            ? "Verifying..."
            : "Verify Authentication"}

          <ArrowRight size={18} />

        </button>


        {/* SUCCESS RESPONSE */}

        {userData && (
          <pre>{JSON.stringify(userData, null, 2)}</pre>
        )}


        {/* ERROR RESPONSE */}

        {error && (

          <p
            className="error-message"
            role="alert"
          >
            {error}
          </p>

        )}

      </section>

    </main>
  );
}
