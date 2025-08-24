// routes/Signup.jsx
import { useState } from "react";
import { useAuth } from "../utils/AuthProvider.jsx";

export default function Signup() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      await signUp(username || email, password, email);
      setMsg("Check your email for verification (if required), then log in.");
    } catch (e) {
      setMsg(e.message || String(e));
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Create Account</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Username (optional, defaults to email)" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white">Sign Up</button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>
    </div>
  );
}
