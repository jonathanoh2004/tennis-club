import { authApi } from "./authClient";

// Prefer env, but fall back to your known dev API so localhost *always* works.
const DEFAULT_BASE = "https://r9521m884k.execute-api.us-west-2.amazonaws.com/dev";
const API_BASE = import.meta.env?.VITE_API_BASE || DEFAULT_BASE;

if (!import.meta.env?.VITE_API_BASE) {
  // Helpful log so you know env wasn't picked up during dev
  // (Vite only reads .env on startup; ensure file is in /frontend and restart dev server)
  // eslint-disable-next-line no-console
  console.warn(
    "[api] VITE_API_BASE not found; using fallback:",
    API_BASE
  );
}

async function authHeaders(extra = {}) {
  try {
    const token = await authApi.getIdToken();
    return token
      ? { Authorization: `Bearer ${token}`, ...extra }
      : { ...extra };
  } catch {
    return { ...extra };
  }
}

async function handle(res) {
  if (res.status === 204) return null;
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  base: API_BASE,

  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: await authHeaders(),
    });
    return handle(res);
  },

  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body ?? {}),
    });
    return handle(res);
  },

  async del(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    return handle(res);
  },
};
