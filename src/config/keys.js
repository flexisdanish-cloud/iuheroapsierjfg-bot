import dotenv from "dotenv";
dotenv.config();

export default {
  telegramToken: process.env.BOT_TOKEN,
  razorpayKey: process.env.RAZORPAY_KEY,
  razorpaySecret: process.env.RAZORPAY_SECRET,
  port: process.env.PORT || 3000,
};
