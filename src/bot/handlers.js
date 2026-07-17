import { createPaymentLink } from "../payments/razorpay.js";

export const handleMenuClick = async (ctx) => {
  const choice = ctx.callbackQuery.data;

  if (choice === "pay") {
    const paymentUrl = await createPaymentLink(100, "user@example.com"); // ₹100 demo
    await ctx.editMessageText(`Click here to pay: ${paymentUrl}`);
  } else if (choice === "info") {
    await ctx.editMessageText("This is a sample bot with Razorpay integration.");
  }
};
