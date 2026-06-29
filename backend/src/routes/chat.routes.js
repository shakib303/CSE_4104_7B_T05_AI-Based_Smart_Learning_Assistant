// src/routes/chat.routes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const chatController = require("../controllers/chat.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

router.use(authenticate);

router.get("/sessions", chatController.getSessions);
router.post("/sessions", chatController.createSession);
router.get("/sessions/:id", chatController.getSession);
router.delete("/sessions/:id", chatController.deleteSession);
router.post(
  "/sessions/:id/messages",
  [body("content").trim().notEmpty().withMessage("Message content is required")],
  validate,
  chatController.sendMessage
);

module.exports = router;
