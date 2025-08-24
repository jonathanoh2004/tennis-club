import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function LiveMatch() {
  const navigate = useNavigate();
  const { matchId: pathMatchId } = useParams();
  const [searchParams] = useSearchParams();
  const queryMatchId = searchParams.get("matchId") || "";

  const matchId = useMemo(() => pathMatchId || queryMatchId || "", [pathMatchId, queryMatchId]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [match, setMatch] = useState(null);

  async function loadMatch(id) {
    if (!id) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`GET /matches/${id} -> ${res.status}`);
      const data = await res.json();
      setMatch(data);
    } catch (e) {
      setErr(String(e.message || e));
      setMatch(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (matchId) loadMatch(matchId);
  }, [matchId]);

  function handleJump(e) {
    e.preventDefault();
    const id = new FormData(e.currentTarget).get("matchId")?.toString().trim();
    if (id) navigate(`/LiveMatch/${encodeURIComponent(id)}`);
  }

  if (!matchId) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <h1 className="text-xl font-bold">Open Live Match</h1>
        <p className="text-sm text-gray-600 mt-1">Enter a match ID to view or manage it.</p>
        <form onSubmit={handleJump} className="mt-4 flex gap-2">
          <input
            name="matchId"
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="match_123..."
          />
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            Open
          </button>
        </form>
      </div>
    );
  }

  const a = match?.teams?.A || match?.teams?.a || match?.teamA || [];
  const b = match?.teams?.B || match?.teams?.b || match?.teamB || [];
  const scoreA = match?.score?.A ?? match?.score?.a ?? match?.scoreA ?? 0;
  const scoreB = match?.score?.B ?? match?.score?.b ?? match?.scoreB ?? 0;

  async function bump(which, delta) {
    try {
      const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(matchId)}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ which, delta }),
      });
      if (!res.ok) throw new Error(`POST score -> ${res.status}`);
      await loadMatch(matchId);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function finalize() {
    try {
      const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(matchId)}/finalize`, {
        method: "POST"
      });
      if (!res.ok) throw new Error(`POST finalize -> ${res.status}`);
      await loadMatch(matchId);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Live Match</h1>
        <div className="text-xs text-gray-500">Match ID: {matchId}</div>
      </div>

      {loading && <p className="mt-3 text-sm text-gray-500">Loading…</p>}
      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      {match && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-gray-600">
            Club: <span className="font-mono">{match.clubId}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="p-4 rounded-2xl border">
              <div className="text-xs text-gray-500 mb-1">Team A</div>
              <div className="font-medium">{a.join(" & ") || "-"}</div>
            </div>

            <div className="text-center p-4 rounded-2xl border font-mono text-2xl">
              {scoreA} : {scoreB}
            </div>

            <div className="p-4 rounded-2xl border">
              <div className="text-xs text-gray-500 mb-1">Team B</div>
              <div className="font-medium">{b.join(" & ") || "-"}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => bump("A", +1)} className="px-3 py-2 rounded-xl border">A +1</button>
            <button onClick={() => bump("A", -1)} className="px-3 py-2 rounded-xl border">A -1</button>
            <button onClick={() => bump("B", +1)} className="px-3 py-2 rounded-xl border">B +1</button>
            <button onClick={() => bump("B", -1)} className="px-3 py-2 rounded-xl border">B -1</button>
            <button onClick={finalize} className="ml-auto px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700">
              Finalize
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
