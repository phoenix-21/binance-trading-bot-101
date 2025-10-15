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
    .toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Karachi",
    })
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
              .toLocaleTimeString("en-PK", {
                timeZone: "Asia/Karachi",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace("AM", "am")
              .replace("PM", "pm"),
            balance: data.balance.toFixed(2),
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 p-6 pb-0">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "main"
              ? "bg-gray-800 text-green-400 border-b-2 border-green-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("main")}
        >
          Main Trades
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "ai"
              ? "bg-gray-800 text-green-400 border-b-2 border-green-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("ai")}
        >
          AI Trades
        </button>
      </div>

      {/* Content */}
      {activeTab === "main" ? (
        <main className="p-6">
          <h1 className="text-3xl font-bold text-green-400 mb-2">
            📈 TradeX Bot
          </h1>
          <p className="text-gray-400 mb-6">
            Trading analysis and data collection
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Balance */}
            <div className="bg-gray-800 p-4 rounded-2xl shadow">
              <h2 className="font-semibold mb-2">Balance</h2>
              <p className="text-2xl text-green-400">
                {typeof balance === "number"
                  ? balance.toFixed(2)
                  : balance}{" "}
                USDT
              </p>
            </div>

            {/* Latest Trades */}
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
                        ({t.openedAtPKT_minus5 ??
                          minus5AndFormat(t.openedAt)})
                      </span>
                      <br />
                      exit: {t.exit.toFixed(4)}{" "}
                      <span className="text-gray-400">
                        ({t.closedAtPKT_minus5 ??
                          minus5AndFormat(t.closedAt)})
                      </span>
                      <br />
                      profit:{" "}
                      <span
                        className={
                          t.profit >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {t.profit.toFixed(2)}%
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Profits */}
            <div className="bg-gray-800 p-4 rounded-2xl shadow">
              <h2 className="font-semibold mb-2 text-green-400">
                Profits ({profits24hCount})
              </h2>
              <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
                {profits.length === 0 ? (
                  <p>No profitable trades yet</p>
                ) : (
                  profits.map((t, i) => (
                    <li key={i}>
                      <div className="font-semibold">{t.symbol}</div>
                      entry: {t.entry.toFixed(4)}{" "}
                      <span className="text-gray-400">
                        ({t.openedAtPKT_minus5 ??
                          minus5AndFormat(t.openedAt)})
                      </span>
                      <br />
                      exit: {t.exit.toFixed(4)}{" "}
                      <span className="text-gray-400">
                        ({t.closedAtPKT_minus5 ??
                          minus5AndFormat(t.closedAt)})
                      </span>
                      <br />
                      profit:{" "}
                      <span className="text-green-400">
                        {t.profit.toFixed(2)}%
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Losses */}
          <div className="bg-gray-800 p-4 rounded-2xl shadow mt-6">
            <h2 className="font-semibold mb-2 text-red-400">
              Losses ({losses24hCount})
            </h2>
            <ul className="text-sm space-y-2 max-h-64 overflow-y-auto">
              {losses.length === 0 ? (
                <p>No losing trades yet</p>
              ) : (
                losses.map((t, i) => (
                  <li key={i}>
                    <div className="font-semibold">{t.symbol}</div>
                    entry: {t.entry.toFixed(4)}{" "}
                    <span className="text-gray-400">
                      ({t.openedAtPKT_minus5 ??
                        minus5AndFormat(t.openedAt)})
                    </span>
                    <br />
                    exit: {t.exit.toFixed(4)}{" "}
                    <span className="text-gray-400">
                      ({t.closedAtPKT_minus5 ??
                        minus5AndFormat(t.closedAt)})
                    </span>
                    <br />
                    profit:{" "}
                    <span className="text-red-400">
                      {t.profit.toFixed(2)}%
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Profit Chart */}
          <h3 className="text-xl mt-8 mb-2 font-semibold">
            📊 Profit Over Time
          </h3>
          <div className="bg-gray-800 p-4 rounded-2xl shadow h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitHistory}>
                <XAxis dataKey="time" hide />
                <YAxis />
                <Tooltip />
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
        </main>
      ) : (
        <AIPage />
      )}
    </div>
  );
}
