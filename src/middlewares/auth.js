// src/middlewares/auth.js
const authService = require("../services/auth.service");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // ✅ TAMBAH LOGGING INI:
    console.log("=== AUTH MIDDLEWARE DEBUG ===");
    console.log("Cookies:", req.cookies);
    console.log("Headers:", req.headers);
    console.log("Origin:", req.headers.origin);

    // Get token from cookie (prioritas pertama)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log("Token found in cookie"); // ✅ TAMBAH
    }
    // Fallback: Get token from header (untuk backward compatibility)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token found in header"); // ✅ TAMBAH
    }

    if (!token) {
      console.log("No token found!"); // ✅ TAMBAH
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token);

    // Get user from token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid or expired",
    });
  }
};

module.exports = { protect };
