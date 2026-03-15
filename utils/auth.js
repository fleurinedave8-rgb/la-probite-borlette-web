// utils/auth.js - Auth helpers

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('borlette_token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('borlette_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function saveAuth(token, user) {
  localStorage.setItem('borlette_token', token);
  localStorage.setItem('borlette_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('borlette_token');
  localStorage.removeItem('borlette_user');
}

export function isLoggedIn() {
  return !!getToken();
}
