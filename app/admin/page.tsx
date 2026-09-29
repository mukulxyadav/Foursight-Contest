"use client";
import { useState } from "react";
import axios from "axios";
import { sileo } from "sileo";
import { useRouter } from "next/navigation";
import Loading from "@/app/components/Loading";

export default function AdminLoginPage() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!secret) return;
    setLoading(true);
    try {
      await axios.post("/api/admin/auth", { secret });
      router.push("/admin/dashboard");
    } catch {
      sileo.error({ title: "Invalid admin credentials" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <span className="text-xs font-mono text-muted-foreground tracking-wider block mb-2">FOURSIGHT</span>
          <h1 className="text-3xl font-bold font-mono tracking-tight">ADMIN ACCESS</h1>
          <p className="text-foreground/60 mt-2 text-sm">Enter the admin secret to continue.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Admin Secret</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter admin secret"
              className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-foreground text-background text-sm font-mono font-semibold border border-foreground hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loading /> : "ACCESS ADMIN PANEL →"}
          </button>
        </form>
      </div>
    </div>
  );
}
