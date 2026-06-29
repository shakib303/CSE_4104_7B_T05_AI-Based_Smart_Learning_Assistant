// src/routes/task.routes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const taskController = require("../controllers/task.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

router.use(authenticate);

router.get("/", taskController.getTasks);
router.get("/stats", taskController.getTaskStats);
router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("priority").optional().isIn(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  ],
  validate,
  taskController.createTask
);
router.get("/:id", taskController.getTask);
router.put("/:id", taskController.updateTask);
router.patch("/:id/status", taskController.updateStatus);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
