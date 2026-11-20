
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  Dumbbell,
  Menu,
  X,
  CircleUserRound,
  LogOut,
} from "lucide-react";

import {
  selectUser,
  selectAuthStatus,
} from "../../features/auth/authSlice";

import { signOut } from "../../features/auth/authService";


const anchorLinks = [
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Contact", href: "/#contact" },
];


export default function Navbar() {

  const navigate = useNavigate();

  // Read global authentication state

  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);


  // Local Navbar state

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const closeMenu = () => setMenuOpen(false);


  // ==========================================
  // LOGOUT FUNCTIONALITY
  // ==========================================

  async function handleLogout() {

    if (loggingOut) return;

    setError("");
    setLoggingOut(true);

    try {

      await signOut();

      closeMenu();

      navigate("/", { replace: true });

    } catch (error) {

      setError("Unable to log out. Please try again.");

    } finally {

      setLoggingOut(false);

    }
  }


  return (

    <header className="site-header">

      <div className="container navbar">


        {/* FitVerse Brand */}

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


        {/* Mobile Menu Toggle */}

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


        <div
          id="primary-navigation"
          className={`nav-content ${
            menuOpen ? "nav-content--open" : ""
          }`}
        >


          {/* Navigation Links */}

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


          {/* Authentication Actions */}

          <div className="nav-actions">


            {/* 1. Checking existing session */}

            {status === "loading" && (

              <span role="status">
                Checking session...
              </span>

            )}


            {/* 2. User is not logged in */}

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


            {/* 3. User is logged in */}

            {status === "authenticated" && (

              <>

                <span
                  className="button button--outline"
                  title={user?.email ?? "Signed-in account"}
                >

                  <CircleUserRound size={20} />

                  Account

                </span>


                <button
                  type="button"
                  className="button button--green"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  aria-busy={loggingOut}
                >

                  <LogOut size={18} />

                  {loggingOut
                    ? "Logging out..."
                    : "Logout"}

                </button>

              </>

            )}


            {/* Logout error */}

            {error && status === "authenticated" && (

              <p
                className="error-message"
                role="alert"
              >
                {error}
              </p>

            )}

          </div>

        </div>

      </div>

    </header>
  );
}
