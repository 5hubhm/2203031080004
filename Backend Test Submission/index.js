import express from 'express';
import { nanoid } from 'nanoid';
import { log } from './loggingMiddleware/log.js';

const app = express();
app.use(express.json());

const urls = new Map(); // { shortcode: { url, createdAt, expiresAt, clicks: [], clickCount } }

const DEFAULT_VALIDITY_MINUTES = 30;

// Logging middleware
app.use((req, res, next) => {
  log("backend", "info", "middleware", `Request: ${req.method} ${req.path}`);
  next();
});

// Create Short URL
app.post('/shorturls', (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;

    if (!url) {
      log("backend", "error", "handler", "Missing 'url' field");
      return res.status(400).json({ error: "URL is required" });
    }

    let code = shortcode || nanoid(6);
    if (urls.has(code)) {
      log("backend", "error", "handler", "Shortcode already in use");
      return res.status(409).json({ error: "Shortcode already exists" });
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + ((validity || DEFAULT_VALIDITY_MINUTES) * 60000));

    urls.set(code, {
      url,
      createdAt: now,
      expiresAt: expiry,
      clickCount: 0,
      clicks: []
    });

    return res.status(201).json({
      shortLink: `http://localhost:3000/${code}`,
      expiry: expiry.toISOString()
    });
  } catch (err) {
    log("backend", "fatal", "handler", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Redirect Route
app.get('/:shortcode', (req, res) => {
  const code = req.params.shortcode;
  const entry = urls.get(code);

  if (!entry) {
    log("backend", "warn", "handler", `Shortcode not found: ${code}`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  const now = new Date();
  if (entry.expiresAt < now) {
    log("backend", "info", "handler", `Shortcode expired: ${code}`);
    return res.status(410).json({ error: "Shortcode expired" });
  }

  entry.clickCount++;
  entry.clicks.push({
    timestamp: now.toISOString(),
    referrer: req.get('Referrer') || null,
    location: req.ip || req.connection.remoteAddress
  });

  res.redirect(entry.url);
});

// Get Statistics
app.get('/shorturls/:shortcode', (req, res) => {
  const code = req.params.shortcode;
  const entry = urls.get(code);

  if (!entry) {
    log("backend", "error", "handler", `Stats requested for invalid shortcode: ${code}`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  res.json({
    totalClicks: entry.clickCount,
    url: entry.url,
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
    clickStats: entry.clicks
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
