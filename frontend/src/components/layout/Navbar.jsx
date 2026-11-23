
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


const anchorLinks = [
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Contact", href: "/#contact" },
];


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

        {/* FITVERSE LOGO */}

        <Link
          className="brand"
          to="/"
          onClick={closeMenu}
          aria-label="FitVerse home"
        >
          <Dumbbell
            size={34}
            strokeWidth={2.7}
            aria-hidden="true"
          />

          <span>
            Fit<span>Verse</span>
          </span>
        </Link>


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
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen
            ? <X size={24} />
            : <Menu size={24} />}
        </button>


        {/* NAVIGATION CONTENT */}

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


          {/* AUTHENTICATION ACTIONS */}

          <div className="nav-actions">

            {/* CHECKING SESSION */}

            {status === "loading" && (
              <span role="status">
                Checking session...
              </span>
            )}


            {/* NOT LOGGED IN */}

            {status === "unauthenticated" && (
              <>
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
              </>
            )}


            {/* LOGGED IN — ACCOUNT POPUP */}

            {status === "authenticated" && (
              <AccountMenu
                user={user}
                closeMobileMenu={closeMenu}
              />
            )}

          </div>

        </div>

      </div>

    </header>
  );
}
