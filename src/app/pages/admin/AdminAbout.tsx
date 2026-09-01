import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const NS = "about";

const DEFAULTS = {
  "about.banner.image_url": "",
  "about.pgn.image_url": "",
  "about.pgn.overline": "About Us",
  "about.pgn.heading": "What's PGN?",
  "about.pgn.body":
    "PGN is a professional development organization that was founded in 1924. Since then, the organization has grown immensely, expanding to 20+ active chapters and drawing driven individuals from all majors and backgrounds to grow their professional and personal skills to better succeed in today's workplace and serve as tomorrow's leaders. Members dedicate themselves to PGN's three pillars: professionalism, philanthropy, and brotherhood. At the University of Michigan, PGN is an excellent way to meet other strongly motivated business-inclined students on campus. Members specialize in a variety of fields by combining their business interests with their areas of expertise such as finance, marketing, entrepreneurship, music performance, engineering, law and more.",
  "about.pillars.intro":
    "Phi Gamma Nu proudly upholds four National Pillars which represent the underlying ideals of the organization: Professionalism, Philanthropy, DEI, and Brotherhood. Through Professionalism, PGN seeks to develop responsible, capable, well-rounded, and qualified professionals. Through Philanthropy, PGN seeks to cultivate a spirit of compassion in the professional and personal lives of brothers. Through our DEI efforts, PGN seeks to create a diverse and welcoming community. Through Brotherhood, PGN seeks to nurture a sense of community among our members. These pillars are central to the events and activities organized by our chapter.",
  "about.pillar.professionalism.title": "Professionalism",
  "about.pillar.professionalism.content":
    "Many students are drawn to PGN for our emphasis on business and professionalism. We help students realize their full potential through ongoing career exploration and self-reflection, a mentorship program for professional development and guidance, academic support, and opportunities such as company visits, networking, workshops, and other learning experiences.",
  "about.pillar.philanthropy.title": "Philanthropy",
  "about.pillar.philanthropy.content":
    "PGN seeks to cultivate a spirit of compassion in the professional and personal lives of brothers. Our chapter participates in a variety of philanthropic events and activities throughout the year, giving back to the local Ann Arbor community and beyond.",
  "about.pillar.dei.title": "DEI",
  "about.pillar.dei.content":
    "Through our DEI efforts, PGN seeks to create a diverse and welcoming community. We believe that diversity of background, thought, and experience strengthens our brotherhood and better prepares us to lead in an increasingly interconnected and global world.",
  "about.pillar.brotherhood.title": "Brotherhood",
  "about.pillar.brotherhood.content":
    "PGN seeks to nurture a sense of community among our members. Brotherhood is at the heart of everything we do — from social events and retreats to mentorship and mutual support throughout our time at Michigan.",
};

type Fields = typeof DEFAULTS;

function AdminAboutContent() {
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
        credentials: "include",
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

  const PILLARS = ["professionalism", "philanthropy", "dei", "brotherhood"] as const;

  return (
    <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="bg-[#1a0303] px-8 md:px-16 py-10 pt-24">
        <Link to="/admin" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Admin
        </Link>
        <h1 className="text-white font-normal" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
          About Us Page
        </h1>
        <p className="text-white/40 text-sm mt-2">Edit the About Us banner, What's PGN section, and Four Pillars.</p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">

        <Section title="Banner">
          <ImageField
            label="Banner background image URL"
            value={fields["about.banner.image_url"]}
            onChange={set("about.banner.image_url")}
          />
        </Section>

        <Section title="What's PGN? Section">
          <ImageField
            label="Chapter photo URL"
            value={fields["about.pgn.image_url"]}
            onChange={set("about.pgn.image_url")}
          />
          <Field label="Overline label">
            <input type="text" value={fields["about.pgn.overline"]} onChange={set("about.pgn.overline")} className={inputCls} />
          </Field>
          <Field label="Section heading">
            <input type="text" value={fields["about.pgn.heading"]} onChange={set("about.pgn.heading")} className={inputCls} />
          </Field>
          <Field label="Body text">
            <textarea value={fields["about.pgn.body"]} onChange={set("about.pgn.body")} rows={6} className={textareaCls} />
          </Field>
        </Section>

        <Section title="Four Pillars — Intro">
          <Field label="Intro paragraph">
            <textarea value={fields["about.pillars.intro"]} onChange={set("about.pillars.intro")} rows={5} className={textareaCls} />
          </Field>
        </Section>

        <Section title="Four Pillars — Individual Entries">
          {PILLARS.map((p) => (
            <div key={p} className="border border-gray-100 rounded-xl p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{p}</p>
              <Field label="Title">
                <input
                  type="text"
                  value={fields[`about.pillar.${p}.title` as keyof Fields]}
                  onChange={set(`about.pillar.${p}.title` as keyof Fields)}
                  className={inputCls}
                />
              </Field>
              <Field label="Content">
                <textarea
                  value={fields[`about.pillar.${p}.content` as keyof Fields]}
                  onChange={set(`about.pillar.${p}.content` as keyof Fields)}
                  rows={4}
                  className={textareaCls}
                />
              </Field>
            </div>
          ))}
        </Section>

        <SaveBar saving={saving} status={status} onSave={handleSave} />
      </div>
    </div>
  );
}

export default function AdminAbout() {
  return (
    <LoginGate requireAdmin>
      <AdminAboutContent />
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
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Field label={label} hint="Paste a direct image link (https://…). Leave blank to use the default placeholder.">
      <input type="url" value={value} onChange={onChange} placeholder="https://example.com/photo.jpg" className={inputCls} />
      {value && (
        <img src={value} alt="Preview" className="mt-3 w-40 h-28 object-cover rounded-xl border border-gray-200" />
      )}
    </Field>
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
