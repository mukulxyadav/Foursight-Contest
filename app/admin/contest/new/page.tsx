"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { sileo } from "sileo";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";

export default function NewContestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const adminToken = getCookie("adminToken");
    if (!adminToken) router.push("/admin");
  }, [router]);

  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    registrationStart: fmt(now),
    registrationEnd: fmt(new Date(now.getTime() + 7 * 86400000)),
    contestStart: fmt(new Date(now.getTime() + 8 * 86400000)),
    contestEnd: fmt(new Date(now.getTime() + 15 * 86400000)),
    startingCapital: 1000000,
    transactionFee: 0.0005,
    maxOrderQty: 10000,
    maxPositionValue: 500000,
    maxTrades: 1000,
    allowShortSelling: false,
    allowMarketOrders: true,
    enforceMarketHours: true,
    leaderboardVisible: true,
  });

  function set(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) {
      sileo.error({ title: "Name and slug are required" });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/admin/contest", form, { withCredentials: true });
      sileo.success({ title: "Contest created successfully!" });
      router.push(`/admin/contest/${res.data.contest.id}`);
    } catch (err: any) {
      sileo.error({ title: err?.response?.data?.error ?? "Failed to create contest" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href="/admin/dashboard" className="hover:text-foreground">ADMIN</NavTransition>
            {" / NEW CONTEST"}
          </span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight mb-8">CREATE CONTEST</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="BASIC INFORMATION">
            <Field label="Contest Name *" value={form.name} onChange={(v) => { set("name", v); set("slug", autoSlug(v)); }} placeholder="University Trading Challenge 2026" />
            <Field label="URL Slug *" value={form.slug} onChange={(v) => set("slug", v)} placeholder="university-trading-2026" />
            <div>
              <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground resize-none"
                placeholder="Brief description of the contest..."
              />
            </div>
          </Section>

          <Section title="DATES">
            <Field label="Registration Opens" type="datetime-local" value={form.registrationStart} onChange={(v) => set("registrationStart", v)} />
            <Field label="Registration Closes" type="datetime-local" value={form.registrationEnd} onChange={(v) => set("registrationEnd", v)} />
            <Field label="Contest Starts" type="datetime-local" value={form.contestStart} onChange={(v) => set("contestStart", v)} />
            <Field label="Contest Ends" type="datetime-local" value={form.contestEnd} onChange={(v) => set("contestEnd", v)} />
          </Section>

          <Section title="TRADING RULES">
            <Field label="Starting Capital (₹)" type="number" value={String(form.startingCapital)} onChange={(v) => set("startingCapital", parseFloat(v))} />
            <Field label="Transaction Fee (decimal, e.g. 0.0005 = 0.05%)" type="number" value={String(form.transactionFee)} onChange={(v) => set("transactionFee", parseFloat(v))} />
            <Field label="Max Order Quantity" type="number" value={String(form.maxOrderQty)} onChange={(v) => set("maxOrderQty", parseInt(v))} />
            <Field label="Max Position Value (₹)" type="number" value={String(form.maxPositionValue)} onChange={(v) => set("maxPositionValue", parseFloat(v))} />
            <Field label="Max Total Trades" type="number" value={String(form.maxTrades)} onChange={(v) => set("maxTrades", parseInt(v))} />
          </Section>

          <Section title="PERMISSIONS">
            <CheckField label="Allow Short Selling" checked={form.allowShortSelling} onChange={(v) => set("allowShortSelling", v)} />
            <CheckField label="Allow Market Orders" checked={form.allowMarketOrders} onChange={(v) => set("allowMarketOrders", v)} />
            <CheckField label="Enforce Market Hours (09:15–15:30 IST)" checked={form.enforceMarketHours} onChange={(v) => set("enforceMarketHours", v)} />
            <CheckField label="Leaderboard Visible to Participants" checked={form.leaderboardVisible} onChange={(v) => set("leaderboardVisible", v)} />
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-foreground text-background text-sm font-mono font-semibold border border-foreground hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loading /> : "CREATE CONTEST →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="text-xs font-mono text-muted-foreground tracking-wider mb-4">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground" />
    </div>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-foreground" />
      <span className="text-sm font-mono text-foreground">{label}</span>
    </label>
  );
}
