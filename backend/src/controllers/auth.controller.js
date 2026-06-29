// src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { newId, now, toCamel } = require("../utils/dbHelpers");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = newId();
    const timestamp = now();

    db.prepare(
      "INSERT INTO users (id, email, name, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, email, name, hashedPassword, timestamp, timestamp);

    const user = { id, name, email, role: "STUDENT", createdAt: timestamp };

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    db.prepare(
      "INSERT INTO refresh_tokens (id, token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(newId(), refreshToken, id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), timestamp);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Registration successful.",
      user,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!row || !row.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, row.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    db.prepare("UPDATE users SET last_active_at = ? WHERE id = ?").run(now(), row.id);

    const user = toCamel(row);
    delete user.password;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    db.prepare(
      "INSERT INTO refresh_tokens (id, token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(newId(), refreshToken, user.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), now());

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      db.prepare("DELETE FROM refresh_tokens WHERE token = ?").run(refreshToken);
    }
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const stored = db.prepare("SELECT * FROM refresh_tokens WHERE token = ?").get(token);
    if (!stored || new Date(stored.expires_at) < new Date()) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const payload = verifyRefreshToken(token);
    const userRow = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id);
    if (!userRow) return res.status(401).json({ error: "User not found" });

    const user = toCamel(userRow);
    delete user.password;

    const newAccessToken = generateAccessToken(user);
    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!row) return res.status(404).json({ error: "User not found" });

    const user = toCamel(row);
    delete user.password;
    delete user.googleId;

    return res.json({ user });
  } catch (err) {
    next(err);
  }
};
