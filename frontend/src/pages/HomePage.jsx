import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, HeartPulse, ShieldCheck,
  Video, CalendarCheck, Apple, ChefHat,
  Droplets, BadgeCheck, BarChart3, Bot,
} from "lucide-react";
import FeatureCard from "../components/ui/FeatureCard";
import { fetchHealth } from "../services/api";

const features = [
  { title: "Live Workout", description: "Follow real-time workout sessions", image: "/images/live-workout.png", icon: Video, theme: "rose", to: "/workout" },
  { title: "AI Workout Generator", description: "Get personalized workout plans", image: "/images/workout-generator.png", icon: CalendarCheck, theme: "mint", to: "/features/workout-generator" },
  { title: "AI Nutrition Scanner", description: "Scan food & view nutrition details", image: "/images/nutrition-scanner.png", icon: Apple, theme: "peach", to: "/features/nutrition-scanner" },
  { title: "Smart Kitchen", description: "Healthy recipes & meal planning", image: "/images/smart-kitchen.png", icon: ChefHat, theme: "lavender", to: "/features/smart-kitchen" },
  { title: "Water Tracker", description: "Track your daily hydration", image: "/images/water-tracker.png", icon: Droplets, theme: "sky", to: "/features/water-tracker" },
  { title: "Freshness Detector", description: "Check if your food is fresh", image: "/images/freshness-detector.png", icon: BadgeCheck, theme: "leaf", to: "/features/freshness-detector" },
  { title: "Workout Analytics", description: "See your progress with insights", image: "/images/workout-analytics.png", icon: BarChart3, theme: "violet", to: "/features/workout-analytics" },
  { title: "AI Fitness Chatbot", description: "Ask fitness & nutrition questions", image: "/images/fitness-chatbot.png", icon: Bot, theme: "aqua", to: "/features/fitness-chatbot" },
];

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState("Checking backend...");
  const [apiIsOnline, setApiIsOnline] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkBackend() {
      try {
        await fetchHealth();

        if (active) {
          setApiStatus("Backend connected");
          setApiIsOnline(true);
        }
      } catch (error) {
        if (active) {
          setApiStatus("Backend offline");
          setApiIsOnline(false);
        }
      }
    }

    checkBackend();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="hero container" aria-labelledby="hero-heading">
        <div className="hero__content">
          <p className="hero__eyebrow"><Sparkles size={20} aria-hidden="true" /> Your AI Fitness Companion</p>
          <h1 id="hero-heading">Train Smarter,<br /><span>Live Healthier</span></h1>
          <p className="hero__description">
            Get personalized workout plans, track your progress,
            scan nutrition, and achieve your fitness goals with AI.
          </p>
          <div className="hero__actions">
            <Link to="/signup" className="button button--green button--large">
              Start Your Journey <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <Link to="/workout" className="hero__text-link">Explore Live Workout</Link>
          </div>
          <div className={`backend-indicator ${apiIsOnline ? "backend-indicator--online" : ""}`} role="status">
            <span aria-hidden="true" /> {apiStatus}
          </div>
        </div>
        <div className="hero__visual">
          <img src="/images/hero-athlete.png" alt="Athlete holding a shaker bottle in a gym" />
          <div className="hero__motto" aria-hidden="true">Be Fit<br />Be Strong <span>♥</span></div>
          <div className="hero__pill"><HeartPulse size={19} aria-hidden="true" /> Your goals, your pace</div>
        </div>
      </section>

      <section className="features-section container" id="features" aria-labelledby="features-heading">
        <div className="section-intro">
          <div>
            <p className="section-kicker">ONE PLATFORM. EVERY FITNESS GOAL.</p>
            <h2 id="features-heading">Explore FitVerse</h2>
          </div>
          <p>Everything you need to train, eat and feel better—all in one place.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
        </div>
      </section>

      <section className="info-section container" id="about">
        <div>
          <p className="section-kicker">ABOUT FITVERSE</p>
          <h2>Fitness meets smart technology.</h2>
        </div>
        <p>FitVerse is a student-built AI fitness and nutrition platform. Our aim is to bring exercise guidance, nutrition tools and progress tracking into one user-friendly experience.</p>
      </section>

      <section className="why-section container" id="why-us">
        <div>
          <p className="section-kicker">WHY US</p>
          <h2>Built to make healthy habits easier.</h2>
        </div>
        <div className="why-grid">
          <p><ShieldCheck size={25} /> <span><strong>Privacy first</strong><br />Live workout video stays on your device.</span></p>
          <p><HeartPulse size={25} /> <span><strong>Made for your goals</strong><br />Future plans will adapt to your fitness needs.</span></p>
          <p><Sparkles size={25} /> <span><strong>More than workouts</strong><br />Nutrition, hydration and coaching in one place.</span></p>
        </div>
      </section>

      <section className="contact-section container" id="contact">
        <h2>Ready to begin your fitness journey?</h2>
        <p>Try the camera preview now or explore our upcoming features.</p>
        <Link to="/workout" className="button button--green">Explore Live Workout <ArrowRight size={18} /></Link>
      </section>
      <footer className="site-footer">FitVerse <span>♥</span> Smart Fitness · Better Nutrition · Healthier You</footer>
    </>
  );
}
