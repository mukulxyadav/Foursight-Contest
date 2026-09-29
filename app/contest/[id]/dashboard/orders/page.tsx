"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Loading from "@/app/components/Loading";
import { NavTransition } from "@/app/components/navbar/NavTransition";

export default function OrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/contest/${id}/orders?page=${page}&limit=${limit}`, { withCredentials: true })
      .then((res) => {
        setOrders(res.data.orders ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, page]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href={`/contest/${id}/dashboard`} className="hover:text-foreground">DASHBOARD</NavTransition>
            {" / ORDER HISTORY"}
          </span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-mono tracking-tight">ORDER HISTORY</h1>
          <span className="text-xs font-mono text-foreground/60">{total} total orders</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : orders.length === 0 ? (
          <div className="border border-border bg-card py-12 text-center">
            <p className="text-sm font-mono text-foreground/60">No orders yet.</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <div className="border border-border bg-card min-w-[800px]">
                <div className="border-b border-border px-4 py-3 bg-muted">
                  <div className="grid grid-cols-8 gap-2 text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider">
                    <div>Time</div>
                    <div>Stock</div>
                    <div className="text-center">Type</div>
                    <div className="text-right">Qty</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Total</div>
                    <div className="text-right">Fee</div>
                    <div className="text-center">Status</div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {orders.map((o) => {
                    const isBuy = o.orderType === "BUY";
                    return (
                      <div key={o.orderId} className="px-4 py-3 hover:bg-muted transition-colors">
                        <div className="grid grid-cols-8 gap-2 text-sm font-mono items-center">
                          <div className="text-foreground/60 text-xs">
                            {new Date(o.executedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            <div className="text-foreground/40">{new Date(o.executedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                          </div>
                          <div>
                            <NavTransition href={`/stocks/${encodeURIComponent(o.symbol)}`} className="font-semibold text-foreground hover:underline text-xs">
                              {o.symbol}
                            </NavTransition>
                          </div>
                          <div className={`text-center font-semibold text-xs ${isBuy ? "text-positive" : "text-negative"}`}>
                            {o.orderType}
                          </div>
                          <div className="text-right">{o.quantity}</div>
                          <div className="text-right text-foreground/80">₹{o.price.toFixed(2)}</div>
                          <div className="text-right">₹{o.totalValue.toFixed(0)}</div>
                          <div className="text-right text-foreground/50 text-xs">₹{o.fee.toFixed(2)}</div>
                          <div className="text-center">
                            <span className={`text-xs px-1.5 py-0.5 font-semibold ${
                              o.status === "EXECUTED" ? "text-positive bg-positive/10" : "text-negative bg-negative/10"
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-border text-xs font-mono hover:bg-muted transition-colors disabled:opacity-40"
                >
                  PREV
                </button>
                <span className="px-4 py-2 text-xs font-mono text-foreground/60">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-4 py-2 border border-border text-xs font-mono hover:bg-muted transition-colors disabled:opacity-40"
                >
                  NEXT
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
