// src/utils/dbHelpers.js
const { v4: uuidv4 } = require("uuid");

exports.newId = () => uuidv4();
exports.now = () => new Date().toISOString();

/**
 * Converts a snake_case DB row to camelCase keys for JSON API responses.
 */
exports.toCamel = (row) => {
  if (!row) return row;
  const out = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camelKey] = row[key];
  }
  return out;
};

exports.toCamelList = (rows) => rows.map(exports.toCamel);
