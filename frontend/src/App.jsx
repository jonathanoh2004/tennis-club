import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";

/* ========== Home ========== */
function Home() {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-400">
            Tennis Club Tracker
          </span>
        </h1>
        <p className="text-gray-600">Tailwind v4 + Vite + React is working ✅</p>

        <div className="space-x-4">
          <Link
            to="/clubs-test"
            className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:brightness-110 transition"
          >
            Go to Clubs Test
          </Link>
          <Link
            to="/matches-test"
            className="inline-block px-6 py-3 rounded-xl bg-teal-600 text-white font-medium hover:brightness-110 transition"
          >
            Go to Matches Test
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ========== Clubs Test ========== */
function ClubsTest() {
  const [clubs, setClubs] = useState([]);
  const [name, setName] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/clubs`);
        const data = await res.json();
        setClubs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Fetch clubs failed:", e);
      }
    })();
  }, [API_BASE]);

  async function createClub(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/clubs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const created = await res.json();
      setClubs((prev) => [created, ...prev]);
      setName("");
    } catch (e) {
      console.error("Create club failed:", e);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="p-4 border-b">
        <Link to="/" className="text-blue-600 hover:underline">← Home</Link>
      </nav>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-bold">Clubs</h2>

        <form onSubmit={createClub} className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="Club name (e.g., Desert Smashers)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Add</button>
        </form>

        <ul className="divide-y">
          {clubs.length === 0 ? (
            <li className="py-4 text-gray-500">No clubs yet.</li>
          ) : (
            clubs.map((c) => (
              <li key={c.clubId} className="py-3">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-500">{c.clubId}</div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

/* ========== Matches Test (full lifecycle) ========== */
function MatchesTest() {
  const API_BASE = import.meta.env.VITE_API_BASE;

  // listing & create
  const [clubId, setClubId] = useState("");
  const [matches, setMatches] = useState([]);
  const [err, setErr] = useState("");

  // active match panel
  const [matchId, setMatchId] = useState("");
  const [active, setActive] = useState(null);
  const [busy, setBusy] = useState(false);

  async function fetchMatches() {
    setErr("");
    if (!clubId) return;
    try {
      const res = await fetch(`${API_BASE}/matches?clubId=${encodeURIComponent(clubId)}`);
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load matches");
    }
  }

  async function createMatch(e) {
    e.preventDefault();
    setErr("");
    if (!clubId) return;
    try {
      const res = await fetch(`${API_BASE}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          teams: { A: ["Alice", "Ann"], B: ["Bob", "Ben"] },
          bestOf: 1,
        }),
      });
      const created = await res.json();
      setMatches((prev) => [created, ...prev]);
      setMatchId(created.matchId);
      setActive(created);
    } catch (e) {
      console.error(e);
      setErr("Failed to create match");
    }
  }

  async function loadMatch(id) {
    if (!id) return;
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("not ok");
      const data = await res.json();
      setActive(data);
      setMatchId(id);
    } catch (e) {
      console.error(e);
      setErr("Failed to load match");
    }
  }

  async function bump(team, delta) {
    if (!matchId) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(matchId)}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team, delta }),
      });
      if (!res.ok) throw new Error("not ok");
      const data = await res.json();
      setActive(data);
    } catch (e) {
      console.error(e);
      setErr("Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!matchId) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(matchId)}/finalize`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("not ok");
      const data = await res.json();
      setActive(data);
    } catch (e) {
      console.error(e);
      setErr("Finalize failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="p-4 border-b">
        <Link to="/" className="text-blue-600 hover:underline">← Home</Link>
      </nav>

      <div className="max-w-4xl mx-auto p-6 grid md:grid-cols-2 gap-8">
        {/* Left: list + create */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Matches</h2>

          <form onSubmit={createMatch} className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="ClubId (paste from ClubsTest)"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
            />
            <button className="px-4 py-2 rounded-lg bg-teal-600 text-white">Add Match</button>
          </form>

          <button
            onClick={fetchMatches}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white"
          >
            Refresh Matches
          </button>

          {err && <div className="text-red-600 text-sm">{err}</div>}

          <ul className="divide-y">
            {matches.length === 0 ? (
              <li className="py-4 text-gray-500">No matches yet.</li>
            ) : (
              matches.map((m) => (
                <li key={m.matchId} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.matchId}</div>
                    <div className="text-xs text-gray-500">Status: {m.status}</div>
                    <div className="text-xs text-gray-500">Score: {JSON.stringify(m.score)}</div>
                  </div>
                  <button
                    className="ml-4 px-3 py-1.5 rounded bg-blue-600 text-white"
                    onClick={() => loadMatch(m.matchId)}
                  >
                    Open
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Right: active match controls */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Active Match</h3>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              placeholder="Enter matchId"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
            />
            <button
              onClick={() => loadMatch(matchId)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white"
            >
              Load
            </button>
          </div>

          {!active ? (
            <div className="text-gray-500 text-sm">
              Load a match to control scores.
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-xl border">
              <div className="text-sm text-gray-500">status: {active.status}</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded border">
                  <div className="font-medium">{(active.teams?.A || ["Team A"]).join(" & ")}</div>
                  <div className="text-4xl">{active.score?.A ?? 0}</div>
                  <div className="flex gap-2 mt-2">
                    <button disabled={busy} onClick={() => bump("A", 1)} className="px-3 py-1 rounded bg-green-600 text-white">+1</button>
                    <button disabled={busy} onClick={() => bump("A", -1)} className="px-3 py-1 rounded bg-gray-200">-1</button>
                  </div>
                </div>

                <div className="p-3 rounded border">
                  <div className="font-medium">{(active.teams?.B || ["Team B"]).join(" & ")}</div>
                  <div className="text-4xl">{active.score?.B ?? 0}</div>
                  <div className="flex gap-2 mt-2">
                    <button disabled={busy} onClick={() => bump("B", 1)} className="px-3 py-1 rounded bg-green-600 text-white">+1</button>
                    <button disabled={busy} onClick={() => bump("B", -1)} className="px-3 py-1 rounded bg-gray-200">-1</button>
                  </div>
                </div>
              </div>

              <button
                disabled={busy || active.status !== "LIVE"}
                onClick={finalize}
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              >
                Finalize Match
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== Router ========== */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clubs-test" element={<ClubsTest />} />
        <Route path="/matches-test" element={<MatchesTest />} />
      </Routes>
    </Router>
  );
}
