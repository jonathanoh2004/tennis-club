import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "../utils/api";

export default function LiveMatch() {
  const navigate = useNavigate();
  const { matchId: matchIdParam } = useParams();           // supports /LiveMatch/:matchId
  const [search] = useSearchParams();                      // supports /LiveMatch?matchId=...
  const matchId =
    matchIdParam ||
    search.get("matchId") ||
    search.get("id") ||
    ""; // empty -> show friendly error

  const [match, setMatch] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // prefer server value; fall back to query param
  const clubId = match?.clubId || search.get("clubId") || "";

  async function load() {
    setErr("");
    if (!matchId) {
      setMatch(null);
      return;
    }
    try {
      const data = await api.get(`/matches/${encodeURIComponent(matchId)}`);
      setMatch(data);
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const teamALabel = useMemo(() => (match?.teams?.A || []).join(" & "), [match]);
  const teamBLabel = useMemo(() => (match?.teams?.B || []).join(" & "), [match]);
  const sA = match?.score?.A ?? 0;
  const sB = match?.score?.B ?? 0;

  async function adjust(team, delta) {
    if (!matchId) return;
    setBusy(true);
    setErr("");
    try {
      await api.post(`/matches/${encodeURIComponent(matchId)}/score`, {
        team,
        delta,
        clubId,
      });
      await load();
    } catch (e) {
      setErr(`POST score -> ${e?.status || ""} ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!matchId) return;
    setBusy(true);
    setErr("");
    try {
      await api.post(`/matches/${encodeURIComponent(matchId)}/finalize`, { clubId });
      navigate(`/ClubDashboard?clubId=${encodeURIComponent(clubId)}`);
    } catch (e) {
      setErr(`POST finalize -> ${e?.status || ""} ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  async function joinClub() {
    if (!clubId) {
      setErr("No clubId found to join.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api.post(`/clubs/${encodeURIComponent(clubId)}/members`, {});
      await load();
    } catch (e) {
      setErr(`Join club failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Live Match</h1>
        <div className="flex gap-2">
          {clubId && (
            <Link
              className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
              to={`/ClubDashboard?clubId=${encodeURIComponent(clubId)}`}
            >
              Back to Club
            </Link>
          )}
        </div>
      </div>

      {!matchId && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2">
          Missing matchId in URL.
        </div>
      )}

      {matchId && (
        <p className="text-xs text-gray-500 mb-2">
          Match ID: <span className="font-mono">{matchId}</span>
        </p>
      )}
      {clubId && (
        <p className="text-xs text-gray-500 mb-4">
          Club: <span className="font-mono">{clubId}</span>
        </p>
      )}

      {err && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2">
          {String(err)}
          {String(err).includes("401") && clubId && (
            <div className="mt-2">
              <button
                onClick={joinClub}
                disabled={busy}
                className="text-sm px-3 py-1 rounded-md bg-black text-white disabled:opacity-50"
              >
                Join this club
              </button>
              <span className="ml-2 text-xs text-gray-600">
                (Required to update scores)
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-600 mb-1">Team A</div>
          <div className="text-lg font-medium">{teamALabel || "—"}</div>
        </div>

        <div className="rounded-2xl border p-4 text-center">
          <div className="text-xl font-semibold">
            {sA} : {sB}
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-xs text-gray-600 mb-1">Team B</div>
          <div className="text-lg font-medium">{teamBLabel || "—"}</div>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          disabled={busy || !matchId}
          onClick={() => adjust("A", +1)}
          className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          A +1
        </button>
        <button
          disabled={busy || !matchId}
          onClick={() => adjust("A", -1)}
          className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          A -1
        </button>
        <button
          disabled={busy || !matchId}
          onClick={() => adjust("B", +1)}
          className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          B +1
        </button>
        <button
          disabled={busy || !matchId}
          onClick={() => adjust("B", -1)}
          className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          B -1
        </button>

        <button
          disabled={busy || !matchId}
          onClick={finalize}
          className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50"
        >
          Finalize
        </button>
      </div>
    </div>
  );
}
