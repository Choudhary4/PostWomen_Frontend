/**
 * authService.js
 *
 * Handles login, register, logout, and token management.
 * Token is stored in localStorage under 'pw_token'.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

const TOKEN_KEY = 'pw_token';
const USER_KEY  = 'pw_user';

// ─── Token Helpers ────────────────────────────────────────────────────────
export function getToken()       { return localStorage.getItem(TOKEN_KEY); }
export function getUser()        { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
export function isAuthenticated(){ return !!getToken(); }
function storeAuth(token, user)  { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function clearAuth()      { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

// ─── Authenticated fetch wrapper ──────────────────────────────────────────
async function authFetch(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

// ─── Auth Actions ─────────────────────────────────────────────────────────

/**
 * Register a new account.
 * @returns {{ token, user }}
 */
export async function register({ username, email, password, firstName, lastName }) {
  const res = await authFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, firstName, lastName }),
  });
  storeAuth(res.data.token, res.data.user);
  return res.data;
}

/**
 * Login with email/username + password.
 * @returns {{ token, user }}
 */
export async function login({ identifier, password }) {
  const res = await authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  storeAuth(res.data.token, res.data.user);
  return res.data;
}

/**
 * Fetch the current user's profile from the server.
 */
export async function fetchProfile() {
  const res = await authFetch('/auth/profile');
  localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
  return res.data.user;
}

/**
 * Update first name, last name, or bio.
 */
export async function updateProfile(updates) {
  const res = await authFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
  return res.data.user;
}

/**
 * Change password — requires currentPassword for verification.
 */
export async function changePassword({ currentPassword, newPassword }) {
  await authFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/**
 * Logout — clears token from localStorage.
 */
export async function logout() {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } catch (_) {
    // Even if the server call fails, we clear local auth
  } finally {
    clearAuth();
  }
}