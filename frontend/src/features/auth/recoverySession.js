
const RECOVERY_KEY = "fitverse_recovery_context";

// Maximum time we preserve the recovery UI marker
const RECOVERY_WINDOW_MS = 30 * 60 * 1000;


// ==========================================
// SAVE RECOVERY MARKER
// ==========================================

export function saveRecoveryMarker(userId) {

  if (!userId) return;

  const marker = {
    userId,
    expiresAt: Date.now() + RECOVERY_WINDOW_MS,
  };

  try {
    window.sessionStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify(marker)
    );
  } catch {
    // Storage may be unavailable in some browsers.
  }
}


// ==========================================
// VALIDATE RECOVERY MARKER
// ==========================================

export function hasValidRecoveryMarker(userId) {

  if (!userId) return false;

  try {

    const stored = window.sessionStorage.getItem(
      RECOVERY_KEY
    );

    if (!stored) return false;

    const marker = JSON.parse(stored);

    const isValid =
      marker?.userId === userId &&
      typeof marker?.expiresAt === "number" &&
      marker.expiresAt > Date.now();

    if (!isValid) {
      clearRecoveryMarker();
    }

    return isValid;

  } catch {

    clearRecoveryMarker();
    return false;

  }
}


// ==========================================
// CLEAR RECOVERY MARKER
// ==========================================

export function clearRecoveryMarker() {

  try {
    window.sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    // Nothing else is required here.
  }
}
