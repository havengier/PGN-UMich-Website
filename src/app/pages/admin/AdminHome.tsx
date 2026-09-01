import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const NS = "home";

const DEFAULTS = {
  "home.president.image_url": "",
  "home.president.yellow_text": "Welcome to PGN at the University of Michigan!",
  "home.president.heading": "President's Welcome",
  "home.president.body_1":
    "On behalf of the brotherhood, it is my pleasure to welcome you to Phi Gamma Nu at the University of Michigan. Thank you for taking the time to learn more about our organization, our values, and our people.",
  "home.president.body_2":
    "PGN is one of the largest professional business fraternities in the United States, with a rich history dating back to 1927. Our Delta Phi chapter here at Michigan is proud to uphold these traditions while forging new paths as future business leaders.",
};

type Fields = typeof DEFAULTS;

function AdminHomeContent() {
  const [fields, setFields] = useState<Fields>({ ...DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    fetch(`/api/content?ns=${NS}`)
      .then((r) => r.json())
      .then((data: Partial<Fields>) => {
        setFields((prev) => ({ ...prev, ...data }));
      })
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
      {/* Header */}
      <div className="bg-[#1a0303] px-8 md:px-16 py-10 pt-24">
        <Link to="/admin" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Admin
        </Link>
        <h1 className="text-white font-normal" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
          Home Page
        </h1>
        <p className="text-white/40 text-sm mt-2">Edit the President's Welcome section.</p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">

        {/* President's Welcome */}
        <Section title="President's Welcome">
          <Field label="President Photo URL" hint="Paste a direct image link (https://…). Leave blank to use the default placeholder.">
            <input
              type="url"
              value={fields["home.president.image_url"]}
              onChange={set("home.president.image_url")}
              placeholder="https://example.com/president.jpg"
              className={inputCls}
            />
            {fields["home.president.image_url"] && (
              <img
                src={fields["home.president.image_url"]}
                alt="Preview"
                className="mt-3 w-28 h-36 object-cover rounded-xl border border-gray-200"
              />
            )}
          </Field>
          <Field label="Yellow caption text (above photo)">
            <input
              type="text"
              value={fields["home.president.yellow_text"]}
              onChange={set("home.president.yellow_text")}
              className={inputCls}
            />
          </Field>
          <Field label="Section heading">
            <input
              type="text"
              value={fields["home.president.heading"]}
              onChange={set("home.president.heading")}
              className={inputCls}
            />
          </Field>
          <Field label="Body paragraph 1">
            <textarea
              value={fields["home.president.body_1"]}
              onChange={set("home.president.body_1")}
              rows={4}
              className={textareaCls}
            />
          </Field>
          <Field label="Body paragraph 2">
            <textarea
              value={fields["home.president.body_2"]}
              onChange={set("home.president.body_2")}
              rows={4}
              className={textareaCls}
            />
          </Field>
        </Section>

        <SaveBar saving={saving} status={status} onSave={handleSave} />
      </div>
    </div>
  );
}

export default function AdminHome() {
  return (
    <LoginGate requireAdmin>
      <AdminHomeContent />
    </LoginGate>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

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
