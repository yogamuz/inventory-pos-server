const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const emailService = require("./email.service");

class AuthService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });
  }
  // Generate cookie options
  getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = process.env.VERCEL === "1";

    // Untuk development atau test
    if (!isProduction && !isVercel) {
      return {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      };
    }

    // Untuk production (Vercel/hosting lain)
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      // Tambahan untuk compatibility mobile
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    };
  }
// Set cookie dengan fallback untuk mobile
setCookieWithFallback(res, token) {
  const cookieOptions = this.getCookieOptions();

  console.log('=== SET COOKIE DEBUG ===');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Cookie Options:', JSON.stringify(cookieOptions, null, 2));
  console.log('Token length:', token.length);

  // Set cookie utama
  res.cookie("token", token, cookieOptions);
  console.log('✅ Main cookie set');

  // Fallback untuk production
  if (process.env.NODE_ENV === "production") {
    const fallbackOptions = {
      ...cookieOptions,
      sameSite: "lax",
    };
    res.cookie("token_fallback", token, fallbackOptions);
    console.log('✅ Fallback cookie set');
  }

  // Log response headers untuk verifikasi
  const setCookieHeaders = res.getHeaders()['set-cookie'];
  console.log('Set-Cookie headers:', setCookieHeaders);
}

  // Login user
  async login(username, password) {
    // Check if user exists (with password field)
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = this.generateToken(user._id);

    // Return user data without password
    const userObj = user.toObject();
    delete userObj.password;

    return {
      token,
      user: {
        id: userObj.id,
        username: userObj.username,
        email: userObj.email,
        role: userObj.role,
        isActive: userObj.isActive,
        lastLogin: userObj.lastLogin,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt,
      },
    };
  }

  // Request password reset
  async forgotPassword(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found with this email");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username
      );

      return {
        message: "Link reset password telah dikirim ke email Anda",
        // Tambahkan ini untuk development (hapus di production)
        ...(process.env.NODE_ENV === "development" && { resetToken }),
      };
    } catch (error) {
      // Clear token jika gagal kirim email
      user.clearPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      throw new Error("Gagal mengirim email. Silakan coba lagi.");
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    // Hash token to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with token (cek dulu apakah ada)
    const user = await User.findOne({
      passwordResetToken: hashedToken,
    });

    // Jika token ada tapi expired, hapus tokennya
    if (user && user.passwordResetExpires < Date.now()) {
      user.clearPasswordResetToken();
      await user.save({ validateBeforeSave: false });
      throw new Error("Invalid or expired reset token");
    }

    // Jika tidak ada user atau token tidak valid
    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Set new password and clear reset token
    user.password = newPassword;
    user.clearPasswordResetToken();
    await user.save();

    // Generate new token
    const jwtToken = this.generateToken(user._id);

    return {
      token: jwtToken,
      message: "Password reset successful",
    };
  }

  // Clean up expired reset tokens
  async cleanupExpiredTokens() {
    try {
      await User.updateMany(
        {
          passwordResetExpires: { $lt: Date.now() },
          passwordResetToken: { $ne: null },
        },
        {
          $unset: {
            passwordResetToken: "",
            passwordResetExpires: "",
          },
        }
      );
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }
}

module.exports = new AuthService();
