
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { supabase } from "../../lib/supabaseClient";

import {
  authChanged,
  recoveryStarted,
  recoveryFinished,
} from "./authSlice";

import {
  saveRecoveryMarker,
  hasValidRecoveryMarker,
  clearRecoveryMarker,
} from "./recoverySession";


export default function AuthSync() {

  const dispatch = useDispatch();

  useEffect(() => {

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {

        if (!active) return;

        // ==================================
        // 1. NORMAL AUTHENTICATION STATE
        // ==================================

        const user = session?.user;

        const currentUser = user
          ? {
              id: user.id,
              email: user.email ?? null,
            }
          : null;

        dispatch(authChanged(currentUser));


        // ==================================
        // 2. NEW PASSWORD RECOVERY EVENT
        // ==================================

        if (event === "PASSWORD_RECOVERY") {

          const onResetPage =
            window.location.pathname.replace(/\/+$/, "")
            === "/reset-password";

          if (user?.id && onResetPage) {

            saveRecoveryMarker(user.id);

            dispatch(recoveryStarted());

          }

          return;
        }


        // ==================================
        // 3. RESTORE AFTER PAGE REFRESH
        // ==================================

        if (event === "INITIAL_SESSION") {

          if (
            user?.id &&
            hasValidRecoveryMarker(user.id)
          ) {

            dispatch(recoveryStarted());

          } else {

            clearRecoveryMarker();

            dispatch(recoveryFinished());

          }

          return;
        }


        // ==================================
        // 4. CLEAR RECOVERY AFTER LOGOUT
        // ==================================

        if (event === "SIGNED_OUT") {

          clearRecoveryMarker();

          dispatch(recoveryFinished());

        }

      }
    );


    // ==================================
    // 5. CLEANUP
    // ==================================

    return () => {

      active = false;

      subscription.unsubscribe();

    };

  }, [dispatch]);

  return null;
}
