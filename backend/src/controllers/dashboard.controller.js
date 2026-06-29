// src/controllers/dashboard.controller.js
const db = require("../config/db");
const { newId, now, toCamel, toCamelList } = require("../utils/dbHelpers");

function startOfWeekISO() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// GET /api/dashboard
exports.getDashboard = (req, res, next) => {
  try {
    const userId = req.user.id;
    const weekStart = startOfWeekISO();
    const nowIso = now();

    const statusRows = db.prepare(
      "SELECT status, COUNT(*) as c FROM tasks WHERE user_id = ? GROUP BY status"
    ).all(userId);
    const taskSummary = { TODO: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 };
    statusRows.forEach((r) => { taskSummary[r.status] = r.c; });

    const studyMin = db.prepare(
      "SELECT COALESCE(SUM(duration_min),0) as total FROM study_logs WHERE user_id = ? AND date >= ?"
    ).get(userId, weekStart).total;

    const upcomingRows = db.prepare(`
      SELECT t.*, s.name as subject_name, s.color as subject_color
      FROM tasks t LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ? AND t.status != 'DONE' AND t.due_date >= ?
      ORDER BY t.due_date ASC LIMIT 5
    `).all(userId, nowIso);

    const user = db.prepare("SELECT streak, study_goal_hrs FROM users WHERE id = ?").get(userId);

    const upcomingTasks = upcomingRows.map((row) => {
      const t = toCamel(row);
      t.tags = t.tags ? JSON.parse(t.tags) : [];
      return t;
    });

    return res.json({
      taskSummary,
      weeklyStudyHours: +(studyMin / 60).toFixed(1),
      studyGoalHrs: user?.study_goal_hrs || 4,
      streak: user?.streak || 0,
      upcomingTasks,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/dashboard/study-log
exports.logStudySession = (req, res, next) => {
  try {
    const { durationMin, subjectId, notes } = req.body;
    const id = newId();
    const timestamp = now();
    db.prepare(`
      INSERT INTO study_logs (id, user_id, subject_id, duration_min, notes, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, subjectId || null, parseInt(durationMin), notes || null, timestamp, timestamp);

    const row = db.prepare("SELECT * FROM study_logs WHERE id = ?").get(id);
    return res.status(201).json({ log: toCamel(row) });
  } catch (err) {
    next(err);
  }
};
