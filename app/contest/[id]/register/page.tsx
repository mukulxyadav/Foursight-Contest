"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { sileo } from "sileo";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";
import { useRouter } from "next/navigation";

const EXPERIENCE_OPTIONS = ["None", "Beginner", "Intermediate", "Advanced"];
const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

export default function ContestRegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token = getCookie("token");

  const [form, setForm] = useState({
    fullName: "", regNumber: "", uniEmail: "", personalEmail: "",
    phone: "", college: "", department: "", yearOfStudy: "1st Year",
    section: "", teamName: "", experience: "None", agreed: false,
  });

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/contest/${id}`)
      .then((res) => setContest(res.data.contest))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (!token) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16 flex-grow flex items-start justify-center">
        <div className="max-w-md w-full mt-12 border border-border bg-card p-8 text-center">
          <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">LOGIN REQUIRED</p>
          <h2 className="text-2xl font-bold font-mono mb-2">Sign in to register</h2>
          <p className="text-foreground/60 text-sm mb-6">You need a Foursight account to participate in the contest.</p>
          <NavTransition href="/login" className="block px-6 py-3 bg-foreground text-background text-sm font-mono text-center border border-foreground hover:bg-foreground/90 transition-colors">
            LOGIN →
          </NavTransition>
        </div>
      </div>
    );
  }

  function set(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agreed) {
      sileo.error({ title: "Please accept the contest terms" });
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/api/contest/${id}/register`, form, {
        headers: { Cookie: `token=${token}` },
        withCredentials: true,
      });
      sileo.success({ title: "Registration successful! Awaiting admin approval." });
      router.push(`/contest/${id}`);
    } catch (err: any) {
      sileo.error({ title: err?.response?.data?.error ?? "Registration failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-2xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href="/contest" className="hover:text-foreground">CONTESTS</NavTransition>
            {" / "}
            <NavTransition href={`/contest/${id}`} className="hover:text-foreground">{contest?.name ?? id}</NavTransition>
            {" / REGISTER"}
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono tracking-tight">CONTEST REGISTRATION</h1>
          {contest && <p className="text-foreground/60 mt-1">{contest.name}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <Section title="PERSONAL INFORMATION">
            <Field label="Full Name *" value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="As per college ID" />
            <Field label="Personal Email *" type="email" value={form.personalEmail} onChange={(v) => set("personalEmail", v)} placeholder="your@email.com" />
            <Field label="Phone Number *" type="tel" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+91 XXXXX XXXXX" />
          </Section>

          {/* Academic Info */}
          <Section title="ACADEMIC INFORMATION">
            <Field label="University Registration Number *" value={form.regNumber} onChange={(v) => set("regNumber", v)} placeholder="e.g. RA2011003010XXX" />
            <Field label="University / College Email *" type="email" value={form.uniEmail} onChange={(v) => set("uniEmail", v)} placeholder="reg@university.edu.in" />
            <Field label="College / University *" value={form.college} onChange={(v) => set("college", v)} placeholder="SRM Institute of Science and Technology" />
            <Field label="Department *" value={form.department} onChange={(v) => set("department", v)} placeholder="B.Tech Computer Science" />
            <div>
              <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Year of Study *</label>
              <select
                value={form.yearOfStudy}
                onChange={(e) => set("yearOfStudy", e.target.value)}
                className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors"
              >
                {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Field label="Section (optional)" value={form.section} onChange={(v) => set("section", v)} placeholder="A, B, C..." />
          </Section>

          {/* Contest Info */}
          <Section title="CONTEST PREFERENCES">
            <Field label="Team Name (optional)" value={form.teamName} onChange={(v) => set("teamName", v)} placeholder="Team Alpha..." />
            <div>
              <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">Trading Experience</label>
              <select
                value={form.experience}
                onChange={(e) => set("experience", e.target.value)}
                className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors"
              >
                {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </Section>

          {/* Terms */}
          <div className="border border-border bg-card p-5">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">TERMS & CONDITIONS</p>
            <div className="text-sm text-foreground/70 space-y-2 mb-4">
              <p>• Trading is with virtual money only — no real financial risk.</p>
              <p>• All trades are executed at live market prices fetched server-side.</p>
              <p>• Executed trades are immutable and cannot be modified.</p>
              <p>• Rankings are calculated based on portfolio value at contest end.</p>
              <p>• Any attempt to manipulate the system will result in disqualification.</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(e) => set("agreed", e.target.checked)}
                className="w-4 h-4 accent-foreground"
              />
              <span className="text-sm font-mono text-foreground">
                I agree to the contest rules and terms of participation
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-8 py-4 bg-foreground text-background text-sm font-mono font-semibold border border-foreground hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {submitting ? <Loading /> : "SUBMIT REGISTRATION →"}
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

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-foreground/60 uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-border bg-card text-foreground text-sm font-mono focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
      />
    </div>
  );
}
