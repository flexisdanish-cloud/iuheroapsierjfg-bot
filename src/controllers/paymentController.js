
import db from "../database/database.js";
import { Markup } from "telegraf";
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

export const createPayment = async (ctx, amount) => {
  try {
    const userId = ctx.from.id;
    const user = db.prepare(`SELECT phone FROM users WHERE telegram_id=?`).get(userId);

    if (!user) {
      return ctx.reply("⚠️ Please share your phone number first.");
    }

    // Razorpay expects amount in paise
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `telegram_${userId}_${Date.now()}`
    });

    db.prepare(`
      INSERT INTO payments (telegram_id, phone, order_id, status)
      VALUES (?, ?, ?, ?)
    `).run(userId, user.phone, order.id, "created");

    await ctx.reply(
      "💳 Complete your payment",
      Markup.inlineKeyboard([
        [Markup.button.url("💰 Pay Now", `${process.env.BASE_URL}/pay/${order.id}`)]
      ])
    );
  } catch (err) {
    console.error("❌ Razorpay error:", err);
    await ctx.reply("⚠️ Payment could not be created. Please try again later.");
  }
};
