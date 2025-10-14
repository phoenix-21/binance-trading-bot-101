// app/api/ai-trades/route.jsx
import { MongoClient } from "mongodb";
import moment from "moment-timezone";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  await client.connect();
  const db = client.db("ai_tradingbot");
  cachedDb = db;
  return db;
}

export async function GET() {
  const db = await getDb();

  const balanceDoc = await db.collection("ai_balance").findOne({ _id: "main" });

  const trades = await db
    .collection("ai_trades")
    .find({})
    .sort({ closedAt: -1 })
    .limit(5)
    .toArray();

  const since24h = moment().subtract(24, "hours").toDate();

  const profits = await db
    .collection("ai_trades")
    .find({ profit: { $gt: 0 } })
    .sort({ profit: -1 })
    .limit(100)
    .toArray();

  const losses = await db
    .collection("ai_trades")
    .find({ profit: { $lt: 0 } })
    .sort({ profit: 1 })
    .limit(100)
    .toArray();

  const profits24hCount = await db
    .collection("ai_trades")
    .countDocuments({
      profit: { $gt: 0 },
      closedAt: { $gte: since24h },
    });

  const losses24hCount = await db
    .collection("ai_trades")
    .countDocuments({
      profit: { $lt: 0 },
      closedAt: { $gte: since24h },
    });

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
    profitsCount: profits.length,
    lossesCount: losses.length,
    profits24hCount,
    losses24hCount,
  });
}
