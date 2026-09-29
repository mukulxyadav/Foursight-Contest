"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";

export default function AdminOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [searchSymbol, setSearchSymbol] = useState("");
  const [searchParticipant, setSearchParticipant] = useState("");
  
  const limit = 50;

  useEffect(() => {
    const adminToken = getCookie("adminToken");
    if (!adminToken) { router.push("/admin"); return; }
    params.then((p) => setId(p.id));
  }, [router, params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const urlParams = new URLSearchParams();
    urlParams.set("page", String(page));
    urlParams.set("limit", String(limit));
    if (searchSymbol) urlParams.set("symbol", searchSymbol.toUpperCase());
    if (searchParticipant) urlParams.set("participantId", searchParticipant.toUpperCase());

    axios.get(`/api/admin/contest/${id}/orders?${urlParams.toString()}`, { withCredentials: true })
      .then((res) => {
        setOrders(res.data.orders ?? []);
        setTotal(res.data.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, page, searchSymbol, searchParticipant]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href={`/admin/contest/${id}`} className="hover:text-foreground">ADMIN / CONTEST</NavTransition>
            {" / ORDERS"}
          </span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold font-mono tracking-tight">ALL ORDERS</h1>
          <span className="text-xs font-mono text-foreground/60">{total} total orders found</span>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            value={searchParticipant}
            onChange={(e) => setSearchParticipant(e.target.value)}
            placeholder="Search by Participant ID..."
            className="flex-1 px-4 py-2.5 border border-border bg-card text-sm font-mono text-foreground focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
          />
          <input
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            placeholder="Search by Stock Symbol..."
            className="flex-1 px-4 py-2.5 border border-border bg-card text-sm font-mono text-foreground focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <div className="border border-border bg-card min-w-[900px]">
                <div className="border-b border-border px-4 py-3 bg-muted">
                  <div className="grid grid-cols-9 gap-2 text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider">
                    <div>Time</div>
                    <div className="col-span-2">Participant</div>
                    <div>Stock</div>
                    <div className="text-center">Type</div>
                    <div className="text-right">Qty</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Value</div>
                    <div className="text-center">Status</div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {orders.length === 0 ? (
                    <div className="py-8 text-center text-sm font-mono text-foreground/60">No orders found</div>
                  ) : orders.map((o) => {
                    const isBuy = o.orderType === "BUY";
                    return (
                      <div key={o.orderId} className="px-4 py-3 hover:bg-muted transition-colors">
                        <div className="grid grid-cols-9 gap-2 text-sm font-mono items-center">
                          <div className="text-foreground/60 text-xs">
                            {new Date(o.executedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            <div className="text-foreground/40">{new Date(o.executedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold text-foreground block">{o.participant?.participantId}</span>
                            <span className="text-xs text-foreground/50">{o.participant?.fullName}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-xs">{o.symbol}</span>
                          </div>
                          <div className={`text-center font-semibold text-xs ${isBuy ? "text-positive" : "text-negative"}`}>
                            {o.orderType}
                          </div>
                          <div className="text-right">{o.quantity}</div>
                          <div className="text-right text-foreground/80">₹{o.price.toFixed(2)}</div>
                          <div className="text-right">₹{o.totalValue.toFixed(0)}</div>
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
                <span className="px-4 py-2 text-xs font-mono text-foreground/60 flex items-center">
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
