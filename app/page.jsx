"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// Simple TradingView-style iframe charts
const Chart = ({ symbol }) => (
  <div
    style={{
      background: "#0f172a",
      borderRadius: "1rem",
      padding: "1rem",
      boxShadow: "0 0 15px rgba(0,0,0,0.3)",
      flex: "1 1 30%",
      minWidth: 300,
      height: 320,
    }}
  >
    <iframe
      src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${symbol}&symbol=BINANCE:${symbol}&interval=1h&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=0f172a&studies=[]&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1`}
      style={{ border: "none", width: "100%", height: "100%", borderRadius: "0.75rem" }}
      allowTransparency
      allowFullScreen
    ></iframe>
  </div>
);

export default function HomePage() {
  const [trades, setTrades] = useState([]);
  const [balance, setBalance] = useState(10000);
  const [profits, setProfits] = useState([]);

  useEffect(() => {
    // Simulated trade updates (replace later with Binance websocket)
    const interval = setInterval(() => {
      const profit = (Math.random() - 0.5) * 100;
      setBalance((b) => b + profit);
      setTrades((t) => [
        ...t.slice(-9),
        { id: uuidv4(), coin: "BTC/USDT", profit: profit.toFixed(2), time: new Date().toLocaleTimeString() },
      ]);
      setProfits((p) => [...p.slice(-9), profit]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalProfit = profits.reduce((a, b) => a + b, 0).toFixed(2);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        🧠 Paper Trading Bot
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
        Simulated Binance trading using live market data
      </p>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            background: "#1e293b",
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            minWidth: 250,
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#38bdf8", fontSize: "1.2rem" }}>Balance</h2>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.5rem" }}>
            ${balance.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "1.5rem",
            borderRadius: "1rem",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            minWidth: 250,
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#38bdf8", fontSize: "1.2rem" }}>Total Profit</h2>
          <p
            style={{
              fontSize: "1.8rem",
              fontWeight: "bold",
              color: totalProfit >= 0 ? "#10b981" : "#ef4444",
              marginTop: "0.5rem",
            }}
          >
            {totalProfit >= 0 ? "+" : ""}
            {totalProfit}
          </p>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 800,
          background: "#0f172a",
          borderRadius: "1rem",
          padding: "1rem 1.5rem",
          marginBottom: "3rem",
          boxShadow: "0 0 20px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ color: "#38bdf8", marginBottom: "1rem" }}>Latest Trades</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#94a3b8" }}>
              <th style={{ padding: "0.5rem 0" }}>Time</th>
              <th>Pair</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id}>
                <td style={{ padding: "0.5rem 0", color: "#cbd5e1" }}>{t.time}</td>
                <td style={{ color: "#f1f5f9" }}>{t.coin}</td>
                <td
                  style={{
                    color: t.profit >= 0 ? "#10b981" : "#ef4444",
                    fontWeight: "600",
                  }}
                >
                  {t.profit >= 0 ? "+" : ""}
                  {t.profit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ color: "#38bdf8", marginBottom: "1rem" }}>📊 Top 3 Charts</h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
          width: "100%",
          maxWidth: 1200,
        }}
      >
        <Chart symbol="BTCUSDT" />
        <Chart symbol="ETHUSDT" />
        <Chart symbol="BNBUSDT" />
      </div>
    </main>
  );
}
