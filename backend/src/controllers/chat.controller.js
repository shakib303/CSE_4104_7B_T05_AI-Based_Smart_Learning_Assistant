// src/controllers/chat.controller.js
const db = require("../config/db");
const { newId, now, toCamel, toCamelList } = require("../utils/dbHelpers");
const aiService = require("../services/ai.service");

const SYSTEM_PROMPT = `You are an intelligent academic study assistant. You help students understand
concepts, create study strategies, summarize notes, practice problems, and stay motivated.
Always be encouraging, clear, and structured in your explanations.`;

// GET /api/chat/sessions
exports.getSessions = (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT cs.*, (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count
      FROM chat_sessions cs
      WHERE cs.user_id = ?
      ORDER BY cs.updated_at DESC
    `).all(req.user.id);
    return res.json({ sessions: toCamelList(rows) });
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/sessions
exports.createSession = (req, res, next) => {
  try {
    const { title } = req.body;
    const id = newId();
    const timestamp = now();
    db.prepare("INSERT INTO chat_sessions (id, title, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run(id, title || "New Chat", req.user.id, timestamp, timestamp);
    const row = db.prepare("SELECT * FROM chat_sessions WHERE id = ?").get(id);
    return res.status(201).json({ session: toCamel(row) });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/sessions/:id
exports.getSession = (req, res, next) => {
  try {
    const session = db.prepare("SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const messages = db.prepare("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC").all(req.params.id);
    const result = toCamel(session);
    result.messages = toCamelList(messages);

    return res.json({ session: result });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/chat/sessions/:id
exports.deleteSession = (req, res, next) => {
  try {
    const session = db.prepare("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(req.params.id);
    return res.json({ message: "Session deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/sessions/:id/messages
exports.sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const sessionId = req.params.id;

    const session = db.prepare("SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?").get(sessionId, req.user.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const priorMessages = db.prepare(
      "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 20"
    ).all(sessionId);

    const userMsgId = newId();
    const timestamp = now();
    db.prepare("INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'USER', ?, ?)")
      .run(userMsgId, sessionId, content, timestamp);

    const history = priorMessages.map((m) => ({ role: m.role.toLowerCase(), content: m.content }));
    history.push({ role: "user", content });

    const { reply, tokens } = await aiService.chat(SYSTEM_PROMPT, history);

    const assistantMsgId = newId();
    db.prepare("INSERT INTO chat_messages (id, session_id, role, content, tokens, created_at) VALUES (?, ?, 'ASSISTANT', ?, ?, ?)")
      .run(assistantMsgId, sessionId, reply, tokens, now());

    if (priorMessages.length === 0) {
      const title = content.slice(0, 60) + (content.length > 60 ? "..." : "");
      db.prepare("UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?").run(title, now(), sessionId);
    } else {
      db.prepare("UPDATE chat_sessions SET updated_at = ? WHERE id = ?").run(now(), sessionId);
    }

    const userMessage = toCamel(db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(userMsgId));
    const assistantMessage = toCamel(db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(assistantMsgId));

    return res.json({ userMessage, assistantMessage });
  } catch (err) {
    next(err);
  }
};
