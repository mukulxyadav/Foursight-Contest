"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { sileo } from "sileo";
import { useRouter } from "next/navigation";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";

export default function AnnouncementsAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", priority: "INFO" });

  useEffect(() => {
    const adminToken = getCookie("adminToken");
    if (!adminToken) { router.push("/admin"); return; }
    params.then((p) => setId(p.id));
  }, [router, params]);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/admin/contest/${id}/announcements`, { withCredentials: true })
      .then((res) => setAnnouncements(res.data.announcements ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.message) {
      sileo.error({ title: "Title and message are required" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`/api/admin/contest/${id}/announcements`, form, { withCredentials: true });
      setAnnouncements([res.data.announcement, ...announcements]);
      setForm({ title: "", message: "", priority: "INFO" });
      sileo.success({ title: "Announcement published!" });
    } catch (err: any) {
      sileo.error({ title: err?.response?.data?.error ?? "Failed to publish" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(announcementId: string) {
    try {
      await axios.delete(`/api/admin/contest/${id}/announcements?announcementId=${announcementId}`, { withCredentials: true });
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      sileo.success({ title: "Announcement deleted" });
    } catch {
      sileo.error({ title: "Failed to delete" });
    }
  }

  const priorityColor: Record<string, string> = {
    IMPORTANT: "text-negative border-negative/30 bg-negative/5",
    WARNING: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5",
    INFO: "text-foreground/60 border-border bg-muted",
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-3xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href={`/admin/contest/${id}`} className="hover:text-foreground">ADMIN / CONTEST</NavTransition>
            {" / ANNOUNCEMENTS"}
          </span>
        </div>
        <h1 className="text-2xl font-bold font-mono tracking-tight mb-6">ANNOUNCEMENTS</h1>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="border border-border bg-card p-5 mb-6 space-y-4">
          <p className="text-xs font-mono text-muted-foreground tracking-wider">NEW ANNOUNCEMENT</p>
          <div>
            <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Message</label>
            <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={3}
              className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Priority</label>
            <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors">
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="IMPORTANT">IMPORTANT</option>
            </select>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-foreground text-background text-sm font-mono font-semibold border border-foreground hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center">
            {submitting ? <Loading /> : "PUBLISH ANNOUNCEMENT"}
          </button>
        </form>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8"><Loading /></div>
        ) : announcements.length === 0 ? (
          <div className="border border-border bg-card py-8 text-center text-sm font-mono text-foreground/60">
            No announcements yet.
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className={`border px-4 py-4 ${priorityColor[a.priority] ?? priorityColor.INFO}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold tracking-wider">{a.priority}</span>
                      <span className="text-xs text-foreground/40 font-mono">{new Date(a.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="text-foreground/70 text-sm mt-0.5">{a.message}</p>
                  </div>
                  <button onClick={() => handleDelete(a.id)}
                    className="text-xs font-mono text-negative hover:underline flex-shrink-0">
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
