// app/api/ai-trades/route.js
import { Pool } from "pg";
import moment from "moment-timezone";
import 'dotenv/config';

const POSTGRES_URL = process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: POSTGRES_URL });

export async function GET() {
  try {
    // Get AI balance
    const balanceRes = await pool.query(
      "SELECT ai_balance FROM ai_balance WHERE id = 'ai_main'"
    );
    const balance = balanceRes.rows[0]?.ai_balance ?? 15000;

    // Get latest 5 AI trades
    const trades = await pool.query(
      `SELECT * FROM ai_trades ORDER BY closed_at DESC LIMIT 5`
    );

    // Time window: last 24 hours
    const since24h = moment().subtract(24, "hours").toDate();

    // Profits & losses limited to 100
    const profits = await pool.query(
      `SELECT * FROM ai_trades WHERE profit > 0 ORDER BY profit DESC LIMIT 100`
    );

    const losses = await pool.query(
      `SELECT * FROM ai_trades WHERE profit < 0 ORDER BY profit ASC LIMIT 100`
    );

    // Count of profits & losses in the last 24 hours
    const profits24hCountRes = await pool.query(
      `SELECT COUNT(*) as count FROM ai_trades WHERE profit > 0 AND closed_at >= $1`,
      [since24h]
    );
    const losses24hCountRes = await pool.query(
      `SELECT COUNT(*) as count FROM ai_trades WHERE profit < 0 AND closed_at >= $1`,
      [since24h]
    );

    const profits24hCount = parseInt(profits24hCountRes.rows[0].count);
    const losses24hCount = parseInt(losses24hCountRes.rows[0].count);

    // Helper to format timestamps (subtract 5h and lowercase am/pm)
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
        ...t,
        openedAt: t.opened_at,        // Keep original for chart
        closedAt: t.closed_at,        // Keep original for chart
        openedAtPKT_minus5,
        closedAtPKT_minus5,
        aiScore: t.ai_score,          // Include AI score
      };
    };

    return Response.json({
      balance,
      trades: trades.rows.map(formatTrade),
      profits: profits.rows.map(formatTrade),
      losses: losses.rows.map(formatTrade),
      profitsCount: profits.rows.length,
      lossesCount: losses.rows.length,
      profits24hCount,
      losses24hCount,
    });

  } catch (error) {
    console.error("AI Database error:", error);
    return Response.json({ error: "Failed to fetch AI data" }, { status: 500 });
  }
}
