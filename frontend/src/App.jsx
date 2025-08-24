import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";

// Routes (pages)
import ClubDashboard from "./routes/ClubDashboard.jsx";
import CreateMatch from "./routes/CreateMatch.jsx";
import Leaderboard from "./routes/Leaderboard.jsx";
import LiveMatch from "./routes/LiveMatch.jsx";
import ClubJoin from "./routes/ClubJoin.jsx";
import Login from "./routes/Login.jsx";
import Signup from "./routes/Signup.jsx";
import Profile from "./routes/Profile.jsx";

// Pages (not in routes folder)
import ClubsTest from "./pages/ClubsTest.jsx";

function Nav() {
  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link to="/ClubDashboard" className="font-bold">Tennis Club Tracker</Link>
        <span className="text-gray-300">|</span>
        <Link to="/ClubDashboard" className="hover:underline">Club Dashboard</Link>
        <Link to="/CreateMatch" className="hover:underline">Create Match</Link>
        <Link to="/Leaderboard" className="hover:underline">Leaderboard</Link>
        <Link to="/LiveMatch" className="hover:underline">Live Match</Link>
        <Link to="/ClubJoin" className="hover:underline">Join/Create Club</Link>
        <Link to="/ClubsTest" className="hover:underline">Clubs Test</Link>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/Login" className="hover:underline">Login</Link>
          <Link to="/Signup" className="hover:underline">Signup</Link>
          <Link to="/Profile" className="hover:underline">Profile</Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <Nav />
      <Routes>
        {/* Default route → Club Dashboard */}
        <Route path="/" element={<Navigate to="/ClubDashboard" replace />} />

        {/* Main app routes */}
        <Route path="/ClubDashboard" element={<ClubDashboard />} />
        <Route path="/CreateMatch" element={<CreateMatch />} />
        <Route path="/Leaderboard" element={<Leaderboard />} />

        {/* LiveMatch: support both clean path and legacy no-param page */}
        <Route path="/LiveMatch" element={<LiveMatch />} />
        <Route path="/LiveMatch/:matchId" element={<LiveMatch />} />

        <Route path="/ClubJoin" element={<ClubJoin />} />
        <Route path="/ClubsTest" element={<ClubsTest />} />

        {/* Auth & profile */}
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Profile" element={<Profile />} />

        {/* 404 */}
        <Route path="*" element={<div className="p-6">Not Found</div>} />
      </Routes>
    </Router>
  );
}
