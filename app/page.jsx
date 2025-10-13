"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// --- Config ---
const START_BALANCE = 10000;
const SYMBOLS = ["btcusdt", "ethusdt", "bnbusdt"];
const ALLOCATION_PER_SYMBOL = 0.05;   // 5% of balance per trade
const TRAIL_PERCENT = 0.01;           // 1%
const ENTRY_RISE_PERCENT = 0.004;     // 0.4%
const LOOKBACK_MS = 10 * 60 * 1000;   // 10 minutes

function nowMs() { return Date.now(); }

// --- Component ---
export default function Home() {
  const [balance, setBalance] = useState(START_BALANCE);
  const [positions, setPositions] = useState({});
  const [history, setHistory] = useState([]);
  const [ticks, setTicks] = useState({});
  const minimaRef = useRef({});
  const ticksRef = useRef({});
  ticksRef.current = ticks;

  // connect to Binance
  useEffect(() => {
    const streams = SYMBOLS.map(s => `${s}@trade`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    let ws;
    let stop = false;

    function connect() {
      ws = new WebSocket(url);
      ws.onopen = () => console.log("✅ Connected to Binance");
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        const data = msg.data;
        if (!data) return;
        const symbol = data.s.toLowerCase();
        const price = parseFloat(data.p);
        const time = data.E;
        setTicks(prev => ({ ...prev, [symbol]: { price, time } }));

        // update rolling minima
        const arr = minimaRef.current[symbol] || [];
        arr.push({ price, time });
        const cutoff = time - LOOKBACK_MS;
        while (arr.length && arr[0].time < cutoff) arr.shift();
        minimaRef.current[symbol] = arr;
      };
      ws.onclose = () => {
        if (!stop) {
          console.log("🔁 Reconnecting...");
          setTimeout(connect, 2000);
        }
      };
    }
    connect();
    return () => { stop = true; ws?.close(); };
  }, []);

  // Engine loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = nowMs();

      SYMBOLS.forEach(symbol => {
        const tick = ticksRef.current[symbol];
        if (!tick) return;
        const arr = minimaRef.current[symbol] || [];
        if (!arr.length) return;
        const minPrice = arr.reduce((m, x) => Math.min(m, x.price), Infinity);
        const price = tick.price;
        const rise = (price - minPrice) / minPrice;

        setPositions(prev => {
          const copy = { ...prev };
          const openPos = copy[symbol]?.find(p => p.status === "OPEN");

          // Try entry
          if (!openPos && rise >= ENTRY_RISE_PERCENT) {
            const allocation = balance * ALLOCATION_PER_SYMBOL;
            const qty = +(allocation / price).toFixed(6);
            const pos = {
              id: uuidv4(),
              symbol,
              entryPrice: price,
              quantity: qty,
              entryTime: now,
              peak: price,
              trail: price * (1 - TRAIL_PERCENT),
              status: "OPEN",
            };
            copy[symbol] = [pos];
            console.log("📈 BUY", symbol, "at", price);
            return copy;
          }

          // Manage trailing stop
          if (openPos && openPos.status === "OPEN") {
            let changed = false;
            if (price > openPos.peak) {
              openPos.peak = price;
              openPos.trail = price * (1 - TRAIL_PERCENT);
              changed = true;
            }
            if (price <= openPos.trail) {
              const pnl = (price - openPos.entryPrice) * openPos.quantity;
              openPos.status = "CLOSED";
              openPos.exitPrice = price;
              openPos.exitTime = now;
              openPos.pnl = pnl;
              setBalance(b => b + pnl);
              setHistory(h => [{ ...openPos }, ...h]);
              console.log("📉 SELL", symbol, "at", price, "PNL:", pnl.toFixed(2));
              changed = true;
            }
            if (changed) copy[symbol] = [openPos];
            return { ...copy };
          }

          return prev;
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [balance]);

  // Chart data (profit history)
  const chartData = useMemo(() => {
    const cumulative = [];
    let running = START_BALANCE;
    [...history].reverse().forEach(tr => {
      running += tr.pnl;
      cumulative.push({
        time: new Date(tr.exitTime).toLocaleTimeString(),
        balance: running,
      });
    });
    return cumulative;
  }, [history]);

  const top3 = useMemo(() => {
    const per = {};
    history.forEach(h => {
      per[h.symbol] = (per[h.symbol] || 0) + h.pnl;
    });
    return Object.entries(per)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [history]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-2">💹 Paper Trading Bot</h1>
      <p className="mb-6 text-gray-400">Live Binance data — simulated trades with trailing stops</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-800 p-4 rounded-2xl shadow">
          <h3 className="font-semibold text-gray-300 mb-1">Balance</h3>
          <div className="text-2xl font-bold text-emerald-400">{balance.toFixed(2)} USDT</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl shadow">
          <h3 className="font-semibold text-gray-300 mb-1">Open Positions</h3>
          {Object.values(positions).flat().filter(p => p.status === "OPEN").length || "—"}
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl shadow">
          <h3 className="font-semibold text-gray-300 mb-1">Closed Trades</h3>
          {history.length}
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-900 rounded-xl p-4 mb-8">
        <table className="min-w-full text-sm">
          <thead className="text-gray-400 border-b border-slate-700">
            <tr><th className="text-left py-2">Symbol</th><th>Entry</th><th>Peak</th><th>Trail</th><th>Status</th></tr></thead>
          <tbody>
            {Object.values(positions).flat().map(pos => (
              <tr key={pos.id} className="border-b border-slate-800">
                <td className="py-1">{pos.symbol.toUpperCase()}</td>
                <td>{pos.entryPrice.toFixed(4)}</td>
                <td>{pos.peak.toFixed(4)}</td>
                <td>{pos.trail.toFixed(4)}</td>
                <td className={pos.status === "OPEN" ? "text-emerald-400" : "text-red-400"}>{pos.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-xl font-semibold mb-4">📊 Profit Over Time</h3>
      <div className="bg-slate-900 rounded-2xl p-4 mb-10" style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" hide />
            <YAxis domain={['dataMin', 'dataMax']} />
            <Tooltip />
            <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="text-xl font-semibold mb-3">🏆 Top 3 Performers</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {top3.length ? top3.map(([sym, pnl]) => (
          <div key={sym} className="bg-slate-800 rounded-2xl p-4">
            <h4 className="text-lg font-semibold">{sym.toUpperCase()}</h4>
            <p className={pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
              {pnl.toFixed(2)} USDT
            </p>
          </div>
        )) : <p className="text-gray-400">No closed trades yet</p>}
      </div>
    </div>
  );
}
