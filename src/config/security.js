// src/config/security.js
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");
const hpp = require("hpp");

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In production, specify allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
    // PERBAIKAN: Cek indexOf ATAU development mode
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV === "development") {
      callback(null, true); // Allow all di development
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Helmet configuration
const helmetConfig = helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false,
});

// MongoDB sanitization configuration
const mongoSanitizeConfig = {
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key}`);
  },
};

// XSS middleware 
const xssMiddleware = (req, res, next) => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        // Simple sanitization tanpa library xss
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '') // Remove < >
          .trim();
      }
    });
  }

  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }

  // Sanitize params
  if (req.params && typeof req.params === 'object') {
    Object.keys(req.params).forEach((key) => {
      if (typeof req.params[key] === "string") {
        req.params[key] = req.params[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }

  next();
};

// HPP configuration (prevent parameter pollution)
const hppConfig = {
  whitelist: [], // Add parameters that should allow duplicates
};

module.exports = {
  corsOptions,
  helmetConfig,
  mongoSanitizeConfig,
  xssMiddleware,
  hppConfig,
};