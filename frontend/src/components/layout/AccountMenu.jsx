
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  HeartPulse,
  Dumbbell,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";

import { signOut } from "../../features/auth/authService";

import {
  getCachedAccountProfile,
  clearProfileCaches,
} from "../../services/profileCache";

import FitnessPreferencesForm from "./FitnessPreferencesForm";


export default function AccountMenu({
  user,
  closeMobileMenu,
}) {

  const navigate = useNavigate();
  const menuRef = useRef(null);

  // =====================================
  // STATE
  // =====================================

  const [open, setOpen] = useState(false);

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState("");

  const [showPreferences, setShowPreferences] =
    useState(false);


  // =====================================
  // CLOSE ACCOUNT POPUP
  // =====================================

  function closeAccountMenu() {

    setOpen(false);
    setShowPreferences(false);
    setError("");

  }


  // =====================================
  // TOGGLE ACCOUNT POPUP
  // =====================================

  function toggleAccountMenu() {

    if (open) {

      closeAccountMenu();

    } else {

      setShowPreferences(false);
      setError("");
      setOpen(true);

    }

  }


  // =====================================
  // FETCH USER PROFILE WITH CACHE
  // =====================================

  useEffect(() => {

    if (!open || !user?.id) return;

    let active = true;

    async function loadProfile() {

      setLoading(true);

      try {

        // Reuse cached data if available.
        // Otherwise fetch from FastAPI.

        const data = await getCachedAccountProfile(
          user.id
        );

        if (active) {

          // Display only the authenticated user's data.

          if (data?.id === user.id) {

            setProfile(data);

          } else {

            setProfile(null);

          }

        }

      } catch {

        // Keep existing valid profile on network errors.
        // Email fallback is used if no profile is available.

      } finally {

        if (active) {
          setLoading(false);
        }

      }

    }

    loadProfile();

    return () => {
      active = false;
    };

  }, [open, user?.id]);


  // =====================================
  // CLOSE ON OUTSIDE CLICK OR ESCAPE
  // =====================================

  useEffect(() => {

    if (!open) return;

    function handleOutsideClick(event) {

      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {

        closeAccountMenu();

      }

    }

    function handleEscape(event) {

      if (event.key === "Escape") {

        closeAccountMenu();

      }

    }

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {

      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, [open]);


  // =====================================
  // USER NAME AND AVATAR
  // =====================================

  const displayName =

    (
      profile?.id === user?.id
        ? profile?.full_name?.trim()
        : null
    ) ||

    user?.email?.split("@")[0] ||

    "FitOrbit Member";


  const initial = displayName
    .charAt(0)
    .toUpperCase();


  // =====================================
  // LOGOUT WITH CACHE CLEANUP
  // =====================================

  async function handleLogout() {

    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {

      // 1. Sign out from Supabase
      await signOut();

      // 2. Clear cached profile and fitness data
      clearProfileCaches();

      // 3. Clear component's user data
      setProfile(null);

      // 4. Close popup and mobile menu
      closeAccountMenu();

      closeMobileMenu?.();

      // 5. Return to homepage
      navigate("/", { replace: true });

    } catch (err) {

      setError(
        err.message || "Unable to log out."
      );

    } finally {

      setLoggingOut(false);

    }

  }


  // =====================================
  // USER INTERFACE
  // =====================================

  return (

    <div
      className="fv-account-wrapper"
      ref={menuRef}
    >

      {/* NAVBAR AVATAR */}

      <button
        type="button"
        className="fv-account-trigger"
        onClick={toggleAccountMenu}
        aria-label="My Account"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={
          open ? "fv-account-popup" : undefined
        }
      >

        {initial}

      </button>


      {/* GOOGLE STYLE ACCOUNT POPUP */}

      {open && (

        <div
          id="fv-account-popup"
          className="fv-account-popup"
        >

          {/* POPUP HEADER */}

          <div className="fv-account-popup-header">

            <h3>FitOrbit Account</h3>

            <button
              type="button"
              className="fv-account-close"
              onClick={closeAccountMenu}
              aria-label="Close account menu"
            >

              <X size={20} />

            </button>

          </div>


          {/* =====================================
              FITNESS PREFERENCES OR ACCOUNT MENU
          ===================================== */}

          {showPreferences ? (

            <FitnessPreferencesForm

              userId={user?.id}

              onBack={() => {
                setShowPreferences(false);
              }}

            />

          ) : (

            <>

              {/* USER DETAILS */}

              <div className="fv-account-user">

                <div className="fv-account-avatar">

                  {initial}

                </div>

                <div className="fv-account-user-info">

                  <strong>{displayName}</strong>

                  <p>{user?.email}</p>

                  {loading && !profile && (
                    <small>
                      Loading profile...
                    </small>
                  )}

                </div>

              </div>


              {/* FITNESS PREFERENCES */}

              <button
                type="button"
                className="fv-account-item fv-account-item-link"
                onClick={() => {
                  setShowPreferences(true);
                }}
              >

                <span className="fv-account-item-icon">

                  <HeartPulse size={20} />

                </span>

                <span className="fv-account-item-text">

                  <strong>
                    Fitness Preferences
                  </strong>

                  <p>
                    Personalize your fitness goals
                  </p>

                </span>

                <ChevronRight size={18} />

              </button>


              {/* FITNESS JOURNEY */}

              <Link
                to="/workout"
                className="fv-account-item fv-account-item-link"
                onClick={() => {

                  closeAccountMenu();
                  closeMobileMenu?.();

                }}
              >

                <span className="fv-account-item-icon">

                  <Dumbbell size={20} />

                </span>

                <div className="fv-account-item-text">

                  <strong>
                    Your Fitness Journey Starts Here
                  </strong>

                  <p>
                    Start your live workout
                  </p>

                </div>

                <ChevronRight size={18} />

              </Link>


              {/* LOGOUT */}

              <button
                type="button"
                className="fv-account-item fv-account-logout"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-busy={loggingOut}
              >

                <span className="fv-account-item-icon">

                  <LogOut size={20} />

                </span>

                <span className="fv-account-item-text">

                  <strong>

                    {loggingOut
                      ? "Logging out..."
                      : "Logout"}

                  </strong>

                </span>

              </button>


              {/* LOGOUT ERROR */}

              {error && (

                <p
                  className="fv-account-error"
                  role="alert"
                >

                  {error}

                </p>

              )}

            </>

          )}

        </div>

      )}

    </div>
  );
}
