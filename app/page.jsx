"use client";
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function minus5AndFormat(dateStr) {
  // dateStr can be ISO or a Date — convert then subtract 5 hours
  const d = new Date(dateStr);
  const minus5 = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  return minus5.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Karachi",
  });
}

export default function Home() {
  const [balance, setBalance] = useState(10000);
  const [latestTrades, setLatestTrades] = useState([]);
  const [topTrades, setTopTrades] = useState([]);
  const [profitHistory, setProfitHistory] = useState([]);

  // Fetch data from backend API every 5 seconds
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/trades");
        const data = await res.json();

        setBalance(data.balance);
        setLatestTrades(data.trades);
        setTopTrades(data.topTrades);

        // chart time: subtract 5 hours from current time before formatting
        const nowMinus5 = new Date(Date.now() - 5 * 60 * 60 * 1000);
        setProfitHistory((prev) => [
          ...prev.slice(-100),
          { time: nowMinus5.toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hour12: true }), balance: data.balance.toFixed(2) },
        ]);
      } catch (err) {
        console.error("Failed to fetch trades:", err);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-6 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-green-400 mb-2">📈 Paper Trading Bot</h1>
      <p className="text-gray-400 mb-6">Live data from MongoDB (Trading Bot)</p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Balance */}
        <div className="bg-gray-800 p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">Balance</h2>
          <p className="text-2xl text-green-400">{balance.toFixed(2)} USDT</p>
        </div>

        {/* Latest 5 Trades */}
        <div className="bg-gray-800 p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">Latest 5 Trades</h2>
          <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
            {latestTrades.length === 0 ? (
              <p>No trades yet</p>
            ) : (
              latestTrades.map((t, i) => (
                <li key={i}>
                  <div className="font-semibold">{t.symbol}</div>
                  entry: {t.entry.toFixed(4)}{" "}
                  <span className="text-gray-400">
                    {/* prefer backend adjusted field if present, otherwise fallback to subtracting on frontend */}
                    ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                  </span>
                  <br />
                  exit: {t.exit.toFixed(4)}{" "}
                  <span className="text-gray-400">
                    ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                  </span>
                  <br />
                  profit:{" "}
                  <span className={t.profit >= 0 ? "text-green-400" : "text-red-400"}>
                    {t.profit.toFixed(2)}%
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Top 3 Trades */}
        <div className="bg-gray-800 p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">🏆 Top 3 Trades</h2>
          <ul className="text-sm space-y-1">
            {topTrades.length === 0 ? (
              <p>No data</p>
            ) : (
              topTrades.map((t, i) => (
                <li key={i}>
                  {i + 1}. {t.symbol}:{" "}
                  <span className="text-green-400">{t.profit.toFixed(2)}%</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Profit Chart */}
      <h3 className="text-xl mt-8 mb-2 font-semibold">📊 Profit Over Time</h3>
      <div className="bg-gray-800 p-4 rounded-2xl shadow h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={profitHistory}>
            <XAxis dataKey="time" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="balance" stroke="#4ade80" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
