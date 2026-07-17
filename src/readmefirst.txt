to run the ngrok 
run the express server first 
run the command 
ngrok http 3000<---this is the port where express is running




if ngrok is not creating on the cmd then do this:

to enable the ngrok

first check if ngrok is there or not
if not then run this command   --->  npm install -g ngrok
after that set the authentication token   --->   ngrok config add-authtoken YOUR_TOKEN_HERE

run the above command

it will give a https link then change the link with [BASE_URL] as it will be needed for redirection




I have added two env variable and they are very important :
RAZORPAY_KEY=rzp_test_TDQsU3yxcDohm3
RAZORPAY_SECRET=Q7m5vqIVMf81D6MJ3jhcyB6R
 BASE_URL=https://company-dandruff-zealous.ngrok-free.dev
 RAZORPAY_WEBHOOK_SECRET=Q7m5vqIVMf81D6MJ3jhcyB6R


you have to use this credentials or this will not work as the razorpay webhook must be set with a secret and that
 is needed to be passed in the [RAZORPAY_WEBHOOK_SECRET]


if you can't run the index file then you can see the tryindex.js as the full working code is there