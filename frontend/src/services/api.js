
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchHealth() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/health`
  );

  if (!response.ok) {
    throw new Error("FastAPI health check failed");
  }

  return response.json();
}
