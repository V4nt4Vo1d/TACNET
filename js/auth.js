const AUTH_KEY = 'tacnet.auth';

export function isAuthed() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const { token, exp } = JSON.parse(raw);
    if (!token) return false;
    if (exp && Date.now() > exp) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function login({ username }) {
  const token = 'Δ-' + Math.random().toString(36).slice(2);
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user: username, exp }));
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  location.href = 'index.html';
}

export function requireAuth() {
  if (!isAuthed()) {
    const back = new URL(location.href).pathname.split('/').pop() || 'dashboard.html';
    location.href = `login.html?next=${encodeURIComponent(back)}`;
  }
}

export function currentUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw).user : null;
  } catch { return null; }
}
