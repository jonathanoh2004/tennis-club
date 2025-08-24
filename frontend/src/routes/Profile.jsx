// routes/Profile.jsx (snippet)
import { useEffect, useState } from "react";
import { api } from "../utils/api";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { (async () => {
    const res = await api.get('/me');
    if (res.ok) {
      const data = await res.json();
      setMe(data);
      setDisplayName(data.displayName || "");
    }
  })(); }, []);

  async function save() {
    setMsg("");
    const res = await api.post('/profile', { displayName });
    if (res.ok) { setMsg("Saved!"); setMe(await res.json()); }
    else setMsg("Failed to save");
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Profile</h1>
      {me && <p className="text-sm text-gray-600 mt-1">{me.email}</p>}
      <div className="mt-4 space-y-3">
        <input className="w-full border rounded-xl px-3 py-2" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Display name" />
        <button onClick={save} className="px-4 py-2 rounded-xl bg-blue-600 text-white">Save</button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </div>
    </div>
  );
}
