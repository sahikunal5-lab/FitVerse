
import { supabase } from "../../lib/supabaseClient";


// ==========================================
// 1. REGISTER USER
// ==========================================

export async function signUp({
  name,
  email,
  password,
}) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,

    options: {
      data: {
        full_name: name.trim(),
      },

      emailRedirectTo:
        `${window.location.origin}/login`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}


// ==========================================
// 2. LOGIN USER
// ==========================================

export async function signIn({ email, password }) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}


// ==========================================
// 3. LOGOUT USER
// ==========================================

export async function signOut() {
  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    throw error;
  }
}


// ==========================================
// 4. GET CURRENT SESSION
// ==========================================

export async function getSession() {
  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}


// ==========================================
// 5. GET ACCESS TOKEN
// ==========================================

export async function getAccessToken() {
  const session = await getSession();

  return session?.access_token ?? null;
}



//6. SignUP Conformation

export async function resendSignupConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: "signup",

    email: email.trim(),

    options: {
      emailRedirectTo:
        `${window.location.origin}/login`,
    },
  });

  if (error) {
    throw error;
  }
}


export async function requestPasswordReset(email) {

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      }
    );

  if (error) {
    throw error;
  }
}



export async function updatePassword(newPassword) {

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
}
