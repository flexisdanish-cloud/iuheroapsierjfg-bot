import db from "../database/database.js";

export async function createOneTimeChannelLink(bot, channelId, userId, planKey) {
  let shouldProceed = true;

  // 1. Verify user exists in DB
  const user = db.prepare("SELECT * FROM users WHERE telegram_id=?").get(userId);
  if (!user) {
    await bot.telegram.sendMessage(
      userId,
      "⚠️ You are not registered in our system. Please complete payment first."
    );
    shouldProceed = false;
  }

  // 2. Check if user is already in the channel
  if (shouldProceed) {
    const member = await bot.telegram.getChatMember(channelId, userId);
    if (member.status !== "left") {
      await bot.telegram.sendMessage(
        userId,
        "✅ You already have access to this channel."
      );
      shouldProceed = false;
    }
  }

  if (!shouldProceed) {return null;}
  // 3–5 only run if shouldProceed is still true
  if (shouldProceed) {
    const expireDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h expiry
    const invite = await bot.telegram.createChatInviteLink(channelId, {
      expire_date: expireDate,
      member_limit: 1,
      name: `${planKey}_${userId}_${Date.now()}`
    });

    db.prepare(`
      INSERT INTO channel_invites (token, telegram_id, plan, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `).run(invite.invite_link, userId, planKey, expireDate);

    await bot.telegram.sendMessage(
      userId,
      `🔗 Join your premium channel here:\n${invite.invite_link}`
    );

    return invite.invite_link;
  }

  return null;
}

export default { createOneTimeChannelLink };