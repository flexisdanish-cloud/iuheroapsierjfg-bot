// lookup.js
import db from "../database/database.js";

/**
 * Find a payment record for a given phone number and amount
 * where status is 'paid'.
 *
 * @param {string} phone - The user's phone number
 * @param {number} amount - The payment amount (in paise, e.g. ₹49 = 4900)
 * @returns {object|null} - The matching payment record or null if not found
 */
export function getPaidRecordByPhoneAndAmount(phone, amount) {
  const stmt = db.prepare(`
    SELECT *
    FROM payments
    WHERE phone = ?
      AND amount = ?
      AND status = 'paid'
  `);

  const record = stmt.get(phone, amount);
  return record || null;
}
