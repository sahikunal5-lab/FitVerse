
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Camera,
  UtensilsCrossed,
  Brain,
  ArrowRight
} from "lucide-react";
import { fetchHealth } from "../services/api";

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState("Checking API...");

  useEffect(() => {
    let active = true;

    const checkHealth = async () => {
      try {
        const data = await fetchHealth();

        if (active) {
          setApiStatus(`${data.app} connected`);
        }
      } catch {
        if (active) {
          setApiStatus("Backend offline");
        }
      }
    };

    checkHealth();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <Activity size={16} />
            AI-POWERED FITNESS PLATFORM
          </div>

          <h1>
            Transform Your Fitness
            <span className="accent"> With AI.</span>
          </h1>

          <p>
            Train smarter, track your progress and build
            healthier habits with your personal AI fitness
            and nutrition companion.
          </p>

          <Link to="/workout" className="primary-button">
            Start Live Workout
            <ArrowRight size={18} />
          </Link>

          <div className="api-status">
            <span className="status-dot" />
            {apiStatus}
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Explore FitVerse</h2>

        <div className="feature-grid">
          <article className="feature-card">
            <Camera size={30} />
            <h3>Live AI Workout</h3>
            <p>
              Browser-based movement tracking,
              repetition counting and form feedback.
            </p>
          </article>

          <article className="feature-card">
            <UtensilsCrossed size={30} />
            <h3>Smart Nutrition</h3>
            <p>
              Future food scanning, meal planning
              and personalized recipes.
            </p>
          </article>

          <article className="feature-card">
            <Brain size={30} />
            <h3>AI Fitness Coach</h3>
            <p>
              Future intelligent workout plans
              and personalized guidance.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
