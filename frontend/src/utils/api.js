const BASE = import.meta.env.VITE_API_BASE;

export async function getMatch(id) {
  const r = await fetch(`${BASE}/matches/${id}`);
  if (!r.ok) throw new Error("getMatch failed");
  return r.json();
}

export async function bumpScore(id, team, delta = 1) {
  const r = await fetch(`${BASE}/matches/${id}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team, delta }),
  });
  if (!r.ok) throw new Error("bumpScore failed");
  return r.json();
}

export async function finalizeMatch(id) {
  const r = await fetch(`${BASE}/matches/${id}/finalize`, { method: "POST" });
  if (!r.ok) throw new Error("finalize failed");
  return r.json();
}
