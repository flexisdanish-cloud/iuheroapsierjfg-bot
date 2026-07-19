import crypto from "crypto";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import { createOneTimeChannelLink } from "../middleware/ChannelInvites.js";
import { findPaymentByOrderId, updatePaymentAsPaid } from "../database/database.js";
import { channelMap } from "../config/ChannelMap.js";

import bot from "../bot/telegramBot.js";


dotenv.config();




const razorpay = new Razorpay({

key_id:
process.env.RAZORPAY_KEY,


key_secret:
process.env.RAZORPAY_SECRET

});







export const razorpayWebhook = async(req,res)=>{


console.log(
"🔥 WEBHOOK RECEIVED"
);



try{


const signature =
req.headers["x-razorpay-signature"];




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
"Invalid signature"
);


return res.status(400).json({

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






// FIND ORDER IN DATABASE


const paymentRecord =

await findPaymentByOrderId(
razorpayOrderId
);






if(!paymentRecord){


console.log(
"Order not found"
);


return res.status(400).json({

error:"Order not found"

});


}






if(
paymentRecord.status === "paid"
){


return res.json({

status:"already_processed"

});


}







// VERIFY ORDER


const order =

await razorpay.orders.fetch(

razorpayOrderId

);






if(
order.amount !== amount
){

return res.status(400).send(
"Amount mismatch"
);

}




if(
order.currency !== currency
){

return res.status(400).send(
"Currency mismatch"
);

}







// UPDATE DATABASE


await updatePaymentAsPaid(razorpayOrderId, {
  payment_id: razorpayPaymentId,
  amount,
  currency
});






console.log(
"Payment verified"
);






// SEND TELEGRAM MESSAGE


// SEND TELEGRAM MESSAGE + LINK
try {
  await bot.telegram.sendMessage(
    paymentRecord.telegram_id,
    "✅ Payment successful!"
  );

  // Determine planKey from your payment record (e.g. amount or stored field)
  let planKey = null;
  if (amount === 4900) planKey = "buy49";
  if (amount === 9900) planKey = "buy99";
  if (amount === 249900) planKey = "buy2499"; // adjust to match your DB values

  if (planKey) {
    const channelId = channelMap[planKey].channelId;

    const link = await createOneTimeChannelLink(
      bot,
      channelId,
      paymentRecord.telegram_id,
      planKey
    );

   
  }
} catch (err) {
  console.log("Telegram notification failed", err);
}






return res.json({

status:"success"

});





}
catch(error){


console.error(
"Webhook error:",
error
);



return res.status(500).json({

error:"Server error"

});


}


};
