import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";

function fmtDate(ts) {
  const n = Number(ts);
  return Number.isFinite(n) ? new Date(n).toLocaleString() : "-";
}

function TeamLabel({ team }) {
  if (!Array.isArray(team) || team.length === 0) return <span>-</span>;
  return <span className="truncate">{team.join(" & ")}</span>;
}

export default function ClubDashboard() {
  const navigate = useNavigate();
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [clubsErr, setClubsErr] = useState("");

  const [clubId, setClubId] = useState(() => localStorage.getItem("clubId") || "");
  const [clubSearch, setClubSearch] = useState("");

  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchesErr, setMatchesErr] = useState("");

  // --- fetch clubs (uses api helper, which has fallback base URL) ---
  const loadClubs = async () => {
    setLoadingClubs(true);
    setClubsErr("");
    try {
      const data = await api.get("/clubs");
      setClubs(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      setClubsErr(String(e.message || e));
      setClubs([]);
    } finally {
      setLoadingClubs(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  // choose a default club if none selected
  useEffect(() => {
    if (!clubId && clubs.length > 0) {
      setClubId(clubs[0].clubId);
    }
  }, [clubs, clubId]);

  // persist selected club
  useEffect(() => {
    if (clubId) localStorage.setItem("clubId", clubId);
  }, [clubId]);

  // --- fetch matches for selected club ---
  async function fetchMatches(forClubId) {
    if (!forClubId) return;
    setLoadingMatches(true);
    setMatchesErr("");
    try {
      const data = await api.get(`/matches?clubId=${encodeURIComponent(forClubId)}`);
      setMatches(data.items || []);
    } catch (e) {
      setMatchesErr(String(e.message || e));
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }

  useEffect(() => {
    fetchMatches(clubId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // --- delete club ---
  async function deleteClub() {
    if (!clubId) return;
    const ok = confirm("Delete this club and all its matches? This cannot be undone.");
    if (!ok) return;
    try {
      await api.del(`/clubs/${encodeURIComponent(clubId)}`);
      const nextClubs = clubs.filter((c) => c.clubId !== clubId);
      setClubs(nextClubs);
      const nextSelected = nextClubs[0]?.clubId || "";
      setClubId(nextSelected);
      localStorage.setItem("clubId", nextSelected);
      setMatches([]);
      setMatchesErr("");
      alert("Club deleted.");
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  }

  const filteredClubs = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.clubId || "").toLowerCase().includes(q)
    );
  }, [clubs, clubSearch]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50">
      {/* Sidebar: clubs */}
      <aside className="md:col-span-3 bg-white rounded-2xl shadow p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Clubs</h2>
          <Link
            to="/ClubJoin"
            className="text-sm px-2 py-1 rounded-lg border hover:bg-gray-50"
          >
            + Join/Create
          </Link>
        </div>

        <input
          type="text"
          value={clubSearch}
          onChange={(e) => setClubSearch(e.target.value)}
          placeholder="Search clubs…"
          className="mt-3 w-full rounded-xl border px-3 py-2"
        />

        {loadingClubs && <p className="mt-3 text-sm text-gray-500">Loading clubs…</p>}
        {clubsErr && <p className="mt-3 text-sm text-red-600">Error: {clubsErr}</p>}

        <ul className="mt-3 space-y-2 overflow-auto">
          {filteredClubs.map((c) => (
            <li key={c.clubId}>
              <button
                onClick={() => setClubId(c.clubId)}
                className={`w-full text-left px-3 py-2 rounded-xl border hover:bg-gray-50 ${
                  clubId === c.clubId ? "border-blue-500 ring-1 ring-blue-200" : ""
                }`}
                title={c.clubId}
              >
                <div className="font-medium truncate">{c.name || "(unnamed club)"}</div>
                <div className="text-xs text-gray-500 truncate">{c.clubId}</div>
              </button>
            </li>
          ))}
          {!loadingClubs && filteredClubs.length === 0 && (
            <li className="text-sm text-gray-500">No clubs found.</li>
          )}
        </ul>
      </aside>

      {/* Main: selected club details */}
      <main className="md:col-span-9 bg-white rounded-2xl shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">
              {clubs.find((c) => c.clubId === clubId)?.name || "Select a club"}
            </h1>
            {clubId && <p className="text-xs text-gray-500">Club ID: {clubId}</p>}
          </div>

          <div className="flex items-center gap-2">
            {clubId && (
              <>
                <button
                  onClick={deleteClub}
                  className="px-3 py-2 rounded-xl border hover:bg-gray-50"
                  title="Delete club"
                >
                  Delete Club
                </button>
                <Link
                  to={`/CreateMatch?clubId=${encodeURIComponent(clubId)}`}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >
                  + New Match
                </Link>
              </>
            )}
            <button
              onClick={() => fetchMatches(clubId)}
              className="px-3 py-2 rounded-xl border hover:bg-gray-50"
              disabled={!clubId || loadingMatches}
            >
              {loadingMatches ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Match history */}
        <section className="mt-4">
          <h3 className="text-lg font-semibold">Recent Matches</h3>
          {matchesErr && <p className="mt-2 text-sm text-red-600">Error: {matchesErr}</p>}

          {!clubId && (
            <p className="mt-3 text-sm text-gray-500">Choose a club to view its matches.</p>
          )}

          {clubId && (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Started</th>
                    <th className="py-2 pr-4">Team A</th>
                    <th className="py-2 pr-4">Team B</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">Best Of</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => {
                    const a = m.teams?.A || m.teamA || [];
                    const b = m.teams?.B || m.teamB || [];
                    const scoreA = m.score?.A ?? m.scoreA ?? 0;
                    const scoreB = m.score?.B ?? m.scoreB ?? 0;
                    return (
                      <tr key={m.matchId} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-4 whitespace-nowrap">{fmtDate(m.startedAt)}</td>
                        <td className="py-2 pr-4 max-w-[180px]"><TeamLabel team={a} /></td>
                        <td className="py-2 pr-4 max-w-[180px]"><TeamLabel team={b} /></td>
                        <td className="py-2 pr-4 font-mono">{scoreA} : {scoreB}</td>
                        <td className="py-2 pr-4">{m.bestOf || "-"}</td>
                        <td className="py-2 pr-4">{m.status || "LIVE"}</td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-2">
                            <Link
                              to={`/LiveMatch/${encodeURIComponent(m.matchId)}`}
                              className="px-2 py-1 rounded-lg border hover:bg-gray-100"
                            >
                              Open
                            </Link>
                            <button
                              onClick={() =>
                                navigate(
                                  `/CreateMatch?clubId=${encodeURIComponent(
                                    clubId
                                  )}&from=${encodeURIComponent(m.matchId)}`
                                )
                              }
                              className="px-2 py-1 rounded-lg border hover:bg-gray-100"
                              title="Create a new match for this club"
                            >
                              Rematch
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {clubId && !loadingMatches && matches.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-gray-500">
                        No matches yet for this club.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
