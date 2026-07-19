import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "flexisdanish";

if (!uri) {
  throw new Error("MONGODB_URI is required. Add it to your .env and Render environment variables.");
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000
});

let database;
let connectionPromise;

export async function connectDatabase() {
  if (!connectionPromise) {
    connectionPromise = client.connect().then(async () => {
      database = client.db(dbName);
      await createIndexes();
      console.log(`MongoDB connected: ${dbName}`);
      return database;
    });
  }

  return connectionPromise;
}

async function createIndexes() {
  const users = database.collection("users");
  const payments = database.collection("payments");
  const channelInvites = database.collection("channel_invites");

  await Promise.all([
    users.createIndex({ telegram_id: 1 }, { unique: true }),
    payments.createIndex({ order_id: 1 }, { unique: true }),
    payments.createIndex({ telegram_id: 1, status: 1 }),
    payments.createIndex({ phone: 1, amount: 1, status: 1 }),
    channelInvites.createIndex({ token: 1 }, { unique: true }),
    channelInvites.createIndex({ telegram_id: 1, used: 1 })
  ]);
}

async function collection(name) {
  const db = await connectDatabase();
  return db.collection(name);
}

function telegramId(value) {
  return String(value);
}

export async function findUserByTelegramId(userId) {
  const users = await collection("users");
  return users.findOne({ telegram_id: telegramId(userId) });
}

export async function saveUserPhone(userId, phone) {
  const users = await collection("users");
  await users.updateOne(
    { telegram_id: telegramId(userId) },
    {
      $set: {
        phone,
        updated_at: new Date()
      },
      $setOnInsert: {
        telegram_id: telegramId(userId),
        created_at: new Date()
      }
    },
    { upsert: true }
  );
}

export async function getPhoneByTelegramId(userId) {
  const user = await findUserByTelegramId(userId);
  return user ? user.phone : null;
}

export async function createPaymentRecord({ telegram_id, phone, order_id, amount, status = "created" }) {
  const payments = await collection("payments");
  await payments.insertOne({
    telegram_id: telegramId(telegram_id),
    phone,
    order_id,
    payment_id: null,
    amount,
    currency: null,
    status,
    created_at: new Date()
  });
}

export async function findPaymentByOrderId(orderId) {
  const payments = await collection("payments");
  return payments.findOne({ order_id: orderId });
}

export async function listPayments() {
  const payments = await collection("payments");
  return payments.find({}).sort({ created_at: -1 }).toArray();
}

export async function findPaymentStatusByOrderId(orderId) {
  const payment = await findPaymentByOrderId(orderId);
  return payment ? { status: payment.status } : null;
}

export async function updatePaymentAsPaid(orderId, { payment_id, amount, currency }) {
  const payments = await collection("payments");
  await payments.updateOne(
    { order_id: orderId },
    {
      $set: {
        payment_id,
        amount,
        currency,
        status: "paid",
        paid_at: new Date(),
        updated_at: new Date()
      }
    }
  );
}

export async function getPaidRecordByPhoneAndAmount(phone, amount) {
  const payments = await collection("payments");
  return payments.findOne({
    phone,
    amount,
    status: "paid"
  });
}

export async function findPaidPaymentByTelegramId(userId) {
  const payments = await collection("payments");
  return payments.findOne({
    telegram_id: telegramId(userId),
    status: "paid"
  });
}

export async function createChannelInvite({ token, telegram_id, plan, expires_at }) {
  const channelInvites = await collection("channel_invites");
  await channelInvites.insertOne({
    token,
    telegram_id: telegramId(telegram_id),
    plan,
    expires_at,
    used: false,
    created_at: new Date()
  });
}

export async function findUnusedInviteByTelegramId(userId) {
  const channelInvites = await collection("channel_invites");
  return channelInvites.findOne({
    telegram_id: telegramId(userId),
    used: false
  });
}

export async function markInviteUsed(userId, plan) {
  const channelInvites = await collection("channel_invites");
  await channelInvites.updateOne(
    {
      telegram_id: telegramId(userId),
      plan,
      used: false
    },
    {
      $set: {
        used: true,
        used_at: new Date()
      }
    }
  );
}

export async function closeDatabase() {
  await client.close();
  connectionPromise = null;
  database = null;
}
