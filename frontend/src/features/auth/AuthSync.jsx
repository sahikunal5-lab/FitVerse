
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { supabase } from "../../lib/supabaseClient";

import {
  authChanged,
  recoveryStarted,
  recoveryFinished,
} from "./authSlice";


export default function AuthSync() {

  const dispatch = useDispatch();

  useEffect(() => {

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {

        if (!active) return;

        const user = session?.user;

        const currentUser = user
          ? {
              id: user.id,
              email: user.email ?? null,
            }
          : null;

        // Synchronize normal authentication state
        dispatch(authChanged(currentUser));

        // Recognize verified password recovery
        if (event === "PASSWORD_RECOVERY" && session) {
          dispatch(recoveryStarted());
        }

        // Clear recovery state after logout
        if (event === "SIGNED_OUT") {
          dispatch(recoveryFinished());
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };

  }, [dispatch]);

  return null;
}
