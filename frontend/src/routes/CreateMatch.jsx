import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../utils/api";

/**
 * CreateMatch page
 * Expects ?clubId=... in the URL (the dashboard's "+ New Match" link already adds this)
 */
export default function CreateMatch() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const clubId = params.get("clubId") || "";

  // form state
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [b1, setB1] = useState("");
  const [b2, setB2] = useState("");
  const [bestOf, setBestOf] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const teamA = useMemo(
    () => [a1, a2].map((s) => s.trim()).filter(Boolean),
    [a1, a2]
  );
  const teamB = useMemo(
    () => [b1, b2].map((s) => s.trim()).filter(Boolean),
    [b1, b2]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!clubId) {
      setError("Missing clubId in URL. Use the + New Match button from a club.");
      return;
    }
    if (teamA.length === 0 || teamB.length === 0) {
      setError("Each team needs at least one player.");
      return;
    }

    const payload = {
      clubId,
      teams: { A: teamA, B: teamB },
      // backend currently ignores bestOf, but harmless to send for future use
      bestOf: Number(bestOf) || 1,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/matches", payload); // attaches Bearer token automatically
      // res is the created match
      const matchId = res?.matchId;
      if (matchId) {
        // go straight to live match, or back to the dashboard—your choice:
        navigate(`/LiveMatch?matchId=${encodeURIComponent(matchId)}&clubId=${encodeURIComponent(clubId)}`);
      } else {
        // fallback
        navigate(`/ClubDashboard?clubId=${encodeURIComponent(clubId)}`);
      }
    } catch (err) {
      // backend returns { message } on error; api.post throws with that message
      setError(String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Create Match</h1>
        <Link
          to={`/ClubDashboard?clubId=${encodeURIComponent(clubId || "")}`}
          className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
        >
          Back to Club
        </Link>
      </div>

      <p className="text-xs text-gray-600 mb-3">
        Club: <span className="font-mono">{clubId || "(none)"}</span>
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <fieldset className="border rounded-xl p-4">
          <legend className="text-sm font-medium">Team A</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={a1}
              onChange={(e) => setA1(e.target.value)}
              placeholder="Player 1"
              className="w-full rounded-lg border px-3 py-2"
            />
            <input
              value={a2}
              onChange={(e) => setA2(e.target.value)}
              placeholder="Player 2 (optional)"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </fieldset>

        <fieldset className="border rounded-xl p-4">
          <legend className="text-sm font-medium">Team B</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={b1}
              onChange={(e) => setB1(e.target.value)}
              placeholder="Player 1"
              className="w-full rounded-lg border px-3 py-2"
            />
            <input
              value={b2}
              onChange={(e) => setB2(e.target.value)}
              placeholder="Player 2 (optional)"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <label className="text-sm">Best Of</label>
          <select
            value={bestOf}
            onChange={(e) => setBestOf(e.target.value)}
            className="rounded-lg border px-2 py-1"
          >
            <option value={1}>1</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Match"}
          </button>
          <Link
            to={`/ClubDashboard?clubId=${encodeURIComponent(clubId || "")}`}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
