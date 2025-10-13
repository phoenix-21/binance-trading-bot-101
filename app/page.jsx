"use client";
import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Home() {
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState({});
  const [closedTrades, setClosedTrades] = useState([]);
  const [profitHistory, setProfitHistory] = useState([]);

  // Connect to Binance WebSocket (live prices)
  const { lastMessage } = useWebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

  useEffect(() => {
    if (lastMessage !== null) {
      const tickers = JSON.parse(lastMessage.data);
      tickers.forEach((t) => {
        const symbol = t.s;
        const price = parseFloat(t.c);

        // simple simulated trading logic
        setPositions((prev) => {
          const p = { ...prev };
          if (!p[symbol]) {
            // randomly enter a trade for demonstration
            if (Math.random() < 0.0002) {
              p[symbol] = { entry: price, peak: price, trail: price * 0.98 };
            }
          } else {
            const trade = p[symbol];
            trade.peak = Math.max(trade.peak, price);
            trade.trail = trade.peak * 0.98;

            // exit trade if price falls below trailing stop
            if (price < trade.trail) {
              const profit = ((price - trade.entry) / trade.entry) * 100;
              setClosedTrades((ct) => [...ct, { symbol, profit, entry: trade.entry, exit: price }]);
              setBalance((b) => b * (1 + profit / 100));
              delete p[symbol];
            }
          }
          return p;
        });
      });
    }
  }, [lastMessage]);

  useEffect(() => {
    setProfitHistory((prev) => [
      ...prev.slice(-100),
      { time: new Date().toLocaleTimeString(), balance: balance.toFixed(2) },
    ]);
  }, [balance]);

  const topPerformers = closedTrades
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 3);

  return (
    <main className="p-6 bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-green-400 mb-2">📈 Paper Trading Bot</h1>
      <p className="text-gray-400 mb-6">
        Live Binance data — simulated trades with trailing stops
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">Balance</h2>
          <p className="text-2xl text-green-400">{balance.toFixed(2)} USDT</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">Open Positions</h2>
          <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
            {Object.entries(positions).map(([symbol, p]) => (
              <li key={symbol}>
                {symbol}: entry {p.entry.toFixed(4)} trail {p.trail.toFixed(4)}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-800 p-4 rounded-2xl shadow">
          <h2 className="font-semibold mb-2">Closed Trades</h2>
          <p>{closedTrades.length}</p>
        </div>
      </div>

      <h3 className="text-xl mt-8 mb-2 font-semibold flex items-center gap-2">
        📊 Profit Over Time
      </h3>
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

      <h3 className="text-xl mt-8 mb-2 font-semibold flex items-center gap-2">
        🏆 Top 3 Performers
      </h3>
      <div className="bg-gray-800 p-4 rounded-2xl shadow">
        {topPerformers.length === 0 ? (
          <p>No closed trades yet</p>
        ) : (
          <ul>
            {topPerformers.map((t, i) => (
              <li key={i}>
                {t.symbol}: {t.profit.toFixed(2)}%
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
