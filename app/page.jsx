// pages/index.js (or app/page.jsx in Next 13)
// Install: npm i react-use uuid
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// --- Config ---
const START_BALANCE = 10000; // USDT
const SYMBOLS = [
  "btcusdt", "ethusdt", "bnbusdt", "xrpusdt", "adausdt",
  "solusdt", "dogeusdt", "ltcusdt", "maticusdt", "avaxusdt"
  // expand as needed. Lowercase required by Binance stream names.
];

const ALLOCATION_PER_SYMBOL = 0.01; // 1% of balance per new trade
const TRAIL_PERCENT = 0.01; // 1%
const ENTRY_RISE_PERCENT = 0.005; // 0.5% rise over recent min
const LOOKBACK_MS = 15 * 60 * 1000; // 15 minutes

// Utility
function nowMs(){ return Date.now(); }
function saveState(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }
function loadState(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) || fallback; }catch(e){return fallback;} }

// --- Main Page ---
export default function Home(){
  const [balance, setBalance] = useState(() => loadState("paper_balance", START_BALANCE));
  const [positions, setPositions] = useState(() => loadState("paper_positions", {})); // { symbol: [pos,...] }
  const [history, setHistory] = useState(() => loadState("paper_history", [])); // closed trades
  const [ticks, setTicks] = useState({}); // { symbol: {price, time} }
  const ticksRef = useRef(ticks);
  ticksRef.current = ticks;

  // rolling minima store for entry logic
  const minimaRef = useRef({}); // { symbol: [{time, price}, ...] }
  const highsRef = useRef({}); // peak since entry

  // connect to Binance combined stream
  useEffect(() => {
    if (!SYMBOLS.length) return;
    // build stream path: e.g. btcusdt@trade/ethusdt@trade/...
    const streams = SYMBOLS.map(s => `${s}@trade`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    let ws;
    let closed = false;

    function connect(){
      ws = new WebSocket(url);
      ws.onopen = () => console.log("WS open");
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        // Binance combined streams: { stream: "btcusdt@trade", data: {...} }
        const data = msg.data;
        const stream = msg.stream;
        if (!data) return;
        // trade message fields: p (price), E (event time), s (symbol)
        const symbol = (data.s || "").toLowerCase();
        const price = parseFloat(data.p || data.c || data.price || 0);
        const time = data.E || Date.now();
        setTicks(prev => ({ ...prev, [symbol]: { price, time } }));
        // update minima window
        const arr = minimaRef.current[symbol] || [];
        arr.push({ time, price });
        // purge older than lookback
        const cutoff = time - LOOKBACK_MS;
        while (arr.length && arr[0].time < cutoff) arr.shift();
        minimaRef.current[symbol] = arr;

        // update open positions trailing stops
        setPositions(prev => {
          const copy = { ...prev };
          const opens = copy[symbol] ? [...copy[symbol]] : [];
          let changed = false;
          for (let i=0;i<opens.length;i++){
            const pos = { ...opens[i] };
            if (pos.status === "OPEN"){
              // update peak
              if (price > pos.peakPriceSinceEntry){
                pos.peakPriceSinceEntry = price;
                pos.trailingStop = pos.peakPriceSinceEntry * (1 - TRAIL_PERCENT);
                changed = true;
              }
              // check exit
              if (price <= pos.trailingStop){
                // close
                pos.status = "CLOSED";
                pos.exitPrice = price;
                pos.exitTime = time;
                pos.pnl = (pos.exitPrice - pos.entryPrice) * pos.quantity;
                // adjust balance
                setBalance(b => {
                  const nb = +(b + pos.pnl).toFixed(8);
                  saveState("paper_balance", nb);
                  return nb;
                });
                // add to history
                setHistory(h => {
                  const nh = [{...pos}, ...h];
                  saveState("paper_history", nh);
                  return nh;
                });
                changed = true;
              }
            }
            opens[i] = pos;
          }
          if (changed) { copy[symbol] = opens; saveState("paper_positions", copy); return copy; }
          return prev;
        });
      };
      ws.onclose = () => {
        if (!closed) {
          console.log("WS closed — reconnecting in 2s");
          setTimeout(connect, 2000);
        }
      };
      ws.onerror = (e) => {
        console.error("WS error", e);
        try{ ws.close(); }catch(e){}
      };
    }
    connect();
    return () => { closed = true; try{ws.close()}catch(e){} };
  }, []);

  // Engine: run every second to check entry conditions
  useEffect(() => {
    const iv = setInterval(() => {
      const now = nowMs();
      SYMBOLS.forEach(symbol => {
        const tick = ticksRef.current[symbol];
        if (!tick) return;
        // get lookback min
        const arr = minimaRef.current[symbol] || [];
        if (!arr.length) return;
        const minPrice = arr.reduce((m,x) => Math.min(m,x.price), Infinity);
        const price = tick.price;
        const rise = (price - minPrice) / minPrice;
        // Entry condition
        if (rise >= ENTRY_RISE_PERCENT){
          // check if already have open position for symbol
          const opens = (positions[symbol] || []).filter(p => p.status === "OPEN");
          if (opens.length === 0){
            // open position
            const amount = balance * ALLOCATION_PER_SYMBOL; // USD allocated
            if (amount < 1) return; // too small
            const quantity = +(amount / price).toFixed(8);
            const newPos = {
              id: uuidv4(),
              symbol,
              side: "LONG",
              entryPrice: price,
              entryTime: now,
              quantity,
              status: "OPEN",
              peakPriceSinceEntry: price,
              trailingStop: price * (1 - TRAIL_PERCENT),
              pnl: 0
            };
            setPositions(prev => {
              const copy = { ...prev, [symbol]: [ newPos, ...(prev[symbol]||[]) ] };
              saveState("paper_positions", copy);
              return copy;
            });
            // reduce "available" balance? (we will keep balance as total with open pos not subtracted)
            // For simplicity, treat balance as cash + realized PNL. Optionally track allocated capital separately.
          }
        }
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [balance, positions]);

  // compute top 10 performers by realized profit today
  const topByProfit = React.useMemo(() => {
    // filter history for today's trades
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const sd = startOfDay.getTime();
    const perSymbol = {};
    history.forEach(t => {
      if ((t.exitTime || 0) >= sd){
        perSymbol[t.symbol] = (perSymbol[t.symbol] || 0) + (t.pnl || 0);
      }
    });
    const arr = Object.entries(perSymbol).map(([sym, profit]) => ({ symbol:sym, profit }));
    arr.sort((a,b) => b.profit - a.profit);
    return arr.slice(0,10);
  }, [history]);

  return (
    <div style={{ padding: 24, fontFamily: "Inter, Arial" }}>
      <h1>Paper Trading Bot — demo</h1>
      <p>Balance: <strong>{balance.toFixed(2)} USDT</strong></p>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h3>Live Prices</h3>
          <table cellPadding={6} style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th>Symbol</th><th>Price</th><th>Last</th></tr></thead>
            <tbody>
              {SYMBOLS.map(s => {
                const t = ticks[s];
                return <tr key={s}>
                  <td>{s.toUpperCase()}</td>
                  <td>{t ? t.price.toFixed(6) : "-"}</td>
                  <td>{t ? new Date(t.time).toLocaleTimeString() : "-"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        <div style={{ width: 420 }}>
          <h3>Top 10 Performers Today</h3>
          <ol>
            {topByProfit.length ? topByProfit.map(x => (
              <li key={x.symbol}>{x.symbol.toUpperCase()}: {x.profit.toFixed(2)} USDT</li>
            )) : <li>No realized trades today</li>}
          </ol>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3>Open Positions</h3>
        <table cellPadding={6} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>Symbol</th><th>Entry</th><th>Qty</th><th>Trail</th><th>Peak</th><th>Unrealized P&L</th></tr></thead>
          <tbody>
            {Object.entries(positions).flatMap(([sym, arr]) => arr.map(pos => ({ sym, pos }))).map(({sym,pos}) => {
              const last = ticks[sym]?.price ?? pos.entryPrice;
              const unreal = (last - pos.entryPrice) * pos.quantity;
              return <tr key={pos.id}>
                <td>{sym.toUpperCase()}</td>
                <td>{pos.entryPrice.toFixed(6)}</td>
                <td>{pos.quantity}</td>
                <td>{pos.trailingStop?.toFixed(6)}</td>
                <td>{pos.peakPriceSinceEntry?.toFixed(6)}</td>
                <td>{unreal.toFixed(4)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3>Closed Trades (most recent)</h3>
        <table cellPadding={6} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th>Symbol</th><th>Entry</th><th>Exit</th><th>P&L</th><th>Time</th></tr></thead>
          <tbody>
            {history.map(tr => (
              <tr key={tr.id}>
                <td>{tr.symbol.toUpperCase()}</td>
                <td>{tr.entryPrice.toFixed(6)}</td>
                <td>{tr.exitPrice.toFixed(6)}</td>
                <td>{tr.pnl.toFixed(4)}</td>
                <td>{new Date(tr.exitTime).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18 }}>
        <button onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}>Reset (clear local state)</button>
      </div>
    </div>
  );
}
