-- Run this once in the Cloudflare D1 Console after creating your database.
-- Dashboard: Workers & Pages → D1 → your database → Console tab → paste this → Run

CREATE TABLE IF NOT EXISTS pairs (
  set_number TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
