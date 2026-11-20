
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { supabase } from "../../lib/supabaseClient";

import { authChanged } from "./authSlice";

export default function AuthSync() {
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        const user = session?.user;

        const currentUser = user
          ? {
              id: user.id,
              email: user.email ?? null,
            }
          : null;

        dispatch(authChanged(currentUser));
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}
