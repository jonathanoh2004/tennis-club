import { useEffect, useState } from "react";
import { getMatch, bumpScore, finalizeMatch } from "../utils/api";

export default function LiveMatch() {
  const [matchId, setMatchId] = useState(""); // quick input to test
  const [m, setM] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await getMatch(matchId);
      setM(data);
    } catch (e) {
      setErr(e.message || "Load failed");
      setM(null);
    }
  }

  async function plus(team) {
    try {
      const data = await bumpScore(matchId, team, 1);
      setM(data);
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  }

  async function minus(team) {
    try {
      const data = await bumpScore(matchId, team, -1);
      setM(data);
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  }

  async function done() {
    try {
      const data = await finalizeMatch(matchId);
      setM(data);
    } catch (e) {
      setErr(e.message || "Finalize failed");
    }
  }

  // if you want to auto-load a known match id, set it here
  useEffect(() => {
    // setMatchId("match_..."); // optional
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Live Match</h1>

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Enter matchId (from createMatch response)"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
          />
          <button onClick={load} className="px-4 py-2 rounded bg-blue-600 text-white">
            Load
          </button>
        </div>

        {err && <div className="text-red-600 text-sm">{err}</div>}

        {m ? (
          <div className="space-y-4 bg-white p-4 rounded-xl shadow">
            <div className="text-sm text-gray-500">status: {m.status}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded border">
                <div className="font-medium">{m.teamA || "Team A"}</div>
                <div className="text-4xl">{m.scoreA ?? 0}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => plus("A")} className="px-3 py-1 rounded bg-green-600 text-white">+1</button>
                  <button onClick={() => minus("A")} className="px-3 py-1 rounded bg-gray-200">-1</button>
                </div>
              </div>
              <div className="p-3 rounded border">
                <div className="font-medium">{m.teamB || "Team B"}</div>
                <div className="text-4xl">{m.scoreB ?? 0}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => plus("B")} className="px-3 py-1 rounded bg-green-600 text-white">+1</button>
                  <button onClick={() => minus("B")} className="px-3 py-1 rounded bg-gray-200">-1</button>
                </div>
              </div>
            </div>

            <button
              disabled={m.status !== "in_progress"}
              onClick={done}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              Finalize Match
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No match loaded yet.</div>
        )}
      </div>
    </div>
  );
}
