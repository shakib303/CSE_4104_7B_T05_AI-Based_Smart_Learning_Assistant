// src/controllers/user.controller.js
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { now, toCamel } = require("../utils/dbHelpers");

// GET /api/users/profile
exports.getProfile = (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!row) return res.status(404).json({ error: "User not found" });

    const user = toCamel(row);
    delete user.password;

    const subjectRows = db.prepare(`
      SELECT us.proficiency, us.target_score, s.id as subject_id, s.name, s.color, s.icon
      FROM user_subjects us
      JOIN subjects s ON us.subject_id = s.id
      WHERE us.user_id = ?
    `).all(req.user.id);

    user.subjects = subjectRows.map((r) => ({
      id: r.subject_id, name: r.name, color: r.color, icon: r.icon,
      proficiency: r.proficiency, targetScore: r.target_score,
    }));

    return res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile
exports.updateProfile = (req, res, next) => {
  try {
    const { name, bio, timezone, studyGoalHrs, avatar } = req.body;
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push("name = ?"); params.push(name); }
    if (bio !== undefined) { fields.push("bio = ?"); params.push(bio); }
    if (timezone !== undefined) { fields.push("timezone = ?"); params.push(timezone); }
    if (studyGoalHrs !== undefined) { fields.push("study_goal_hrs = ?"); params.push(parseFloat(studyGoalHrs)); }
    if (avatar !== undefined) { fields.push("avatar = ?"); params.push(avatar); }
    fields.push("updated_at = ?"); params.push(now());

    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...params);

    const row = db.prepare("SELECT id, name, email, avatar, bio, timezone, study_goal_hrs FROM users WHERE id = ?").get(req.user.id);
    return res.json({ user: toCamel(row) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const row = db.prepare("SELECT password FROM users WHERE id = ?").get(req.user.id);

    const valid = await bcrypt.compare(currentPassword, row.password);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 12);
    db.prepare("UPDATE users SET password = ?, updated_at = ? WHERE id = ?").run(hashed, now(), req.user.id);
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};
