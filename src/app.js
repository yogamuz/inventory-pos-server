// src/app.js
const express = require("express");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");


const {
  corsOptions,
  helmetConfig,
  mongoSanitizeConfig,
  xssMiddleware,
  hppConfig,
} = require("./config/security");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const historyRoutes = require("./routes/history.routes");
const exportRoutes = require("./routes/export.routes");

const app = express();

// Security middlewares
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize(mongoSanitizeConfig));
app.use(xssMiddleware);
app.use(hpp(hppConfig));
app.use(cookieParser());

// Logging middleware (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/export", exportRoutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;