
import {
  fetchMyProfile,
  fetchFitnessProfile,
  saveFitnessProfile,
} from "./authenticatedApi";


const CACHE_DURATION = 5 * 60 * 1000;

const accountCache = new Map();
const fitnessCache = new Map();

const accountRequests = new Map();
const fitnessRequests = new Map();

let cacheVersion = 0;


// ==========================================
// SHARED CACHE HELPER
// ==========================================

function getCachedData(
  userId,
  cache,
  pendingRequests,
  fetcher,
  identityField
) {

  if (!userId) {
    return Promise.reject(
      new Error("Please log in first.")
    );
  }

  const entry = cache.get(userId);

  // Return saved data if it is still fresh
  if (entry && entry.expiresAt > Date.now()) {
    return Promise.resolve(entry.data);
  }

  // Reuse an existing pending request
  if (pendingRequests.has(userId)) {
    return pendingRequests.get(userId);
  }

  const version = cacheVersion;

  const request = (async () => {

    const data = await fetcher();

    // Prevent displaying another user's information
    if (
      data &&
      String(data[identityField]) !== String(userId)
    ) {
      throw new Error("Profile identity mismatch.");
    }

    // Do not restore cleared cache entries
    if (version === cacheVersion) {
      cache.set(userId, {
        data,
        expiresAt: Date.now() + CACHE_DURATION,
      });
    }

    return data;

  })();

  pendingRequests.set(userId, request);

  request.finally(() => {
    if (pendingRequests.get(userId) === request) {
      pendingRequests.delete(userId);
    }
  }).catch(() => {});

  return request;
}


// ==========================================
// ACCOUNT PROFILE CACHE
// ==========================================

export function getCachedAccountProfile(userId) {

  return getCachedData(
    userId,
    accountCache,
    accountRequests,
    fetchMyProfile,
    "id"
  );

}


// ==========================================
// FITNESS PREFERENCES CACHE
// ==========================================

export function getCachedFitnessProfile(userId) {

  return getCachedData(
    userId,
    fitnessCache,
    fitnessRequests,
    fetchFitnessProfile,
    "user_id"
  );

}


// ==========================================
// SAVE FITNESS PREFERENCES AND UPDATE CACHE
// ==========================================

export async function saveCachedFitnessProfile(
  userId,
  payload
) {

  if (!userId) {
    throw new Error("Please log in first.");
  }

  const version = cacheVersion;

  const saved = await saveFitnessProfile(payload);

  if (String(saved.user_id) !== String(userId)) {
    throw new Error("Profile identity mismatch.");
  }

  if (version === cacheVersion) {
    fitnessCache.set(userId, {
      data: saved,
      expiresAt: Date.now() + CACHE_DURATION,
    });
  }

  return saved;
}


// ==========================================
// CLEAR CACHE AFTER LOGOUT
// ==========================================

export function clearProfileCaches() {

  cacheVersion += 1;

  accountCache.clear();
  fitnessCache.clear();

  accountRequests.clear();
  fitnessRequests.clear();

}
