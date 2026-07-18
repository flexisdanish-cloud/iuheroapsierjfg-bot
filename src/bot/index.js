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
"/pay/:orderId",(req,res)=>{


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

);
