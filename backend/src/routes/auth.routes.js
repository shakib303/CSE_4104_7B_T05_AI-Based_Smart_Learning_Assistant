// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/(?=.*[A-Z])(?=.*[0-9])/)
      .withMessage("Password must contain an uppercase letter and a number"),
  ],
  validate,
  authController.register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  authController.login
);

router.post("/logout", authenticate, authController.logout);
router.post("/refresh", authController.refreshToken);
router.get("/me", authenticate, authController.getMe);

module.exports = router;
