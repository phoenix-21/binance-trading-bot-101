// app/api/trades/route.js
import { Pool } from "pg";
import moment from "moment-timezone"; // keep this (already installed)
import 'dotenv/config';

const POSTGRES_URL = process.env.POSTGRES_URL;
const pool = new Pool({ connectionString: POSTGRES_URL });

export async function GET() {
  try {
    // Get balance
    const balanceRes = await pool.query(
      "SELECT balance FROM balance WHERE id = 'main'"
    );
    const balance = balanceRes.rows[0]?.balance ?? "-";

    // Get latest 5 trades
    const trades = await pool.query(
      `SELECT * FROM trades ORDER BY closed_at DESC LIMIT 5`
    );

    // Time window: last 24 hours
    const since24h = moment().subtract(24, "hours").toDate();

    // Profits & losses limited to 100
    const profits = await pool.query(
      `SELECT * FROM trades WHERE profit > 0 ORDER BY profit DESC LIMIT 100`
    );

    const losses = await pool.query(
      `SELECT * FROM trades WHERE profit < 0 ORDER BY profit ASC LIMIT 100`
    );

    // Count of profits & losses in the last 24 hours
    const profits24hCountRes = await pool.query(
      `SELECT COUNT(*) as count FROM trades WHERE profit > 0 AND closed_at >= $1`,
      [since24h]
    );
    const losses24hCountRes = await pool.query(
      `SELECT COUNT(*) as count FROM trades WHERE profit < 0 AND closed_at >= $1`,
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
        openedAt: t.opened_at,  // Keep original for chart
        closedAt: t.closed_at,  // Keep original for chart
        openedAtPKT_minus5,
        closedAtPKT_minus5,
      };
    };

    return Response.json({
      balance,
      trades: trades.rows.map(formatTrade),
      profits: profits.rows.map(formatTrade),
      losses: losses.rows.map(formatTrade),
      profitsCount: profits.rows.length, // number in list (100)
      lossesCount: losses.rows.length,   // number in list (100)
      profits24hCount,                   // total number of profitable trades in last 24h
      losses24hCount,                    // total number of losing trades in last 24h
    });

  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
