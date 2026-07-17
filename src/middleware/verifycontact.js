import db from "../database/database.js";


export const verifyContact = async (ctx) => {
  const userId = ctx.from.id;
  const contact = ctx.message.contact;

  if (contact.user_id && contact.user_id !== userId) {
    return ctx.reply("❌ Please share your own phone number");
  }

  const phone = contact.phone_number;

  // Save contact in DB for later use
  db.prepare(`
    INSERT INTO users (telegram_id, phone)
    VALUES (?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET phone=excluded.phone
  `).run(userId, phone);

  await ctx.reply("✅ Phone number saved! Now choose a plan.");
};