
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  Dumbbell,
  Menu,
  X,
} from "lucide-react";

import {
  selectUser,
  selectAuthStatus,
} from "../../features/auth/authSlice";

import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";


// ==========================================
// NAVIGATION LINKS
// ==========================================

const anchorLinks = [
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Contact", href: "/#contact" },
];


// ==========================================
// NAVBAR COMPONENT
// ==========================================

export default function Navbar() {

  // Redux authentication state

  const user = useSelector(selectUser);

  const status = useSelector(selectAuthStatus);


  // Mobile navigation state

  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);


  return (
    <header className="site-header">

      <div className="container navbar">


        {/* =================================
            FITORBIT LOGO
        ================================= */}

        <Link
          className="brand"
          to="/"
          onClick={closeMenu}
          aria-label="FitOrbit home"
        >

          <Dumbbell
            size={34}
            strokeWidth={2.7}
            aria-hidden="true"
          />

          <span>
            Fit<span>Orbit</span>
          </span>

        </Link>


        {/* =================================
            NAVIGATION CONTENT
        ================================= */}

        <div
          id="primary-navigation"
          className={`nav-content ${
            menuOpen ? "nav-content--open" : ""
          }`}
        >


          {/* NAVIGATION LINKS */}

          <nav
            className="nav-links"
            aria-label="Main navigation"
          >

            <NavLink
              to="/"
              end
              onClick={closeMenu}
            >
              Home
            </NavLink>

            {anchorLinks.map((item) => (

              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
              >
                {item.label}
              </a>

            ))}

          </nav>


          {/* =================================
              GUEST AUTHENTICATION ACTIONS
          ================================= */}

          {status === "unauthenticated" && (

            <div className="nav-actions">

              <Link
                to="/login"
                className="button button--outline"
                onClick={closeMenu}
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="button button--green"
                onClick={closeMenu}
              >
                Sign Up
              </Link>

            </div>

          )}

        </div>


        {/* =================================
            PERMANENT NAVBAR CONTROLS
        ================================= */}

        <div className="fo-navbar-controls">


          {/* LIGHT / DARK MODE */}

          <ThemeToggle />


          {/* CHECKING SESSION */}

          {status === "loading" && (

            <span
              className="fo-session-status"
              role="status"
            >
              Checking session...
            </span>

          )}


          {/* AUTHENTICATED PROFILE */}

          {status === "authenticated" && (

            <AccountMenu
              user={user}
              closeMobileMenu={closeMenu}
            />

          )}


          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={
              menuOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() =>
              setMenuOpen((open) => !open)
            }
          >

            {menuOpen
              ? <X size={24} aria-hidden="true" />
              : <Menu size={24} aria-hidden="true" />}

          </button>

        </div>

      </div>

    </header>
  );
}
