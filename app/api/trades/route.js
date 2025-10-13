import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
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

  const topTrades = await db
    .collection("trades")
    .find({})
    .sort({ profit: -1 })
    .limit(3)
    .toArray();

  return Response.json({
    balance: balanceDoc?.balance ?? 10000,
    trades,
    topTrades,
  });
}
