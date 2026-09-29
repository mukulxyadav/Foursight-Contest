"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { sileo } from "sileo";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";
import { symbols } from "@/app/components/symbols";

export default function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [ltp, setLtp] = useState<number>(0);
  const [ltpLoading, setLtpLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [submitting, setSubmitting] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/contest/${id}/portfolio`, { withCredentials: true })
      .then((res) => setPortfolio(res.data))
      .catch(console.error);
  }, [id]);

  // Stock search
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toUpperCase();
    const results = symbols
      .filter((s: any) => s.Scrip?.includes(q) || s["Company Name"]?.toUpperCase().includes(q))
      .slice(0, 8);
    setSearchResults(results);
  }, [search]);

  // Fetch LTP when stock is selected
  async function selectStock(scrip: any) {
    setSelected(scrip);
    setSearch(scrip.Scrip);
    setSearchResults([]);
    setLtpLoading(true);
    try {
      const res = await axios.post("https://foursight-backend.harshiyer.workers.dev/api/v1/getStockQuote", {
        symbol: btoa(scrip.Scrip),
      });
      setLtp(res.data?.stockQuote?.ltp ?? 0);
    } catch (e) {
      sileo.error({ title: "Failed to fetch live price" });
    } finally {
      setLtpLoading(false);
    }
  }

  async function handleTrade(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || quantity <= 0) {
      sileo.error({ title: "Please select a stock and enter quantity" });
      return;
    }
    
    // REQUIREMENT: Confirmation dialogs for trades
    const confirmed = window.confirm(`Are you sure you want to ${orderType} ${quantity} shares of ${selected.Scrip}?`);
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `/api/contest/${id}/orders`,
        { symbol: selected.Scrip, quantity, orderType },
        { withCredentials: true }
      );
      sileo.success({ title: res.data.message });
      // Refresh portfolio
      const portfolioRes = await axios.get(`/api/contest/${id}/portfolio`, { withCredentials: true });
      setPortfolio(portfolioRes.data);
      setQuantity(1);
    } catch (err: any) {
      sileo.error({ title: err?.response?.data?.error ?? "Order failed" });
    } finally {
      setSubmitting(false);
    }
  }

  const totalValue = quantity * ltp;
  const fee = totalValue * (portfolio?.transactionFee ?? 0.0005);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href={`/contest/${id}/dashboard`} className="hover:text-foreground">DASHBOARD</NavTransition>
            {" / TRADE"}
          </span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight mb-6">TRADE</h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Trade Panel */}
          <div className="xl:col-span-1">
            <div className="border border-border bg-card p-5">
              <p className="text-xs font-mono text-muted-foreground tracking-wider mb-4">PLACE ORDER</p>

              {/* Order Type Toggle */}
              <div className="flex mb-5">
                <button
                  onClick={() => setOrderType("BUY")}
                  className={`flex-1 py-2.5 text-sm font-mono font-semibold border transition-colors ${
                    orderType === "BUY"
                      ? "bg-positive text-white border-positive"
                      : "border-border text-foreground/60 hover:bg-muted"
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setOrderType("SELL")}
                  className={`flex-1 py-2.5 text-sm font-mono font-semibold border transition-colors ${
                    orderType === "SELL"
                      ? "bg-negative text-white border-negative"
                      : "border-border text-foreground/60 hover:bg-muted"
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Stock Search */}
              <div className="mb-4 relative">
                <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Search Stock</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. RELIANCE, TCS, INFY..."
                  className="w-full px-3 py-2.5 border border-border bg-card text-sm font-mono text-foreground focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((s: any) => (
                      <button
                        key={s.Scrip}
                        onClick={() => selectStock(s)}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm font-mono border-b border-border last:border-b-0 transition-colors"
                      >
                        <div className="font-semibold text-foreground">{s.Scrip}</div>
                        <div className="text-xs text-foreground/50">{s["Company Name"]}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LTP Display */}
              {selected && (
                <div className="mb-4 border border-border bg-muted px-3 py-3">
                  <p className="text-xs font-mono text-foreground/60 mb-1">{selected["Company Name"]}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono text-foreground/60">LTP</span>
                    {ltpLoading ? (
                      <Loading />
                    ) : (
                      <span className="text-lg font-bold font-mono text-foreground">₹{ltp.toFixed(2)}</span>
                    )}
                    <span className="text-xs text-foreground/40 font-mono">(server-fetched)</span>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <form onSubmit={handleTrade}>
                <div className="mb-4">
                  <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-full px-3 py-2.5 border border-border bg-card text-sm font-mono text-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>

                {/* Order Summary */}
                {selected && ltp > 0 && (
                  <div className="mb-4 space-y-1.5 border border-border bg-muted px-3 py-3 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Total Value</span>
                      <span className="text-foreground">₹{totalValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Transaction Fee</span>
                      <span className="text-foreground">₹{fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                      <span className="text-foreground/80">{orderType === "BUY" ? "Total Cost" : "Net Proceeds"}</span>
                      <span className={orderType === "BUY" ? "text-negative" : "text-positive"}>
                        ₹{orderType === "BUY" ? (totalValue + fee).toFixed(2) : (totalValue - fee).toFixed(2)}
                      </span>
                    </div>
                    {portfolio && (
                      <div className="flex justify-between pt-0.5">
                        <span className="text-foreground/40">Available Cash</span>
                        <span className="text-foreground/60">₹{portfolio.cashBalance?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selected || quantity <= 0}
                  className={`w-full py-3 text-sm font-mono font-semibold border transition-colors disabled:opacity-50 flex items-center justify-center ${
                    orderType === "BUY"
                      ? "bg-positive text-white border-positive hover:bg-positive/90"
                      : "bg-negative text-white border-negative hover:bg-negative/90"
                  }`}
                >
                  {submitting ? <Loading /> : `${orderType} ${selected?.Scrip ?? "STOCK"}`}
                </button>
                <p className="text-xs font-mono text-foreground/40 text-center mt-2">
                  Price will be fetched server-side at execution time
                </p>
              </form>
            </div>
          </div>

          {/* Info Column */}
          <div className="xl:col-span-2 space-y-4">
            {/* Portfolio Summary */}
            {portfolio && (
              <div className="border border-border bg-card p-5">
                <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">YOUR CONTEST ACCOUNT</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MiniStat label="Cash" value={`₹${portfolio.cashBalance?.toLocaleString("en-IN", { maximumFractionDigits: 0 }) ?? "—"}`} />
                  <MiniStat label="Portfolio" value={`₹${portfolio.portfolioValue?.toLocaleString("en-IN", { maximumFractionDigits: 0 }) ?? "—"}`} />
                  <MiniStat
                    label="P&L"
                    value={`${portfolio.pnl >= 0 ? "+" : ""}₹${Math.abs(portfolio.pnl)?.toLocaleString("en-IN", { maximumFractionDigits: 0 }) ?? "0"}`}
                    positive={portfolio.pnl >= 0}
                  />
                  <MiniStat label="Rank" value={`#${portfolio.rank ?? "—"}`} />
                </div>
              </div>
            )}

            {/* Browse Stocks CTA */}
            <div className="border border-border bg-card p-5">
              <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">BROWSE MARKET</p>
              <p className="text-sm text-foreground/70 mb-3">Search for stocks, view charts and market data, then place contest orders here.</p>
              <NavTransition href="/stocks" className="inline-block px-4 py-2 border border-border text-xs font-mono hover:bg-muted transition-colors">
                BROWSE ALL STOCKS →
              </NavTransition>
            </div>

            {/* Quick Links */}
            <div className="flex gap-2">
              <NavTransition href={`/contest/${id}/dashboard/holdings`} className="px-4 py-2 border border-border bg-card text-xs font-mono hover:bg-muted transition-colors">
                VIEW HOLDINGS
              </NavTransition>
              <NavTransition href={`/contest/${id}/dashboard/orders`} className="px-4 py-2 border border-border bg-card text-xs font-mono hover:bg-muted transition-colors">
                ORDER HISTORY
              </NavTransition>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-xs font-mono text-foreground/50 mb-1">{label}</p>
      <p className={`text-sm font-bold font-mono ${
        positive === undefined ? "text-foreground"
          : positive ? "text-positive"
          : "text-negative"
      }`}>{value}</p>
    </div>
  );
}
