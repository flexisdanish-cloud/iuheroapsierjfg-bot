import { Telegraf, Markup } from "telegraf";
import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import keys from "../config/keys.js";

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();


// =========================
// PATH SETUP
// =========================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// =========================
// TELEGRAM BOT
// =========================

const bot = new Telegraf(
    keys.telegramToken
);


// =========================
// EXPRESS SERVER
// =========================

const app = express();


// EJS setup

app.set(
    "view engine",
    "ejs"
);


app.set(
    "views",
    path.join(__dirname,"../views")
);


// =========================
// RAZORPAY CLIENT
// =========================

const razorpay = new Razorpay({

    key_id:
    process.env.RAZORPAY_KEY,


    key_secret:
    process.env.RAZORPAY_SECRET

});


// Temporary storage
const payments = {};


// =========================
// TELEGRAM START
// =========================

bot.start(async(ctx)=>{


    await ctx.reply(

        "🌿 Welcome!\n\nClick below to share phone number",

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




// =========================
// CONTACT HANDLER
// =========================

bot.on(
"contact",

async(ctx)=>{


const userId =
ctx.from.id;


const phone =
ctx.message.contact.phone_number;



try{


console.log(
"Creating Razorpay Order..."
);


// Create Razorpay order

const order =
await razorpay.orders.create({

    amount:50000,

    currency:"INR",

    receipt:
    `telegram_${userId}_${Date.now()}`

});



console.log(
"ORDER:",
order.id
);



payments[userId]={

    order_id:
    order.id,

    phone,

    status:
    "created"

};



// Send payment button

await ctx.reply(

"💳 Complete your payment",

Markup.inlineKeyboard([

[

Markup.button.url(

"💰 Pay Now",

`https://company-dandruff-zealous.ngrok-free.dev/pay/${order.id}`

)

]

])

);



}

catch(error){


console.log(error);


ctx.reply(
"❌ Unable to create payment"
);


}



});





// =========================
// RAZORPAY WEBHOOK
// MUST BE BEFORE express.json()
// =========================


// =========================
// RAZORPAY WEBHOOK
// =========================

app.post(
    "/razorpay-webhook",

    express.raw({
        type: "application/json"
    }),

    async (req, res) => {

        try {

            const signature =
                req.headers["x-razorpay-signature"];


            // Verify webhook signature

            const expectedSignature =
                crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_WEBHOOK_SECRET
                )
                .update(req.body)
                .digest("hex");



            if(signature !== expectedSignature){

                console.log(
                    "Invalid Razorpay signature"
                );

                return res
                .status(400)
                .json({
                    error:"Invalid signature"
                });

            }



            const event =
                JSON.parse(
                    req.body.toString()
                );



            console.log(
                "Webhook Event:",
                event.event
            );



            // Only handle successful payments

            if(
                event.event !== "payment.captured"
            ){

                return res.json({
                    status:"ignored"
                });

            }



            const payment =
                event.payload.payment.entity;



            const razorpayPaymentId =
                payment.id;


            const razorpayOrderId =
                payment.order_id;



            const amount =
                payment.amount;



            const currency =
                payment.currency;



            console.log({
                razorpayPaymentId,
                razorpayOrderId,
                amount,
                currency
            });



            // ================================
            // PROBLEM 3:
            // VERIFY PAYMENT DETAILS
            // ================================


            const order =
                await razorpay.orders.fetch(
                    razorpayOrderId
                );



            if(!order){

                return res
                .status(400)
                .send("Order not found");

            }



            // Check amount

            if(order.amount !== amount){

                console.log(
                    "Amount mismatch"
                );

                return res
                .status(400)
                .send("Amount mismatch");

            }



            // Check currency

            if(order.currency !== "INR"){

                return res
                .status(400)
                .send("Wrong currency");

            }




            // ================================
            // PROBLEM 4:
            // DUPLICATE WEBHOOK PROTECTION
            // ================================


            const existingPayment =
                await Payment.findOne({

                    razorpayPaymentId

                });



            if(existingPayment){


                console.log(
                    "Duplicate webhook ignored"
                );


                return res.json({

                    status:"already_processed"

                });


            }




            // ================================
            // SAVE SUCCESS PAYMENT
            // ================================


            await Payment.create({

                razorpayPaymentId,

                razorpayOrderId,

                amount,

                currency,

                status:"paid"

            });




            // ================================
            // SEND TELEGRAM MESSAGE
            // AFTER DATABASE UPDATE
            // ================================


            // Example:
            //
            // await bot.telegram.sendMessage(
            //     telegramUserId,
            //     "✅ Payment successful"
            // );



            console.log(
                "Payment verified and saved"
            );



            res.json({

                status:"success"

            });



        }
        catch(error){


            console.error(
                "Webhook error:",
                error
            );


            res
            .status(500)
            .json({
                error:"Server error"
            });


        }

    }

);





// =========================
// NORMAL JSON MIDDLEWARE
// =========================

app.use(
express.json()
);




// =========================
// PAYMENT SUCCESS FROM FRONTEND
// =========================

app.post(

"/payment-success",

(req,res)=>{


console.log(

"Frontend payment response:",

req.body

);



res.json({

success:true

});


});





// =========================
// PAYMENT PAGE
// =========================


app.get(

"/pay/:orderId",

(req,res)=>{


const orderId =
req.params.orderId;



res.render(

"payment",

{

orderId,


razorpayKey:

process.env.RAZORPAY_KEY

}

);


});





// =========================
// SUCCESS PAGE
// =========================


app.get(

"/success",

(req,res)=>{


res.send(`

<!DOCTYPE html>

<html>

<body>

<h1>
✅ Payment Successful
</h1>


<p>
Thank you for your purchase.
</p>


</body>

</html>

`);


});





// =========================
// START EXPRESS
// =========================


app.listen(

3000,

()=>{


console.log(
"Server running on port 3000"
);


}

);





// =========================
// START TELEGRAM BOT
// =========================


bot.launch()

.then(()=>{


console.log(
"Telegram bot started"
);


});
