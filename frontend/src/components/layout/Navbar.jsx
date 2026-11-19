import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Dumbbell, Menu, X } from "lucide-react";

const anchorLinks = [
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container navbar">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="FitVerse home">
          <Dumbbell size={34} strokeWidth={2.7} aria-hidden="true" />
          <span>Fit<span>Verse</span></span>
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div
          id="primary-navigation"
          className={`nav-content ${menuOpen ? "nav-content--open" : ""}`}
        >
          <nav className="nav-links" aria-label="Main navigation">
            <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
            {anchorLinks.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <Link to="/login" className="button button--outline" onClick={closeMenu}>Login</Link>
            <Link to="/signup" className="button button--green" onClick={closeMenu}>Sign Up</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
