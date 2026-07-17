import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import setupChatMemberHandler from "../middleware/setupchatmember.js";
import bot from "./telegramBot.js";
import { razorpayWebhook } from "../controllers/webhookController.js";
import db from "../database/database.js";

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





// IMPORTANT:
// webhook must come before express.json()

app.post(

"/razorpay-webhook",

express.raw({
    type:"application/json"
}),

razorpayWebhook

);



app.get("/test",(req,res)=>{
    console.log("Server reachable");
    res.send("OK");
});

app.use(
express.json()
);



app.get("/getdb", (req, res) => {

    try {

        const payments = db.prepare(`
            SELECT *
            FROM payments
        `).all();


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

app.get(
"/pay/:orderId",

(req,res)=>{


res.render(

"payment",

{

orderId:req.params.orderId,

razorpayKey:
process.env.RAZORPAY_KEY

}

);


});


app.get(

"/payment-status/:orderId",

(req,res)=>{


try{


const payment =

db.prepare(`

SELECT status

FROM payments

WHERE order_id=?

`)

.get(

req.params.orderId

);



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

(req,res)=>{


const payment =

db.prepare(`

SELECT status

FROM payments

WHERE order_id=?

`)

.get(

req.params.orderId

);



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






app.listen(

3000,

()=>{

console.log(
"Server running on port 3000"
);

}

);

setupChatMemberHandler(bot);



bot.launch({
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


