// src/routes/dashboard.routes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);
router.get("/", dashboardController.getDashboard);
router.post("/study-log", dashboardController.logStudySession);

module.exports = router;
