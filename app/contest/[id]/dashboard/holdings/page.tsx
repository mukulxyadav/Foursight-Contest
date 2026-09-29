"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Loading from "@/app/components/Loading";
import { NavTransition } from "@/app/components/navbar/NavTransition";

export default function HoldingsPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/contest/${id}/holdings`, { withCredentials: true })
      .then((res) => setHoldings(res.data.holdings ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href={`/contest/${id}/dashboard`} className="hover:text-foreground">DASHBOARD</NavTransition>
            {" / HOLDINGS"}
          </span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight mb-6">HOLDINGS</h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : holdings.length === 0 ? (
          <div className="border border-border bg-card py-12 text-center">
            <p className="text-sm font-mono text-foreground/60">No holdings yet. Start trading!</p>
            <NavTransition href={`/contest/${id}/dashboard/trade`} className="inline-block mt-4 px-6 py-2.5 bg-foreground text-background text-xs font-mono border border-foreground hover:bg-foreground/90 transition-colors">
              TRADE NOW →
            </NavTransition>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="border border-border bg-card min-w-[900px]">
              <div className="border-b border-border px-4 py-3 bg-muted">
                <div className="grid grid-cols-7 gap-3 text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider">
                  <div>Stock</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Avg Buy</div>
                  <div className="text-right">LTP</div>
                  <div className="text-right">Invested</div>
                  <div className="text-right">Current</div>
                  <div className="text-right">P&L</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {holdings.map((h) => {
                  const isPositive = h.pnl >= 0;
                  return (
                    <div key={h.symbol} className="px-4 py-3 hover:bg-muted transition-colors">
                      <div className="grid grid-cols-7 gap-3 text-sm font-mono items-center">
                        <div>
                          <NavTransition href={`/stocks/${encodeURIComponent(h.symbol)}`} className="font-semibold text-foreground hover:underline">
                            {h.symbol}
                          </NavTransition>
                        </div>
                        <div className="text-right text-foreground">{h.quantity}</div>
                        <div className="text-right text-foreground/70">₹{h.avgBuyPrice.toFixed(2)}</div>
                        <div className="text-right text-foreground font-semibold">₹{h.ltp.toFixed(2)}</div>
                        <div className="text-right text-foreground/70">₹{h.investedValue.toFixed(0)}</div>
                        <div className="text-right text-foreground">₹{h.currentValue.toFixed(0)}</div>
                        <div className={`text-right font-semibold ${isPositive ? "text-positive" : "text-negative"}`}>
                          {isPositive ? "+" : ""}₹{h.pnl.toFixed(0)}{" "}
                          <span className="text-xs">({isPositive ? "+" : ""}{h.pnlPercent.toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
