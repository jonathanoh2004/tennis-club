// routes/Login.jsx
import { useState } from "react";
import { useAuth } from "../utils/AuthProvider.jsx";
import { authApi } from "../utils/authClient.js";

function prettyErr(e) {
  if (!e) return "Unknown error";
  if (e.message) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}

export default function Login() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      // Sign in (via Amplify). Our AuthProvider wraps this and sets user state.
      await signIn(username.trim(), password);

      // Ensure tokens are ready (important before calling protected APIs)
      const idToken = await authApi.getIdToken();
      console.log("[login] idToken length:", idToken?.length);
      if (!idToken) {
        setMsg(
          "Signed in, but no token yet. If you just created the account, check your email to confirm, then try again."
        );
        return;
      }

      console.log("[login] ID token length:", idToken.length);
      setMsg("Logged in!");
      // Optionally: navigate to dashboard here
      // navigate("/ClubDashboard");
    } catch (e) {
      console.error("[login]", e);
      setMsg(prettyErr(e));
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Login</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          className="w-full border rounded-xl px-3 py-2"
          placeholder="Username (email)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          className="w-full border rounded-xl px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button className="px-4 py-2 rounded-xl bg-blue-600 text-white">
          Sign In
        </button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>
    </div>
  );
}
