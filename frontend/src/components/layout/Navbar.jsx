
import { Link, NavLink } from "react-router-dom";
import { Activity } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <Activity size={28} />
        <span>Fit<span className="accent">Verse</span></span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/" end>
          Home
        </NavLink>

        <NavLink to="/workout">
          Live Workout
        </NavLink>
      </nav>
    </header>
  );
}
