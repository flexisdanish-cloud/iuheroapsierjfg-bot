import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import setupChatMemberHandler from "../middleware/setupchatmember.js";
import bot from "./telegramBot.js";
import { razorpayWebhook } from "../controllers/webhookController.js";
import {
    connectDatabase,
    findPaymentByOrderId,
    findPaymentStatusByOrderId,
    listPayments
} from "../database/database.js";

dotenv.config();

const app = express();



const __filename =
fileURLToPath(import.meta.url);


const __dirname =
path.dirname(__filename);




app.set(
"view engine",
"ejs"
);



app.set(
"views",
path.join(__dirname,"../views")
);

app.get("/",(req,res)=>{
    res.render("home.ejs")
})



// IMPORTANT:
// webhook must come before express.json()

app.post(

"/razorpay-webhook",

express.raw({
    type:"application/json"
}),

razorpayWebhook

);

app.use(express.json());

app.post("/telegram-webhook", (req, res) => {
    bot.handleUpdate(req.body, res);
});





app.get("/getdb", async (req, res) => {

    try {

        const payments = await listPayments();


        res.json({
            success: true,
            data: payments
        });


    } catch (error) {

        console.error(
            "Database fetch error:",
            error
        );


        res.status(500).json({
            success: false,
            error: "Database error"
        });

    }

});

<<<<<<< HEAD
app.get("/pay/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Fetch payment record from DB
    const paymentRecord = await findPaymentByOrderId(orderId);
=======
app.get(
"/pay/:orderId",(req,res)=>{


res.render(

"payment",

{

orderId:req.params.orderId,

razorpayKey:
process.env.RAZORPAY_KEY

}

);
>>>>>>> f6ede8f033938bc5d243f393d2c60675e66f989a

    if (!paymentRecord) {
      return res.status(404).send("Order not found");
    }

    // Render template with dynamic values
    res.render("payment", {
      orderId: paymentRecord.order_id,
      razorpayKey: process.env.RAZORPAY_KEY,
      amount: paymentRecord.amount,       // paise
       // optional, if stored in DB
    });
  } catch (err) {
    console.error("Error fetching payment:", err);
    res.status(500).send("Server error");
  }
});


app.get(

"/payment-status/:orderId",

async (req,res)=>{


try{


const payment = await findPaymentStatusByOrderId(req.params.orderId);



if(!payment){


return res.status(404).json({

status:"not_found"

});


}




res.json({

status:
payment.status

});



}
catch(error){


res.status(500).json({

status:"error"

});


}




}

);


app.get(

"/success/:orderId",

async (req,res)=>{


const payment = await findPaymentStatusByOrderId(req.params.orderId);



if(
!payment ||
payment.status !== "paid"
){

return res.send(`

<h2>
⏳ Payment verification pending
</h2>

`);

}



res.send(`

<h1>
✅ Payment Successful
</h1>

<p>
Thank you for your purchase.
</p>

`);


}

);

<<<<<<< HEAD





await connectDatabase();

const port = process.env.PORT || 3000;

app.listen(

port,

()=>{

console.log(
`Server running on port ${port}`
);

}

);

=======
>>>>>>> f6ede8f033938bc5d243f393d2c60675e66f989a
setupChatMemberHandler(bot);


app.listen(3000,async ()=>{
console.log("Server running on port 3000");
    await bot.telegram.setWebhook(
    `${process.env.BASE_URL}/telegram-webhook`,
    {
        allowed_updates: [
            "message",
            "edited_message",
            "channel_post",
            "edited_channel_post",
            "inline_query",
            "chosen_inline_result",
            "callback_query", 
            "shipping_query",
            "pre_checkout_query",
            "poll",
            "poll_answer",
            "my_chat_member",
            "chat_member",
            "chat_join_request"
        ]
    }
);
}

<<<<<<< HEAD
await bot.launch({
  allowedUpdates: [
    "message",          // normal text messages, commands
    "edited_message",   // when a user edits a message
    "channel_post",     // posts in channels
    "edited_channel_post",
    "inline_query",     // inline queries (@yourbot in text field)
    "chosen_inline_result",
    "callback_query",   // button clicks (like "View More Plans")
    "shipping_query",   // for payments/shipping
    "pre_checkout_query", // for payments
    "poll",             // polls
    "poll_answer",      // poll answers
    "my_chat_member",   // when the bot itself is added/removed
    "chat_member",      // when a user joins/leaves a group/supergroup
    "chat_join_request" // when someone requests to join a chat
  ]
});


=======
);
>>>>>>> f6ede8f033938bc5d243f393d2c60675e66f989a
