import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DB_PATH ?? "./qa.db";

const db = new Database(DB_PATH);

// Improve write performance; enforce foreign keys
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables and seed sample data on first run (idempotent)
const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);

export default db;
