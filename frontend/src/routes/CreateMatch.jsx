import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api"; // your existing helper

export default function CreateMatch() {
  const nav = useNavigate();
  const { search } = useLocation();
  const qs = useMemo(() => new URLSearchParams(search), [search]);
  const clubId = qs.get("clubId"); // e.g., club_WHdar51u

  const [teamA1, setTeamA1] = useState("");
  const [teamA2, setTeamA2] = useState("");
  const [teamB1, setTeamB1] = useState("");
  const [teamB2, setTeamB2] = useState("");
  const [bestOf, setBestOf] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clubId) setError("Missing clubId in URL. Use the + New Match button from a club.");
  }, [clubId]);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!clubId) return;

    const A = [teamA1, teamA2].filter(Boolean);
    const B = [teamB1, teamB2].filter(Boolean);

    if (A.length === 0 || B.length === 0) {
      setError("Enter at least one player for each team.");
      return;
    }

    const payload = {
      clubId,
      teams: { A, B },          // <-- matches backend expectation
      bestOf: Number(bestOf) || 1,
      startedAt: Date.now(),
    };

    try {
      setSaving(true);
      await api.post(`/matches`, payload); // api.js should add Authorization header
      localStorage.setItem("clubId", clubId);
      nav(`/ClubDashboard`, { replace: true });
    } catch (e) {
      setError(e.message || "Failed to create match");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4">Create Match</h1>
      {clubId ? <p className="text-xs text-gray-500 mb-4">Club: {clubId}</p> : null}
      {error ? (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit} className="max-w-xl space-y-4">
        <fieldset className="border rounded-xl p-3">
          <legend className="text-sm font-medium">Team A</legend>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Player 1"
              value={teamA1} onChange={(e) => setTeamA1(e.target.value)} />
            <input className="border rounded px-2 py-1" placeholder="Player 2 (optional)"
              value={teamA2} onChange={(e) => setTeamA2(e.target.value)} />
          </div>
        </fieldset>

        <fieldset className="border rounded-xl p-3">
          <legend className="text-sm font-medium">Team B</legend>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Player 1"
              value={teamB1} onChange={(e) => setTeamB1(e.target.value)} />
            <input className="border rounded px-2 py-1" placeholder="Player 2 (optional)"
              value={teamB2} onChange={(e) => setTeamB2(e.target.value)} />
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm">Best Of</span>
          <select className="mt-1 border rounded px-2 py-1"
            value={bestOf} onChange={(e) => setBestOf(e.target.value)}>
            <option value={1}>1</option>
            <option value={3}>3</option>
          </select>
        </label>

        <div className="flex gap-2">
          <button
            disabled={saving || !clubId || !teamA1 || !teamB1}
            className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
            type="submit"
          >
            {saving ? "Creating…" : "Create Match"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl border"
            onClick={() => nav(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
