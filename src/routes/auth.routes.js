// src/routes/auth.routes.js
const express = require("express");
const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// Public routes
router.post("/login", authController.login);
router.delete("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Protected routes (example)
router.get("/me", protect, authController.getMe);

module.exports = router;