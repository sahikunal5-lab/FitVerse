
import {
  getAccessToken,
} from "../features/auth/authService";


// Existing FastAPI base URL from Vite environment
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


// ==========================================
// CALL PROTECTED BACKEND ENDPOINT
// ==========================================

export async function fetchAuthenticatedUser() {

  // 1. Verify API configuration
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  // 2. Get current Supabase access token
  const token = await getAccessToken();

  if (!token) {
    throw new Error(
      "No active session. Please log in again."
    );
  }

  // 3. Send authenticated request to FastAPI
  let response;

  try {

    response = await fetch(
      `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/auth-check`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        cache: "no-store",
      }
    );

  } catch {

    throw new Error(
      "Cannot connect to FitVerse API. Check that the backend is running."
    );

  }

  // 4. Handle authentication failure
  if (response.status === 401) {
    throw new Error(
      "Authentication failed. Please sign in again."
    );
  }

  // 5. Handle other backend errors
  if (!response.ok) {
    throw new Error(
      `Backend verification failed (HTTP ${response.status}).`
    );
  }

  // 6. Return verified user information
  const data = await response.json();

  return data;
}
