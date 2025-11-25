// src/controllers/auth.controller.js
const authService = require("../services/auth.service");

class AuthController {
  // Login
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide username and password",
        });
      }

      const result = await authService.login(username, password);

      // Set token ke HTTP-only cookie
      res.cookie("token", result.token, authService.getCookieOptions());

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          // Token tidak perlu dikirim ke frontend
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Forgot Password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Please provide email address",
        });
      }

      const result = await authService.forgotPassword(email);

      // In production, send this token via email
      // For now, returning it in response (ONLY FOR DEVELOPMENT)
      res.status(200).json({
        success: true,
        message: "Password reset token generated",
        data: {
          resetToken: result.resetToken, // Remove this in production
          message: "Reset token has been sent to your email",
        },
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Please provide new password",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      const result = await authService.resetPassword(token, password);

      // Set token ke HTTP-only cookie
      res.cookie("token", result.token, authService.getCookieOptions());

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          // Token tidak perlu dikirim ke frontend
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get current user (protected route example)
  async getMe(req, res) {
    try {
      // req.user is set by auth middleware
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
  // Logout
  async logout(req, res) {
    try {
      // Clear cookie
      res.clearCookie("token");

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AuthController();
