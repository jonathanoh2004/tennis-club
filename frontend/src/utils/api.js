// frontend/src/utils/api.js
import { authApi } from "./authClient";
const BASE = import.meta.env.VITE_API_BASE;

/** Internal helper: fetch with auth + JSON + nicer errors */
async function authedFetch(path, init = {}) {
  const token = await authApi.getIdToken().catch(() => "");
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.method && init.method !== "GET" && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/* -------- Generic object (used by Profile.jsx) -------- */
export const api = {
  get: (path) => authedFetch(path),
  post: (path, body) =>
    authedFetch(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
};

/* -------- Specific helpers (optional to use elsewhere) -------- */

export async function getMatch(id) {
  if (!id) throw new Error("match id required");
  return authedFetch(`/matches/${encodeURIComponent(id)}`);
}

export async function bumpScore(id, team, delta = 1) {
  if (!id) throw new Error("match id required");
  if (!team) throw new Error("team required (A or B)");
  return authedFetch(`/matches/${encodeURIComponent(id)}/score`, {
    method: "POST",
    body: JSON.stringify({ team, which: team, delta }),
  });
}

export async function finalizeMatch(id) {
  if (!id) throw new Error("match id required");
  return authedFetch(`/matches/${encodeURIComponent(id)}/finalize`, { method: "POST" });
}

export async function listMatches(clubId) {
  if (!clubId) throw new Error("clubId required");
  return authedFetch(`/matches?clubId=${encodeURIComponent(clubId)}`);
}

export async function getMe() {
  return authedFetch(`/me`);
}

export async function updateProfile(displayName) {
  return authedFetch(`/profile`, {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });
}

export async function joinClub(clubId) {
  if (!clubId) throw new Error("clubId required");
  return authedFetch(`/clubs/${encodeURIComponent(clubId)}/members`, { method: "POST" });
}

export async function listMembers(clubId) {
  if (!clubId) throw new Error("clubId required");
  return authedFetch(`/clubs/${encodeURIComponent(clubId)}/members`);
}
