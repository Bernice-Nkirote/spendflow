const LAST_ACTIVITY_KEY = "last_activity_at";
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

export function clearInternalSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function updateLastActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function hasSessionExpiredByInactivity() {
  const lastActivityAt = localStorage.getItem(LAST_ACTIVITY_KEY);

  if (!lastActivityAt) {
    return true;
  }

  const parsedLastActivityAt = Number(lastActivityAt);

  if (!Number.isFinite(parsedLastActivityAt)) {
    return true;
  }

  return Date.now() - parsedLastActivityAt > INACTIVITY_LIMIT_MS;
}

export function saveCurrentPathForLogin() {
  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;

  if (currentPath !== "/login") {
    sessionStorage.setItem("returnToAfterLogin", currentPath);
  }
}
