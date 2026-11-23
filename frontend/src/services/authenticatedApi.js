
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


export async function fetchMyProfile() {

  const token = await getAccessToken();

  if (!token) {
    throw new Error("Please log in first.");
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/me`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      cache: "no-store",
    }
  );

  if (response.status === 401) {
    throw new Error("Session invalid or expired.");
  }

  if (!response.ok) {
    throw new Error(
      `Profile request failed: HTTP ${response.status}`
    );
  }

  return await response.json();
}




async function requestFitnessProfile(method, payload = null) {
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  const token = await getAccessToken();

  if (!token) {
    throw new Error("Please log in again.");
  }

  const url = `${API_BASE_URL.replace(/\/+$/, "")}/api/v1/fitness-profile`;

  let response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PUT"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(method === "PUT"
        ? { body: JSON.stringify(payload) }
        : {}),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Cannot connect to FitVerse API. Check your backend."
    );
  }

  // First-time users have no fitness profile yet.
  if (method === "GET" && response.status === 404) {
    return null;
  }

  if (response.status === 401) {
    throw new Error(
      "Your session is invalid. Please sign in again."
    );
  }

  if (response.status === 403) {
    throw new Error("You do not have access to this profile.");
  }

  if (response.status === 422) {
    throw new Error("Please check your fitness information.");
  }

  if (!response.ok) {
    throw new Error(
      `Fitness profile request failed (HTTP ${response.status}).`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Invalid response from FitVerse API.");
  }
}


export async function fetchFitnessProfile() {
  return await requestFitnessProfile("GET");
}


export async function saveFitnessProfile(data) {
  return await requestFitnessProfile("PUT", data);
}
