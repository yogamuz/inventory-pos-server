// src/config/security.js
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:3000", // development
      "http://localhost:5173", // vite dev
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`Blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};
// Helmet config
const helmetConfig = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

// Mongo sanitize
const mongoSanitizeConfig = {
  replaceWith: "_",
};

// XSS middleware
const xssMiddleware = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key].replace(/[<>]/g, "").trim();
      }
    });
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);

  next();
};

// HPP
const hppConfig = {
  whitelist: [],
};

module.exports = {
  corsOptions,
  helmetConfig,
  mongoSanitizeConfig,
  xssMiddleware,
  hppConfig,
};
