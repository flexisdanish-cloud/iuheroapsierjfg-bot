import { Telegraf, Markup, session } from "telegraf";
import { createOneTimeChannelLink } from "../middleware/ChannelInvites.js";
import { channelMap } from "../config/ChannelMap.js";


import keys from "../config/keys.js";

import { createPayment } from "../controllers/paymentController.js";
import { verifyContact } from "../middleware/verifycontact.js";
import db from "../database/database.js";
import { getPhoneByTelegramId } from "../middleware/GetPhone.js";
import { getPaidRecordByPhoneAndAmount } from "../middleware/PaymentLookup.js";


const bot = new Telegraf(
    keys.telegramToken
);

// setupChatMemberHandler(bot); // Set up the chat_member event handler

bot.use(session());


const welcomeMessage = 
"🌿 Welcome to FlexIsDanishh! 🌿\n\n" +
"📱 To give you the **best haircare deals** and personalized guidance, we’ll need your phone number.\n\n" +
"Sharing your number helps us:\n" +
"• Detect your country 🌍\n" +
"• Show region‑specific offers 💸\n" +
"• Ensure smooth communication 🔒\n\n" +
"Tap the button below to share your number securely:";

const introMessage = 
"🌿Welcome to flexisdanishhh!🌿\n\n" +
"Bhai, agar tum hair fall, hair thinning, ya weak hairs se pareshan ho aur apne hairs ko better banana chahte ho, to tum bilkul sahi jagah par aaye ho. 🚀\n\n" +
"✨ Hamare Available Plans:\n\n" +
"🧴 Basic Hair Guide – ₹49\n" +
"Simple aur beginner-friendly hair care routine + oil remedy.\n\n" +
"🚀 Advanced Hair Growth Guide – ₹99\n" +
"Advanced routine, product recommendations aur extra hair care guidance.\n\n" +
"👑 2-Month Personal Transformation Program – ₹2,499\n" +
"Personal guidance, customized diet plan, product recommendations aur priority support ke saath.\n\n" +
"📦 Har plan ke baare mein detail mein dekhna chahte ho?\n" +
"Neeche diye gaye “View More Plans” button par click karo aur apne goal ke hisaab se perfect plan choose karo.\n\n" +
"🌱 Yaad rakho: Hair transformation overnight nahi hota. Sahi guidance + consistency = better results.\n\n" +
"Let’s start your journey together! 🚀💚";

const plansMessage1 = 
"📦 Available Plans\n\n" +

"🧴 1. Basic Hair Guide – ₹49\n" +
"✔️ Hair Growth Oil Recipe (ghar par easy banane ka tarika)\n" +
"✔️ Basic Hair Care Routine (simple aur beginner-friendly)\n" +
"✔️ Step-by-step guide for strong roots\n\n" + 
"⸻\n\n";


const plansMessage2 =
"🚀 2. Advanced Hair Growth Guide – ₹99\n" +
"✔️ Sab kuch jo Basic Guide mein hai\n" +
"✔️ Advanced Hair Routine (extra care for fast growth)\n" +
"✔️ Product Recommendations (sahi shampoo & oils)\n" +
"✔️ Extra Hair Care Tips (expert guidance)\n\n" + 
"⸻\n\n";


const plansMessage3 =
"👑 3. 2-Month Transformation Program – ₹2,499\n" +
"✔️ Personal Guidance for 2 months (direct support)\n" +
"✔️ Personalized Diet Plan (balon ki jad majboot karne ke liye)\n" +
"✔️ Product Links & Recommendations (trusted brands)\n" +
"✔️ Priority Support (fast response & dedicated help)\n\n" +
"⸻\n\n";



        


bot.start(async(ctx)=>{


    await ctx.reply(

        welcomeMessage,

        Markup.keyboard([

            [
                Markup.button.contactRequest(
                    "📱 Share Phone Number"
                )
            ]

        ])
        .resize()

    );


});



bot.on("contact", async (ctx) => {
  // Telegraf automatically passes ctx to verifyContact
  await verifyContact(ctx);
  // After verifying, send intro message
  await ctx.reply(introMessage, Markup.inlineKeyboard([
    [Markup.button.callback("💳 View More Plans", "view_plans")]
  ]));
});



bot.on("channel_post", (ctx) => {
  console.log("Channel ID:", ctx.chat.id);
});



bot.action("view_plans", async (ctx) => {
  await ctx.reply(plansMessage1, Markup.inlineKeyboard([
    [Markup.button.callback("💳 Buy Basic Guide - ₹49", "buy_basic")]
  ]));

  await ctx.reply(plansMessage2, Markup.inlineKeyboard([
    [Markup.button.callback("💳 Buy Advanced Guide - ₹99", "buy_advanced")]
  ]));

  await ctx.reply(plansMessage3, Markup.inlineKeyboard([
    [Markup.button.callback("💳 Buy Transformation Program - ₹2,499", "buy_transformation")]
  ]));
});


bot.action("buy_basic", async (ctx) => {
  const phone = getPhoneByTelegramId(ctx.from.id);
  if (!phone) {
    return ctx.reply("⚠️ Please share your phone number first.");
  }

  // If user has NOT paid yet → create payment
  if (!getPaidRecordByPhoneAndAmount(phone, 4900)) {
    await createPayment(ctx, 49);
  } else {
    // Already purchased → send invite link
    const userId = ctx.from.id; // Telegram user ID
    const planKey = "buy49";    // Plan identifier

    const link = await createOneTimeChannelLink(
      bot,
      channelMap[planKey].channelId,
      userId,
      planKey
    );

   
  }
});


bot.action("buy_advanced", async (ctx) => {
  const phone = getPhoneByTelegramId(ctx.from.id);
  if (!phone) {
    return ctx.reply("⚠️ Please share your phone number first.");
  }

  if (!getPaidRecordByPhoneAndAmount(phone, 9900)) {
    await createPayment(ctx, 99);
  } else {
   const userId = ctx.from.id; // Telegram user ID
    const planKey = "buy99";    // Plan identifier
    const link = await createOneTimeChannelLink(
      bot,
      channelMap[planKey].channelId,
      userId,
      planKey
    );
   
  }
});

bot.action("buy_transformation", async (ctx) => {
  const phone = getPhoneByTelegramId(ctx.from.id);
  if (!phone) {
    return ctx.reply("⚠️ Please share your phone number first.");
  }
 if (!getPaidRecordByPhoneAndAmount(phone, 249900)) {
    await createPayment(ctx, 2499);
  }
  else {
    const userId = ctx.from.id;
    const planKey = "buy2499";    // Plan identifier
    const link = await createOneTimeChannelLink(
      bot,
      channelMap[planKey].channelId,
      userId,
      planKey
    );

// Only send if link was successfully created
   
   
  }});



export default bot;
