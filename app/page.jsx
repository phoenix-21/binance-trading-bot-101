// app/page.jsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
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

// ✅ FIXED: Move timeRanges OUTSIDE component (stable reference)
const timeRanges = [
  { label: "6 Hours", value: "6h", ms: 6 * 60 * 60 * 1000 },
  { label: "12 Hours", value: "12h", ms: 12 * 60 * 60 * 1000 },
  { label: "24 Hours", value: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "3 Days", value: "3d", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 Days", value: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "14 Days", value: "14d", ms: 14 * 24 * 60 * 60 * 1000 },
  { label: "1 Month", value: "1m", ms: 30 * 24 * 60 * 60 * 1000 },
];

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
  const [filteredProfitHistory, setFilteredProfitHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("main");
  const [timeRange, setTimeRange] = useState("24h");

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
        const newEntry = {
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
            typeof data.balance === "number" ? data.balance.toFixed(2) : null,
          timestamp: nowMinus5.getTime(),
        };

        // Only update if balance changes or history is empty
        setProfitHistory((prev) => {
          if (prev.length === 0 || prev[prev.length - 1].balance !== newEntry.balance) {
            return [...prev.slice(-99), newEntry]; // Keep last 100 entries
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to fetch trades:", err);
      }
    }

    if (activeTab === "main") {
      fetchData();
      const interval = setInterval(fetchData, 15000); // Reduced frequency to 15s
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // ✅ Instant filter update without delay
  const filterProfitHistory = useCallback(() => {
    const range = timeRanges.find((r) => r.value === timeRange);
    if (!range) return;

    const cutoffTime = Date.now() - range.ms;
    const filtered = profitHistory.filter((entry) => entry.timestamp >= cutoffTime);
    console.log(`📊 TimeRange: ${timeRange}, Cutoff: ${new Date(cutoffTime).toLocaleTimeString()}, Points: ${filtered.length}`);
    setFilteredProfitHistory(filtered);
  }, [profitHistory, timeRange]);

  useEffect(() => {
    filterProfitHistory();
  }, [filterProfitHistory]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg shadow-gray-800/50">
          <p className="text-gray-50 text-sm font-medium">{`Time: ${label}`}</p>
          <p className="text-lime-400 text-sm">{`Balance: ${payload[0].value} USDT`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-50 font-sans">
      {/* Header */}
      <header className="bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-lime-400">TradeX Bot</span>
          </div>
          <nav className="flex space-x-2">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === "main"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-purple-700 hover:text-white"
              }`}
              onClick={() => setActiveTab("main")}
            >
              Main Trades
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeTab === "ai"
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-purple-700 hover:text-white"
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
          <h1 className="text-2xl font-semibold text-gray-50 mb-2">
            Trading Dashboard
          </h1>
          <p className="text-gray-300 text-sm mb-8">
            Real-time insights into your trading performance
          </p>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
              <h2 className="text-lg font-medium text-gray-300 mb-3">Account Balance</h2>
              <div className="flex items-center space-x-3">
                {typeof balance === "number" ? (
                  <>
                    <span className="text-3xl font-bold text-lime-400">
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
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
              <h2 className="text-lg font-medium text-gray-300 mb-3">Recent Trades</h2>
              {latestTrades.length === 0 ? (
                <p className="text-gray-300 text-sm">No trades yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-custom">
                  {latestTrades.map((t, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-50">{t.symbol}</div>
                        <div className="text-xs text-gray-300">
                          Entry: {t.entry.toFixed(4)} ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                        </div>
                        <div className="text-xs text-gray-300">
                          Exit: {t.exit.toFixed(4)} ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className={t.profit >= 0 ? "text-lime-400" : "text-red-400"}>
                          {t.profit.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profits Card */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-200 animate-fade-in">
              <h2 className="text-lg font-medium text-lime-400 mb-3">
                Profitable Trades ({profits24hCount})
              </h2>
              {profits.length === 0 ? (
                <p className="text-gray-300 text-sm">No profitable trades yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-custom">
                  {profits.map((t, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-50">{t.symbol}</div>
                        <div className="text-xs text-gray-300">
                          Entry: {t.entry.toFixed(4)} ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})
                        </div>
                        <div className="text-xs text-gray-300">
                          Exit: {t.exit.toFixed(4)} ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-lime-400">{t.profit.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Losses Card */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-200 animate-fade-in lg:col-span-3 md:col-span-2">
              <h2 className="text-lg font-medium text-red-400 mb-3">
                Losing Trades ({losses24hCount})
              </h2>
              {losses.length === 0 ? (
                <p className="text-gray-300 text-sm">No losing trades yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-custom">
                  {losses.map((t, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-50">{t.symbol}</div>
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-50">Profit Over Time</h3>
              <div className="flex space-x-2 flex-wrap gap-1">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                      timeRange === range.value
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-gray-300 hover:bg-purple-700 hover:text-white"
                    }`}
                    onClick={() => setTimeRange(range.value)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 h-96">
              <ResponsiveContainer width="100%" height="100%" debounce={0}>
                <LineChart data={filteredProfitHistory}>
                  <CartesianGrid stroke="#4b5563" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    stroke="#9ca3af"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={{ stroke: "#4b5563" }}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={{ stroke: "#4b5563" }}
                    tickMargin={8}
                    tickFormatter={(value) => `${value} USDT`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#a3e635"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={0} // ✅ Disable animation for instant update
                  />
                </LineChart>
              </ResponsiveContainer>
              {filteredProfitHistory.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">No data for selected period</p>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : (
        <AIPage />
      )}
    </div>
  );
}
