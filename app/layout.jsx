export const metadata = {
  title: "Binance Paper Trading Bot",
  description: "Live paper trading bot using Binance WebSocket data",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#f8fafc",
          fontFamily: "Inter, Arial, sans-serif",
          color: "#111827",
        }}
      >
        {children}
      </body>
    </html>
  );
}
