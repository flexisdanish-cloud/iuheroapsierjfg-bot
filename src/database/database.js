import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const dbPath = path.join(
    __dirname,
    "payments.db"
);


const db = new Database(dbPath);



db.exec(`

CREATE TABLE IF NOT EXISTS payments (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    telegram_id TEXT NOT NULL,

    phone TEXT,

    order_id TEXT UNIQUE NOT NULL,

    payment_id TEXT,

    amount INTEGER,

    currency TEXT,

    status TEXT DEFAULT 'created',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS channel_invites (
    token TEXT PRIMARY KEY,
    telegram_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    expires_at INTEGER,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);


`);





export default db;