// app/api/ai-trades/route.js
import { Pool } from "pg";
import moment from "moment-timezone";

// ✅ Neon Postgres connection
const pool = new Pool({
  connectionString: process.env.TRADING_DB_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    // --- 1️⃣ Get AI Balance ---
    const balanceRes = await pool.query(
      `SELECT ai_balance FROM ai_balance WHERE id = 'ai_main' LIMIT 1`
    );
    const balance = balanceRes.rows.length
      ? parseFloat(balanceRes.rows[0].ai_balance)
      : 15000;

    // --- 2️⃣ Latest 5 AI trades ---
    const tradesRes = await pool.query(`
      SELECT symbol, entry, exit, profit, ai_score, opened_at, closed_at
      FROM ai_trades
      ORDER BY closed_at DESC
      LIMIT 5
    `);

    // --- 3️⃣ Top 100 AI profits ---
    const profitsRes = await pool.query(`
      SELECT symbol, entry, exit, profit, ai_score, opened_at, closed_at
      FROM ai_trades
      WHERE profit > 0
      ORDER BY profit DESC
      LIMIT 100
    `);

    // --- 4️⃣ Top 100 AI losses ---
    const lossesRes = await pool.query(`
      SELECT symbol, entry, exit, profit, ai_score, opened_at, closed_at
      FROM ai_trades
      WHERE profit < 0
      ORDER BY profit ASC
      LIMIT 100
    `);

    // --- 5️⃣ 24h stats ---
    const since24h = moment().subtract(24, "hours").toDate();

    const profits24hCountRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM ai_trades WHERE profit > 0 AND closed_at >= $1`,
      [since24h]
    );
    const losses24hCountRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM ai_trades WHERE profit < 0 AND closed_at >= $1`,
      [since24h]
    );

    const profits24hCount = profits24hCountRes.rows[0].count;
    const losses24hCount = losses24hCountRes.rows[0].count;

    // --- 6️⃣ Helper to format trades ---
    const formatTrade = (t) => {
      const openedMinus5 = moment(t.opened_at).subtract(5, "hours");
      const closedMinus5 = moment(t.closed_at).subtract(5, "hours");

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
        symbol: t.symbol,
        entry: parseFloat(t.entry),
        exit: parseFloat(t.exit),
        profit: parseFloat(t.profit),
        aiScore: parseFloat(t.ai_score),
        openedAt: t.opened_at,
        closedAt: t.closed_at,
        openedAtPKT_minus5,
        closedAtPKT_minus5,
      };
    };

    // --- 7️⃣ Return unified response for the frontend ---
    return Response.json({
      balance,
      trades: tradesRes.rows.map(formatTrade),
      profits: profitsRes.rows.map(formatTrade),
      losses: lossesRes.rows.map(formatTrade),
      profitsCount: profitsRes.rows.length,
      lossesCount: lossesRes.rows.length,
      profits24hCount,
      losses24hCount,
    });
  } catch (err) {
    console.error("❌ Failed to fetch AI trades from Neon Postgres:", err);
    return Response.json({ error: "Database query failed" }, { status: 500 });
  }
}
