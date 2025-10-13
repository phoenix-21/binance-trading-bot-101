"use client";
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [balance, setBalance] = useState(10000);
  const [closedTrades, setClosedTrades] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT"];

    const interval = setInterval(() => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const profit = parseFloat(((Math.random() - 0.5) * 200).toFixed(2));
      const newBalance = balance + profit;
      const trade = {
        id: uuidv4(),
        symbol,
        profit,
        time: new Date().toLocaleTimeString(),
      };
      setBalance(newBalance);
      setClosedTrades((prev) => [...prev, trade].slice(-30)); // Keep last 30 trades
      setChartData((prev) => [...prev, { time: trade.time, balance: newBalance }].slice(-20));
    }, 3000);

    return () => clearInterval(interval);
  }, [balance]);

  const topPerformers = Object.entries(
    closedTrades.reduce((acc, t) => {
      acc[t.symbol] = (acc[t.symbol] || 0) + t.profit;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-green-400 flex items-center gap-2">
          ✅ Paper Trading Bot
        </h1>
        <p className="text-sm text-gray-400">
          Live Binance simulation — trades generated every few seconds.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-900 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-3">💰 Balance</h2>
            <p className="text-3xl font-mono text-green-400">{balance.toFixed(2)} USDT</p>
          </div>

          <div className="p-6 bg-gray-900 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-3">📊 Closed Trades ({closedTrades.length})</h2>
            <div className="max-h-48 overflow-y-auto text-sm">
              {closedTrades.length ? (
                closedTrades.map((t) => (
                  <div key={t.id} className="flex justify-between border-b border-gray-800 py-1">
                    <span>{t.symbol}</span>
                    <span className={t.profit >= 0 ? "text-green-400" : "text-red-400"}>
                      {t.profit.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No trades yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-900 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">📈 Profit Over Time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-gray-900 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">🏆 Top 3 Performers</h2>
          {topPerformers.length ? (
            <ul className="space-y-1">
              {topPerformers.map(([symbol, profit]) => (
                <li key={symbol} className="flex justify-between">
                  <span>{symbol}</span>
                  <span className={profit >= 0 ? "text-green-400" : "text-red-400"}>
                    {profit.toFixed(2)} USDT
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No closed trades yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
