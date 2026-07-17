import db from "../database/database.js";

export function getPhoneByTelegramId(telegramId) {
  const stmt = db.prepare(`
    SELECT phone
    FROM users
    WHERE telegram_id = ?
  `);

  const row = stmt.get(telegramId);
  return row ? row.phone : null;
}