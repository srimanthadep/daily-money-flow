const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = Number(process.env.PORT || 5000);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = Boolean(supabaseUrl && supabaseKey);
const supabase = isConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Middleware
app.disable("x-powered-by");

const allowedOrigins = [
  "https://admin.upender.in",
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.some((allowed) => origin.startsWith(allowed))
      ) {
        return callback(null, true);
      }
      return callback(new Error("Blocked by CORS policy"));
    },
    credentials: true,
  })
);
app.use(express.json());

// Status payload
function getStatus() {
  return {
    ok: true,
    service: "daily-money-flow-backend",
    uptimeSeconds: Math.floor(process.uptime()),
    supabaseConfigured: isConfigured,
    timestamp: new Date().toISOString(),
  };
}

// Routes
app.get("/health", (_req, res) => {
  res.status(200).json(getStatus());
});

app.get("/api/status", (_req, res) => {
  res.status(200).json(getStatus());
});

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Daily Money Flow Backend API is running.",
    status: getStatus(),
    endpoints: {
      health: "/health",
      apiStatus: "/api/status",
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Endpoint not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ ok: false, error: err.message || "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
