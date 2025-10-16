// app/page.jsx
"use client";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AIPage from "./ai-page";

function minus5AndFormat(dateStr) {
  const d = new Date(dateStr);
  const minus5 = new Date(d.getTime() - 5 * 60 * 60 * 1000);
  return minus5
    .toLocaleString("en-PK", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Karachi",
    })
    .replace(/,/, "")
    .replace("AM", "am")
    .replace("PM", "pm");
}

export default function Home() {
  const [balance, setBalance] = useState("-");
  const [latestTrades, setLatestTrades] = useState([]);
  const [profits, setProfits] = useState([]);
  const [losses, setLosses] = useState([]);
  const [profitsCount, setProfitsCount] = useState(0);
  const [lossesCount, setLossesCount] = useState(0);
  const [profits24hCount, setProfits24hCount] = useState(0);
  const [losses24hCount, setLosses24hCount] = useState(0);
  const [profitHistory, setProfitHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("main");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/trades");
        const data = await res.json();

        setBalance(data.balance);
        setLatestTrades(data.trades);
        setProfits(data.profits);
        setLosses(data.losses);
        setProfitsCount(data.profitsCount);
        setLossesCount(data.lossesCount);
        setProfits24hCount(data.profits24hCount);
        setLosses24hCount(data.losses24hCount);

        const nowMinus5 = new Date(Date.now() - 5 * 60 * 60 * 1000);
        setProfitHistory((prev) => [
          ...prev.slice(-100),
          {
            time: nowMinus5
              .toLocaleString("en-PK", {
                timeZone: "Asia/Karachi",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace("AM", "am")
              .replace("PM", "pm"),
            balance:
              typeof data.balance === "number"
                ? data.balance.toFixed(2)
                : null,
          },
        ]);
      } catch (err) {
        console.error("Failed to fetch trades:", err);
      }
    }

    if (activeTab === "main") {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg shadow-lg">
          <p className="text-gray-200 text-sm">{`Time: ${label}`}</p>
          <p className="text-green-400 text-sm">{`Balance: ${payload[0].value} USDT`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-green-400">TradeX Bot</div>
          </div>
          <nav className="flex space-x-4">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "main"
                  ? "bg-green-500 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              onClick={() => setActiveTab("main")}
            >
              Main Trades
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "ai"
                  ? "bg-green-500 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              onClick={() => setActiveTab("ai")}
            >
              AI Trades
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      {activeTab === "main" ? (
        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Trading Dashboard
          </h1>
          <p className="text-gray-400 mb-8">
            Real-time trading analysis and performance metrics
          </p>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <h2 className="text-lg font-medium text-gray-300 mb-4">Account Balance</h2>
              <div className="flex items-center space-x-3">
                {typeof balance === "number" ? (
                  <>
                    <span className="text-4xl font-bold text-green-400">
                      {balance.toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-xl">USDT</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-green-400">-</span>
                )}
              </div>
            </div>

            {/* Latest Trades Card */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <h2 className="text-lg font-medium text-gray-300 mb-4">Latest Trades</h2>
              {latestTrades.length === 0 ? (
                <p className="text-gray-400">No trades yet</p>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {latestTrades.map((t, i) => (
                    <div key={i} className="border-b border-gray-700 pb-2 last:border-b-0">
                      <div className="font-semibold text-white">{t.symbol}</div>
                      <div className="text-sm text-gray-400">
                        Entry: {t.entry.toFixed(4)} ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                      </div>
                      <div className="text-sm text-gray-400">
                        Exit: {t.exit.toFixed(4)} ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                      </div>
                      <div className="text-sm">
                        Profit:{" "}
                        <span className={t.profit >= 0 ? "text-green-400" : "text-red-400"}>
                          {t.profit.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profits Card */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <h2 className="text-lg font-medium text-green-400 mb-4">
                Profitable Trades ({profits24hCount})
              </h2>
              {profits.length === 0 ? (
                <p className="text-gray-400">No profitable trades yet</p>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {profits.map((t, i) => (
                    <div key={i} className="border-b border-gray-700 pb-2 last:border-b-0">
                      <div className="font-semibold text-white">{t.symbol}</div>
                      <div className="text-sm text-gray-400">
                        Entry: {t.entry.toFixed(4)} ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                      </div>
                      <div className="text-sm text-gray-400">
                        Exit: {t.exit.toFixed(4)} ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                      </div>
                      <div className="text-sm">
                        Profit: <span className="text-green-400">{t.profit.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Losses Card */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-200 lg:col-span-3 md:col-span-2">
              <h2 className="text-lg font-medium text-red-400 mb-4">
                Losing Trades ({losses24hCount})
              </h2>
              {losses.length === 0 ? (
                <p className="text-gray-400">No losing trades yet</p>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {losses.map((t, i) => (
                    <div key={i} className="border-b border-gray-700 pb-2 last:border-b-0">
                      <div className="font-semibold text-white">{t.symbol}</div>
                      <div className="text-sm text-gray-400">
                        Entry: {t.entry.toFixed(4)} ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                      </div>
                      <div className="text-sm text-gray-400">
                        Exit: {t.exit.toFixed(4)} ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                      </div>
                      <div className="text-sm">
                        Profit: <span className="text-red-400">{t.profit.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profit Chart */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">Profit Over Time</h3>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitHistory}>
                  <XAxis
                    dataKey="time"
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={{ stroke: "#374151" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#4ade80"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      ) : (
        <AIPage />
      )}
    </div>
  );
}
