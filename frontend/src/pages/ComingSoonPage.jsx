import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";

const upcoming = {
  "workout-generator": { name: "AI Workout Generator", phase: 7 },
  "nutrition-scanner": { name: "AI Nutrition Scanner", phase: 8 },
  "smart-kitchen": { name: "Smart Kitchen", phase: 9 },
  "water-tracker": { name: "Water Tracker", phase: 10 },
  "freshness-detector": { name: "Freshness Detector", phase: 8 },
  "workout-analytics": { name: "Workout Analytics", phase: 6 },
  "fitness-chatbot": { name: "AI Fitness Chatbot", phase: 10 },
};

export default function ComingSoonPage() {
  const { slug } = useParams();
  const feature = upcoming[slug];

  if (!feature) {
    return <main className="empty-state container"><h1>Page not found</h1><Link to="/">Go home</Link></main>;
  }

  return (
    <section className="empty-state container">
      <span className="empty-state__icon"><Sparkles size={36} /></span>
      <p className="section-kicker">COMING IN PHASE {feature.phase}</p>
      <h1>{feature.name}</h1>
      <p>We're building this feature step by step. This page is a preview, not a working AI tool yet.</p>
      <Link to="/" className="button button--green"><ArrowLeft size={18} /> Back to home</Link>
    </section>
  );
}
