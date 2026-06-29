// src/routes/subject.routes.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const db = require("../config/db");
const { newId, now, toCamel, toCamelList } = require("../utils/dbHelpers");

router.use(authenticate);

// GET /api/subjects
router.get("/", (req, res, next) => {
  try {
    const rows = db.prepare("SELECT * FROM subjects ORDER BY name ASC").all();
    return res.json({ subjects: toCamelList(rows) });
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects
router.post("/", (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;
    const id = newId();
    db.prepare("INSERT INTO subjects (id, name, description, color, icon, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, name, description || null, color || "#3B82F6", icon || null, now());
    const row = db.prepare("SELECT * FROM subjects WHERE id = ?").get(id);
    return res.status(201).json({ subject: toCamel(row) });
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects/user — enroll current user in a subject
router.post("/user", (req, res, next) => {
  try {
    const { subjectId, proficiency, targetScore } = req.body;
    const existing = db.prepare("SELECT id FROM user_subjects WHERE user_id = ? AND subject_id = ?")
      .get(req.user.id, subjectId);

    if (existing) {
      db.prepare("UPDATE user_subjects SET proficiency = ?, target_score = ? WHERE id = ?")
        .run(proficiency || 50, targetScore || null, existing.id);
    } else {
      db.prepare("INSERT INTO user_subjects (id, user_id, subject_id, proficiency, target_score, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(newId(), req.user.id, subjectId, proficiency || 50, targetScore || null, now());
    }

    const row = db.prepare(`
      SELECT us.*, s.name, s.color, s.icon FROM user_subjects us
      JOIN subjects s ON us.subject_id = s.id
      WHERE us.user_id = ? AND us.subject_id = ?
    `).get(req.user.id, subjectId);

    return res.json({ userSubject: toCamel(row) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
