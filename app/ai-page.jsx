// app/ai-page.jsx
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

export default function AIPage() {
const [balance, setBalance] = useState(10000);
const [latestTrades, setLatestTrades] = useState([]);
const [profits, setProfits] = useState([]);
const [losses, setLosses] = useState([]);
const [profitsCount, setProfitsCount] = useState(0);
const [lossesCount, setLossesCount] = useState(0);
const [profits24hCount, setProfits24hCount] = useState(0);
const [losses24hCount, setLosses24hCount] = useState(0);
const [profitHistory, setProfitHistory] = useState([]);

useEffect(() => {
async function fetchData() {
try {
const res = await fetch("/api/ai-trades");
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
console.error("Failed to fetch AI trades:", err);
}
}

fetchData();
const interval = setInterval(fetchData, 5000);
return () => clearInterval(interval);

}, []);

return (

<main className="p-6 bg-gray-900 text-gray-100 min-h-screen">  
<h1 className="text-3xl font-bold text-green-400 mb-2">🤖 AI TradeX Bot</h1>  
<p className="text-gray-400 mb-6">  
AI-powered trading analysis and data collection  
</p>  <div className="grid md:grid-cols-3 gap-6">    
    {/* Balance */}    
    <div className="bg-gray-800 p-4 rounded-2xl shadow">    
      <h2 className="font-semibold mb-2">AI Balance</h2>    
<div className="flex items-center justify-start space-x-2">
                {typeof balance === "number" ? (
                  <>
                    <span className="text-3xl text-green-400 font-semibold">
                      {balance.toFixed(2)}
                    </span>
                    <span className="text-gray-400 text-lg">USDT</span>
                  </>
                ) : (
                  <span className="text-3xl text-green-400 font-semibold">-</span>
                )}
              </div>    
    </div>    {/* Latest Trades */}    
<div className="bg-gray-800 p-4 rounded-2xl shadow">    
  <h2 className="font-semibold mb-2">Latest 5 AI Trades</h2>    
  <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">    
    {latestTrades.length === 0 ? (    
      <p>No AI trades yet</p>    
    ) : (    
      latestTrades.map((t, i) => (    
        <li key={i}>    
          <div className="font-semibold">{t.symbol}</div>    
          entry: {t.entry.toFixed(4)}{" "}    
          <span className="text-gray-400">    
            ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})    
          </span>    
          <br />    
          exit: {t.exit.toFixed(4)}{" "}    
          <span className="text-gray-400">    
            ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})    
          </span>    
          <br />    
          profit:{" "}    
          <span    
            className={    
              t.profit >= 0 ? "text-green-400" : "text-red-400"    
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
    AI Profits ({profits24hCount})    
  </h2>    
  <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">    
    {profits.length === 0 ? (    
      <p>No profitable AI trades yet</p>    
    ) : (    
      profits.map((t, i) => (    
        <li key={i}>    
          <div className="font-semibold">{t.symbol}</div>    
          entry: {t.entry.toFixed(4)}{" "}    
          <span className="text-gray-400">    
            ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})    
          </span>    
          <br />    
          exit: {t.exit.toFixed(4)}{" "}    
          <span className="text-gray-400">    
            ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})    
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

  </div>    {/* Losses */}

  <div className="bg-gray-800 p-4 rounded-2xl shadow mt-6">    
    <h2 className="font-semibold mb-2 text-red-400">    
      AI Losses ({losses24hCount})    
    </h2>    
    <ul className="text-sm space-y-2 max-h-64 overflow-y-auto">    
      {losses.length === 0 ? (    
        <p>No losing AI trades yet</p>    
      ) : (    
        losses.map((t, i) => (    
          <li key={i}>    
            <div className="font-semibold">{t.symbol}</div>    
            entry: {t.entry.toFixed(4)}{" "}    
            <span className="text-gray-400">    
              ({t.openedAtPKT_minus5 ?? minus5AndFormat(t.openedAt)})    
            </span>    
            <br />    
            exit: {t.exit.toFixed(4)}{" "}    
            <span className="text-gray-400">    
              ({t.closedAtPKT_minus5 ?? minus5AndFormat(t.closedAt)})    
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
  </div>    {/* Profit Chart */}

  <h3 className="text-xl mt-8 mb-2 font-semibold">📊 AI Profit Over Time</h3>    
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
</main>  );
}
