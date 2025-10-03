import { useEffect, useState } from "react";
import "./App.css";

// change the URL to your EC2 backend later
const API = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export default function App() {
  const [apiMsg, setApiMsg] = useState("");
  const [dbTime, setDbTime] = useState("");

  // check API health as soon as page loads
  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(d => setApiMsg(JSON.stringify(d)))
      .catch(() => setApiMsg("❌ cannot reach API"));
  }, []);

  // button to test DB endpoint (optional)
  const checkDb = async () => {
    try {
      const r = await fetch(`${API}/db-time`);
      const j = await r.json();
      setDbTime(JSON.stringify(j));
    } catch (e) {
      setDbTime("❌ DB not connected yet");
    }
  };

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Frontend on S3 + Backend on EC2</h1>
      <p>API /health: {apiMsg || "…loading"}</p>

      <button onClick={checkDb}>Check DB Time</button>
      <p>DB Response: {dbTime}</p>
    </div>
  );
}
