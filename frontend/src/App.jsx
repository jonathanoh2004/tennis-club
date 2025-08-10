import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";

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
        <Link
          to="/clubs-test"
          className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:brightness-110 transition"
        >
          Go to Clubs Test
        </Link>
      </div>
    </div>
  );
}

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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/clubs-test" element={<ClubsTest />} />
      </Routes>
    </Router>
  );
}
