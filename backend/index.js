const express = require("express");
const cors = require("cors");
const { Client } = require("pg");

const app = express();
app.use(cors());

app.get("/health", (_, res) => res.json({ ok: true }));

// RDS quick check route (works once DB is ready)
app.get("/db-time", async (_, res) => {
  const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "appdb",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    ssl: false
  });
  try {
    await client.connect();
    const r = await client.query("SELECT NOW()");
    res.json({ now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    await client.end().catch(() => {});
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("API listening on", PORT));
