// route.js
import { MongoClient } from "mongodb";
import moment from "moment-timezone"; // keep this (already installed)

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  await client.connect();
  const db = client.db("tradingbot");
  cachedDb = db;
  return db;
}

export async function GET() {
  const db = await getDb();

  const balanceDoc = await db.collection("balance").findOne({ _id: "main" });
  const trades = await db
    .collection("trades")
    .find({})
    .sort({ closedAt: -1 })
    .limit(5)
    .toArray();

  const profits = await db
    .collection("trades")
    .find({ profit: { $gt: 0 } })
    .sort({ profit: -1 })
    .toArray();

  const losses = await db
    .collection("trades")
    .find({ profit: { $lt: 0 } })
    .sort({ profit: 1 }) // smallest (most negative) first
    .toArray();

  // Format timestamps (subtract 5 hours and lowercase am/pm)
  const formatTrade = (t) => {
    const openedMinus5 = moment(t.openedAt).subtract(5, "hours");
    const closedMinus5 = moment(t.closedAt).subtract(5, "hours");

    const openedAtPKT_minus5 = openedMinus5
      .tz("Asia/Karachi")
      .format("hh:mm A")
      .replace("AM", "am")
      .replace("PM", "pm");

    const closedAtPKT_minus5 = closedMinus5
      .tz("Asia/Karachi")
      .format("hh:mm A")
      .replace("AM", "am")
      .replace("PM", "pm");

    return {
      ...t,
      openedAtPKT_minus5,
      closedAtPKT_minus5,
    };
  };

  return Response.json({
    balance: balanceDoc?.balance ?? 10000,
    trades: trades.map(formatTrade),
    profits: profits.map(formatTrade),
    losses: losses.map(formatTrade),
  });
}
