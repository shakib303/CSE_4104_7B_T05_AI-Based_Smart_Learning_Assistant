// src/controllers/task.controller.js
const db = require("../config/db");
const { newId, now, toCamel, toCamelList } = require("../utils/dbHelpers");

function serializeTask(row) {
  const task = toCamel(row);
  task.tags = task.tags ? JSON.parse(task.tags) : [];
  if (task.subjectId) {
    task.subject = {
      id: task.subjectId,
      name: task.subjectName,
      color: task.subjectColor,
      icon: task.subjectIcon,
    };
  } else {
    task.subject = null;
  }
  delete task.subjectName;
  delete task.subjectColor;
  delete task.subjectIcon;
  return task;
}

const TASK_JOIN_SELECT = `
  SELECT t.*, s.name as subject_name, s.color as subject_color, s.icon as subject_icon
  FROM tasks t
  LEFT JOIN subjects s ON t.subject_id = s.id
`;

// GET /api/tasks
exports.getTasks = (req, res, next) => {
  try {
    const { status, priority, subjectId, search } = req.query;

    let query = TASK_JOIN_SELECT + " WHERE t.user_id = ?";
    const params = [req.user.id];

    if (status) { query += " AND t.status = ?"; params.push(status); }
    if (priority) { query += " AND t.priority = ?"; params.push(priority); }
    if (subjectId) { query += " AND t.subject_id = ?"; params.push(subjectId); }
    if (search) {
      query += " AND (t.title LIKE ? OR t.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    query += " ORDER BY t.created_at DESC";

    const rows = db.prepare(query).all(...params);
    const tasks = rows.map(serializeTask);

    return res.json({ tasks, count: tasks.length });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks
exports.createTask = (req, res, next) => {
  try {
    const { title, description, priority, dueDate, estimatedMin, tags, subjectId } = req.body;
    const id = newId();
    const timestamp = now();

    db.prepare(`
      INSERT INTO tasks (id, title, description, priority, due_date, estimated_min, tags, subject_id, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, title, description || null, priority || "MEDIUM",
      dueDate || null, estimatedMin ? parseInt(estimatedMin) : null,
      JSON.stringify(tags || []), subjectId || null, req.user.id, timestamp, timestamp
    );

    const row = db.prepare(TASK_JOIN_SELECT + " WHERE t.id = ?").get(id);
    return res.status(201).json({ task: serializeTask(row) });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
exports.getTask = (req, res, next) => {
  try {
    const row = db.prepare(TASK_JOIN_SELECT + " WHERE t.id = ? AND t.user_id = ?").get(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: "Task not found" });
    return res.json({ task: serializeTask(row) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
exports.updateTask = (req, res, next) => {
  try {
    const existing = db.prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: "Task not found" });

    const { title, description, priority, dueDate, estimatedMin, tags, subjectId } = req.body;
    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push("title = ?"); params.push(title); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description); }
    if (priority !== undefined) { fields.push("priority = ?"); params.push(priority); }
    if (dueDate !== undefined) { fields.push("due_date = ?"); params.push(dueDate); }
    if (estimatedMin !== undefined) { fields.push("estimated_min = ?"); params.push(parseInt(estimatedMin)); }
    if (tags !== undefined) { fields.push("tags = ?"); params.push(JSON.stringify(tags)); }
    if (subjectId !== undefined) { fields.push("subject_id = ?"); params.push(subjectId); }
    fields.push("updated_at = ?"); params.push(now());

    params.push(req.params.id);
    db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...params);

    const row = db.prepare(TASK_JOIN_SELECT + " WHERE t.id = ?").get(req.params.id);
    return res.json({ task: serializeTask(row) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id/status
exports.updateStatus = (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const existing = db.prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: "Task not found" });

    const completedAt = status === "DONE" ? now() : null;
    db.prepare("UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?")
      .run(status, completedAt, now(), req.params.id);

    const row = db.prepare(TASK_JOIN_SELECT + " WHERE t.id = ?").get(req.params.id);
    return res.json({ task: serializeTask(row) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = (req, res, next) => {
  try {
    const existing = db.prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: "Task not found" });
    db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    return res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/stats
exports.getTaskStats = (req, res, next) => {
  try {
    const userId = req.user.id;
    const total = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id = ?").get(userId).c;
    const done = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND status = 'DONE'").get(userId).c;
    const inProgress = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND status = 'IN_PROGRESS'").get(userId).c;
    const overdue = db.prepare(
      "SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND due_date < ? AND status != 'DONE'"
    ).get(userId, now()).c;

    return res.json({ total, done, inProgress, overdue, todo: total - done - inProgress });
  } catch (err) {
    next(err);
  }
};
