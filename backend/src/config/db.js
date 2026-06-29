// src/config/db.js
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../../database/dev.db");
const SCHEMA_PATH = path.join(__dirname, "../../database/schema.sql");

const db = new DatabaseSync(DB_PATH);

// Apply schema on boot (idempotent — uses CREATE TABLE IF NOT EXISTS)
const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf-8");
db.exec(schemaSql);

module.exports = db;
