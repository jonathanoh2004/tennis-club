import React, { useEffect, useState } from "react";

export default function ClubsTest() {
  const [clubs, setClubs] = useState([]);
  const API_BASE = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    async function fetchClubs() {
      try {
        const res = await fetch(`${API_BASE}/clubs`);
        const data = await res.json();
        setClubs(data);
      } catch (err) {
        console.error("Error fetching clubs:", err);
      }
    }
    fetchClubs();
  }, [API_BASE]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Club List</h1>
      {clubs.length === 0 ? (
        <p>No clubs found.</p>
      ) : (
        <ul>
          {clubs.map((club) => (
            <li key={club.clubId}>
              {club.name} ({club.clubId})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
