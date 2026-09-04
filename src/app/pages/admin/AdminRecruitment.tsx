import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const NS = "recruitment";

const DEFAULTS = {
  "recruitment.banner.hide_image": "false",
  "recruitment.banner.image_url": "",
  "recruitment.side_image.hide_image": "false",
  "recruitment.side_image.image_url": "",
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
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    fetch(`/api/content?ns=${NS}`)
      .then((r) => r.json())
      .then((data: Partial<Fields>) => setFields((f) => ({ ...f, ...data })))
      .catch(() => {});
  }, []);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const toggleHide = (key: keyof Fields) => () =>
    setFields((f) => ({ ...f, [key]: f[key] === "true" ? "false" : "true" }));

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
        const body = (await res.json().catch(() => ({}))) as { error?: string };
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
          Recruitment Page
        </h1>
        <p className="text-white/40 text-sm mt-2">Edit the hero banner, side photo, recruitment body text, and interest form link.</p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">
        <Section title="Hero Banner">
          <ImageField
            label="Banner background image URL"
            value={fields["recruitment.banner.image_url"]}
            onChange={set("recruitment.banner.image_url")}
            hideValue={fields["recruitment.banner.hide_image"]}
            onToggleHide={toggleHide("recruitment.banner.hide_image")}
            hint="Paste a direct image link (https://…). Leave blank to use the default gradient banner."
          />
        </Section>

        <Section title="Side Photo">
          <ImageField
            label="Side photo URL"
            value={fields["recruitment.side_image.image_url"]}
            onChange={set("recruitment.side_image.image_url")}
            hideValue={fields["recruitment.side_image.hide_image"]}
            onToggleHide={toggleHide("recruitment.side_image.hide_image")}
            hint="Displays to the right of the logo, text, and button. Leave blank for placeholder or toggle off to hide."
          />
        </Section>

        <Section title="Recruitment Copy">
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

        <SaveBar saving={saving} status={status} errMsg={errMsg} onSave={handleSave} />
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

function ImageField({
  label,
  value,
  onChange,
  hideValue = "false",
  onToggleHide,
  hint = "Paste a direct image link (https://…). Leave blank to use default.",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hideValue?: string;
  onToggleHide?: () => void;
  hint?: string;
}) {
  const isHidden = hideValue === "true";
  return (
    <div className="space-y-3">
      {onToggleHide && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
          <div>
            <p className="text-xs font-semibold text-gray-800">Display on Page</p>
            <p className="text-[11px] text-gray-500">
              {isHidden ? "Hidden completely on the public page." : "Visible on the public page."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!isHidden}
            onClick={onToggleHide}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              !isHidden ? "bg-[#7A0C0C]" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                !isHidden ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}
      <Field label={label} hint={hint}>
        <input type="url" value={value} onChange={onChange} placeholder="https://example.com/photo.jpg" className={inputCls} />
        {value && !isHidden && (
          <img src={value} alt="Preview" className="mt-3 w-48 h-32 object-cover rounded-xl border border-gray-200" />
        )}
      </Field>
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

