import { createChannelInvite, findUserByTelegramId } from "../database/database.js";

export async function createOneTimeChannelLink(bot, channelId, userId, planKey) {
  const telegramUserId = Number(userId);

  const user = await findUserByTelegramId(userId);
  if (!user) {
    await bot.telegram.sendMessage(
      telegramUserId,
      "Please register by sharing your phone number first."
    );
    return null;
  }

  let member;

  try {
    member = await bot.telegram.getChatMember(channelId, telegramUserId);
  } catch (err) {
    const description = err?.response?.description || err.message;
    throw new Error(
      `Telegram cannot access channel ${channelId} for plan ${planKey}: ${description}. Make sure the bot is added to that channel as an admin and the channel ID is correct.`
    );
  }

  if (member.status !== "left") {
    await bot.telegram.sendMessage(
      telegramUserId,
      "You already have access to this channel."
    );
    return null;
  }

  const expireDate = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const invite = await bot.telegram.createChatInviteLink(channelId, {
    expire_date: expireDate,
    member_limit: 1,
    name: `${planKey}_${telegramUserId}_${Date.now()}`
  });

  await createChannelInvite({
    token: invite.invite_link,
    telegram_id: telegramUserId,
    plan: planKey,
    expires_at: expireDate
  });

  await bot.telegram.sendMessage(
    telegramUserId,
    `Join your premium channel here:\n${invite.invite_link}`
  );

  return invite.invite_link;
}

export default { createOneTimeChannelLink };
