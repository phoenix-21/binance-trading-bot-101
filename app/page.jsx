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
  CartesianGrid,
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
        <div className="bg-blue-900 border border-blue-800 p-3 rounded-lg shadow-lg shadow-blue-900/50">
          <p className="text-gray-100 text-sm font-medium">{`Time: ${label}`}</p>
          <p className="text-teal-400 text-sm">{`Balance: ${payload[0].value} USDT`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-blue-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-blue-900 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-teal-400">TradeX Bot</span>
          </div>
          <nav className="flex space-x-2">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === "main"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-blue-800 hover:text-white"
              }`}
              onClick={() => setActiveTab("main")}
            >
              Main Trades
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === "ai"
                  ? "bg-blue-500 text-white"
                  : "text-gray-300 hover:bg-blue-800 hover:text-white"
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-gray-100 mb-2">
            Trading Dashboard
          </h1>
          <p className="text-gray-300 text-sm mb-8">
            Monitor and analyze your trading performance in real-time
          </p>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <div className="bg-blue-900 p-6 rounded-lg shadow-md border border-blue-800 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
              <h2 className="text-lg font-medium text-gray-300 mb-3">Account Balance</h2>
              <div className="flex items-center space-x-3">
                {typeof balance === "number" ? (
                  <>
                    <span className="text-3xl font-bold text-teal-400">
                      {balance.toFixed(2)}
                    </span>
                    <span className="text-gray-300 text-lg">USDT</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-300">-</span>
                )}
              </div>
            </div>

            {/* Latest Trades Card */}
            <div className="bg-blue-900 p-6 rounded-lg shadow-md border border-blue-800 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
              <h2 className="text-lg font-medium text-gray-300 mb-3">Recent Trades</h2>
              {latestTrades.length === 0 ? (
                <p className="text-gray-300 text-sm">No trades yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-custom">
                  {latestTrades.map((t, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-blue-800 pb-2 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-100">{t.symbol}</div>
                        <div className="text-xs text-gray-300">
                          Entry: {t.entry.toFixed(4)} ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                        </div>
                        <div className="text-xs text-gray-300">
                          Exit: {t.exit.toFixed(4)} ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className={t.profit >= 0 ? "text-teal-400" : "text-red-400"}>
                          {t.profit.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profits Card */}
            <div className="bg-blue-900 p-6 rounded-lg shadow-md border border-blue-800 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
              <h2 className="text-lg font-medium text-teal-400 mb-3">
                Profitable Trades ({profits24hCount})
              </h2>
              {profits.length === 0 ? (
                <p className="text-gray-300 text-sm">No profitable trades yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-custom">
                  {profits.map((t, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-blue-800 pb-2 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-100">{t.symbol}</div>
                        <div className="text-xs text-gray-300">
                          Entry: {t.entry.toFixed(4)} ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                        </div>
                        <div className="text-xs text-gray-300">
                          Exit: {t.exit.toFixed(4)} ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-teal-400">{t.profit.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Losses Card */}
            <div className="bg-blue-900 p-6 rounded-lg shadow-md border border-blue-800 hover:shadow-lg transition-shadow duration-200 animate-fade-in lg:col-span-3 md:col-span-2">
              <h2 className="text-lg font-medium text-red-400 mb-3">
                Losing Trades ({losses24hCount})
              </h2>
              {losses.length === 0 ? (
                <p className="text-gray-300 text-sm">No losing trades yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-custom">
                  {losses.map((t, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-blue-800 pb-2 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-100">{t.symbol}</div>
                        <div className="text-xs text-gray-300">
                          Entry: {t.entry.toFixed(4)} ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                        </div>
                        <div className="text-xs text-gray-300">
                          Exit: {t.exit.toFixed(4)} ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-red-400">{t.profit.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profit Chart */}
          <div className="mt-8 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Profit Over Time</h3>
            <div className="bg-blue-900 p-6 rounded-lg shadow-md border border-blue-800 h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitHistory}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    stroke="#94A3B8"
                    tick={{ fontSize: 12, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fontSize: 12, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                    tickMargin={8}
                    tickFormatter={(value) => `${value} USDT`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#2dd4bf"
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
