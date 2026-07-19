import {
  findPaidPaymentByTelegramId,
  findUnusedInviteByTelegramId,
  findUserByTelegramId,
  markInviteUsed
} from "../database/database.js";

export default function setupChatMemberHandler(bot) {
  bot.on("chat_member", async (ctx) => {
    try {
      const newMember = ctx.chatMember.new_chat_member.user;
      const userId = newMember.id;
      const channelId = ctx.chat.id;

      console.log("chat_member event received:", ctx.chat, newMember);

      // Ignore bot itself
      if (newMember.is_bot && userId === bot.botInfo.id) {
        console.log("⚠️ Ignoring self (bot) chat_member event");
        return;
      }

      // Only act when user becomes a member
      if (ctx.chatMember.new_chat_member.status !== "member") {
        return;
      }

      // 1. Check if user exists in DB
      const user = await findUserByTelegramId(userId);
      if (!user) {
        await bot.telegram.kickChatMember(channelId, userId);
        await bot.telegram.unbanChatMember(channelId, userId);
        console.log(`❌ Unauthorized join attempt by ${userId} → kicked & unbanned`);
        return;
      }

      // 2. Check if user has a valid payment record
      const payment = await findPaidPaymentByTelegramId(userId);
      if (!payment) {
        await bot.telegram.kickChatMember(channelId, userId);
        await bot.telegram.unbanChatMember(channelId, userId);
        console.log(`❌ User ${userId} is in DB but has no paid plan → kicked & unbanned`);
        return;
      }

      // 3. Check if the plan matches the channel requirement
      const channelPlans = {
        "-1003896827128": "premium",   // Channel1 requires "premium"
        // add more channelId → plan mappings here
      };
      const requiredPlan = channelPlans[channelId];

      const invite = await findUnusedInviteByTelegramId(userId);

      if (!invite) {
        await bot.telegram.kickChatMember(channelId, userId);
        await bot.telegram.unbanChatMember(channelId, userId);
        console.log(`❌ User ${userId} has no valid invite → kicked & unbanned`);
        return;
      }

      if (requiredPlan && invite.plan !== requiredPlan) {
        await bot.telegram.kickChatMember(channelId, userId);
        await bot.telegram.unbanChatMember(channelId, userId);
        console.log(`❌ User ${userId} has plan "${invite.plan}" but channel requires "${requiredPlan}" → kicked & unbanned`);
        return;
      }

      // 4. If valid and plan matches → allow them
      await markInviteUsed(userId, invite.plan);

      console.log(`✅ User ${userId} verified with correct plan, invite marked used, allowed in channel`);
    } catch (err) {
      console.error("chat_member handler error:", err);
    }
  });
}
