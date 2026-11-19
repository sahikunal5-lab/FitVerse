import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FeatureCard({ title, description, image, icon: Icon, theme, to }) {
  return (
    <Link className={`feature-card feature-card--${theme}`} to={to}>
      <div className="feature-card__content">
        <span className="feature-card__icon"><Icon size={25} strokeWidth={2.5} aria-hidden="true" /></span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <img className="feature-card__image" src={image} alt="" loading="lazy" aria-hidden="true" />
      <span className="feature-card__arrow" aria-hidden="true"><ArrowUpRight size={19} /></span>
    </Link>
  );
}
