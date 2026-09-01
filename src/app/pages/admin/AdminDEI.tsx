import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const NS = "dei";

const DEFAULTS = {
  "dei.intro_1":
    "In Phi Gamma Nu, as one of our four pillars, diversity, equity, and inclusion (DEI) is crucial because it enriches our community, fosters innovation, and promotes equality. When people from different backgrounds, cultures, and perspectives come together, it creates a tapestry of experiences and ideas that drive social progress. DEI enhances our community by celebrating the uniqueness of individuals. It recognizes that each person has a distinct set of qualities shaped by their race, ethnicity, gender, sexual orientation, religion, abilities, and more. Embracing this diversity allows us to appreciate and learn from different traditions, languages, customs, and perspectives, fostering a more inclusive and tolerant society.",
  "dei.intro_2":
    "DEI ensures that everyone has a voice, their perspectives are heard, and their contributions are valued, regardless of their background, which is why PGN hosts biweekly DEI roundtables in which our own members share information and facilitate discussions about important DEI topics. PGN also hosts celebrations of different cultural holidays throughout the school year that are for members to learn about different cultures, their histories, values, and unique practices. We believe that DEI should always be celebrated as we are driven to create a world that is more diverse, inclusive, and equitable for every one.",
  "dei.photo_0.label": "Lunar New Year Celebration",
  "dei.photo_0.image_url": "",
  "dei.photo_1.label": "Holi Celebration",
  "dei.photo_1.image_url": "",
};

type Fields = typeof DEFAULTS;

function AdminDEIContent() {
  const [fields, setFields] = useState<Fields>({ ...DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

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
    setErrMsg("");
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setStatus("ok");
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setErrMsg(body.error ?? `HTTP ${res.status}`);
        setStatus("error");
      }
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
          DEI &amp; Outreach Page
        </h1>
        <p className="text-white/40 text-sm mt-2">Edit the DEI text blocks and photo gallery captions and images.</p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">

        <Section title="What's DEI to PGN? — Text">
          <Field label="First paragraph">
            <textarea value={fields["dei.intro_1"]} onChange={set("dei.intro_1")} rows={6} className={textareaCls} />
          </Field>
          <Field label="Second paragraph">
            <textarea value={fields["dei.intro_2"]} onChange={set("dei.intro_2")} rows={6} className={textareaCls} />
          </Field>
        </Section>

        <Section title="Photo Gallery">
          {([0, 1] as const).map((i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Photo {i + 1}</p>
              <Field label="Caption label">
                <input
                  type="text"
                  value={fields[`dei.photo_${i}.label` as keyof Fields]}
                  onChange={set(`dei.photo_${i}.label` as keyof Fields)}
                  className={inputCls}
                />
              </Field>
              <Field label="Image URL" hint="Paste a direct image link (https://…). Leave blank to use the default gradient placeholder.">
                <input
                  type="url"
                  value={fields[`dei.photo_${i}.image_url` as keyof Fields]}
                  onChange={set(`dei.photo_${i}.image_url` as keyof Fields)}
                  placeholder="https://example.com/photo.jpg"
                  className={inputCls}
                />
                {fields[`dei.photo_${i}.image_url` as keyof Fields] && (
                  <img
                    src={fields[`dei.photo_${i}.image_url` as keyof Fields]}
                    alt="Preview"
                    className="mt-3 w-48 h-32 object-cover rounded-xl border border-gray-200"
                  />
                )}
              </Field>
            </div>
          ))}
        </Section>

        <SaveBar saving={saving} status={status} errMsg={errMsg} onSave={handleSave} />
      </div>
    </div>
  );
}

export default function AdminDEI() {
  return (
    <LoginGate requireAdmin>
      <AdminDEIContent />
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

function SaveBar({ saving, status, errMsg, onSave }: { saving: boolean; status: "idle" | "ok" | "error"; errMsg: string; onSave: () => void }) {
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
          <AlertCircle size={15} /> Failed to save{errMsg ? `: ${errMsg}` : ""}
        </span>
      )}
    </div>
  );
}

const inputCls =
  "border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full";
const textareaCls =
  "border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full resize-none";
