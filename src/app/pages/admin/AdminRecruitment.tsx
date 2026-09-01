import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const NS = "recruitment";

const DEFAULTS = {
  "recruitment.body":
    "Fall 2026 recruitment is coming soon. Sign up to stay in the loop on events and applications.",
  "recruitment.cta_text": "Join Interest Form",
  "recruitment.interest_form_url": "#",
};

type Fields = typeof DEFAULTS;

function AdminRecruitmentContent() {
  const [fields, setFields] = useState<Fields>({ ...DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    fetch(`/api/content?ns=${NS}`)
      .then((r) => r.json())
      .then((data: Partial<Fields>) => setFields((f) => ({ ...f, ...data })))
      .catch(() => {});
  }, []);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="bg-[#1a0303] px-8 md:px-16 py-10 pt-24">
        <Link to="/admin" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Admin
        </Link>
        <h1 className="text-white font-normal" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
          Recruitment Page
        </h1>
        <p className="text-white/40 text-sm mt-2">Edit the recruitment body text and the interest form link.</p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">

        <Section title="Copy">
          <Field label="Body text">
            <textarea value={fields["recruitment.body"]} onChange={set("recruitment.body")} rows={4} className={textareaCls} />
          </Field>
          <Field label="CTA button text">
            <input type="text" value={fields["recruitment.cta_text"]} onChange={set("recruitment.cta_text")} className={inputCls} />
          </Field>
        </Section>

        <Section title="Interest Form Link">
          <Field
            label="Interest form URL"
            hint="Paste the full Google Form or Typeform URL (https://…). This is the link the CTA button points to."
          >
            <input
              type="url"
              value={fields["recruitment.interest_form_url"]}
              onChange={set("recruitment.interest_form_url")}
              placeholder="https://forms.gle/…"
              className={inputCls}
            />
          </Field>
          {fields["recruitment.interest_form_url"] && fields["recruitment.interest_form_url"] !== "#" && (
            <a
              href={fields["recruitment.interest_form_url"]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#7A0C0C] underline underline-offset-2"
            >
              Preview link ↗
            </a>
          )}
        </Section>

        <SaveBar saving={saving} status={status} onSave={handleSave} />
      </div>
    </div>
  );
}

export default function AdminRecruitment() {
  return (
    <LoginGate requireAdmin>
      <AdminRecruitmentContent />
    </LoginGate>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
      <h2 className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-6">{title}</h2>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400 -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

function SaveBar({ saving, status, onSave }: { saving: boolean; status: "idle" | "ok" | "error"; onSave: () => void }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-8 py-3 bg-[#7A0C0C] text-white text-sm font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors disabled:opacity-60"
      >
        <Save size={15} />
        {saving ? "Saving…" : "Save Changes"}
      </button>
      {status === "ok" && (
        <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
          <CheckCircle size={15} /> Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
          <AlertCircle size={15} /> Failed to save
        </span>
      )}
    </div>
  );
}

const inputCls =
  "border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full";
const textareaCls =
  "border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full resize-none";
