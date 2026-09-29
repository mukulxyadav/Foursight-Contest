"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";

export default function RulesPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/contest/${id}`)
      .then((res) => setContest(res.data.contest))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
        <div className="max-w-3xl mx-auto mt-8 flex justify-center"><Loading /></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href="/contest" className="hover:text-foreground">CONTESTS</NavTransition>
            {" / "}
            <NavTransition href={`/contest/${id}`} className="hover:text-foreground">{contest?.name ?? id}</NavTransition>
            {" / RULES"}
          </span>
        </div>

        <h1 className="text-3xl font-bold font-mono tracking-tight mb-8">RULES & GUIDELINES</h1>

        {/* Contest Config */}
        {contest && (
          <div className="border border-border bg-card mb-6">
            <div className="border-b border-border px-5 py-3 bg-muted">
              <p className="text-xs font-mono font-semibold text-foreground/60 tracking-wider">CONTEST PARAMETERS</p>
            </div>
            <div className="divide-y divide-border">
              <RuleRow label="Starting Capital" value={`₹${contest.startingCapital.toLocaleString("en-IN")}`} />
              <RuleRow label="Transaction Fee" value={`${(contest.transactionFee * 100).toFixed(3)}% per trade`} />
              <RuleRow label="Maximum Order Quantity" value={`${contest.maxOrderQty.toLocaleString()} shares`} />
              <RuleRow label="Maximum Position Size" value={`₹${contest.maxPositionValue.toLocaleString("en-IN")}`} />
              <RuleRow label="Maximum Trades" value={`${contest.maxTrades} trades`} />
              <RuleRow label="Short Selling" value={contest.allowShortSelling ? "✅ Allowed" : "❌ Not Allowed"} />
              <RuleRow label="Market Orders" value={contest.allowMarketOrders ? "✅ Allowed" : "❌ Not Allowed"} />
              <RuleRow label="Market Hours Enforcement" value={contest.enforceMarketHours ? "✅ Enforced (09:15–15:30 IST)" : "⚡ Not enforced"} />
            </div>
          </div>
        )}

        {/* Rules */}
        <div className="space-y-4">
          <RuleSection title="1. TRADING RULES">
            <RuleItem>All trades are executed using live NSE market prices fetched server-side.</RuleItem>
            <RuleItem>You cannot modify the price — the server always fetches the live price at the time of your order.</RuleItem>
            <RuleItem>Executed trades are permanent and immutable. You cannot cancel or modify them.</RuleItem>
            <RuleItem>Trading is only possible when the contest status is LIVE.</RuleItem>
            {contest?.enforceMarketHours && <RuleItem>Trading is restricted to NSE market hours: Monday–Friday, 09:15 AM – 03:30 PM IST.</RuleItem>}
          </RuleSection>

          <RuleSection title="2. PORTFOLIO & SCORING">
            <RuleItem>Your portfolio value = Cash Balance + Current Market Value of all Holdings.</RuleItem>
            <RuleItem>P&L = Portfolio Value − Starting Capital (₹{contest?.startingCapital.toLocaleString("en-IN")}).</RuleItem>
            <RuleItem>ROI % = (P&L / Starting Capital) × 100.</RuleItem>
            <RuleItem>Rankings are sorted by Portfolio Value (highest to lowest).</RuleItem>
            <RuleItem>Transaction fees are charged on every trade and deducted from your cash balance.</RuleItem>
          </RuleSection>

          <RuleSection title="3. FAIR PLAY">
            <RuleItem>All participant activity is logged for audit purposes.</RuleItem>
            <RuleItem>Any attempt to manipulate, exploit, or game the system will result in immediate disqualification.</RuleItem>
            <RuleItem>Sharing accounts or coordinating trades between participants is prohibited.</RuleItem>
            <RuleItem>The leaderboard only displays Participant ID and first name initial — no personal information is publicly shown.</RuleItem>
          </RuleSection>

          <RuleSection title="4. TECHNICAL">
            <RuleItem>Use a stable internet connection during the contest.</RuleItem>
            <RuleItem>If the market price cannot be fetched, your order will not be executed.</RuleItem>
            <RuleItem>The platform uses NSE data via the Foursight market data infrastructure.</RuleItem>
            <RuleItem>All calculations (portfolio value, P&L, rankings) are performed server-side.</RuleItem>
          </RuleSection>
        </div>
      </div>
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-5 py-3">
      <span className="text-sm font-mono text-foreground/70">{label}</span>
      <span className="text-sm font-mono font-semibold text-foreground">{value}</span>
    </div>
  );
}

function RuleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-5 py-3 bg-muted">
        <p className="text-xs font-mono font-semibold text-foreground/60 tracking-wider">{title}</p>
      </div>
      <ul className="divide-y divide-border">{children}</ul>
    </div>
  );
}

function RuleItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-5 py-3 text-sm text-foreground/80 flex gap-3">
      <span className="text-foreground/30 font-mono">→</span>
      <span>{children}</span>
    </li>
  );
}
