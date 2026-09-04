import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle, Plus, Trash2, Calendar, MapPin, Image as ImageIcon } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const NS = "recruitment";

export type RecruitmentEvent = {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  imageUrl?: string;
};

const DEFAULT_EVENTS: RecruitmentEvent[] = [
  {
    id: "1",
    title: "Mass Meeting 1",
    date: "2026-09-08T18:00",
    description: "Introduction to Phi Gamma Nu, our four pillars, culture, and what sets our brotherhood apart. Open to all majors and years.",
    location: "Ross School of Business, R0220",
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    title: "Mass Meeting 2",
    date: "2026-09-10T19:00",
    description: "Learn more about the recruitment process, speed networking with brothers, and an interactive Q&A session.",
    location: "Michigan Union, Rogel Ballroom",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    title: "Meet the Chapter",
    date: "2026-09-12T17:30",
    description: "Casual mixer to connect with brothers one-on-one and discover how PGN has shaped their college career.",
    location: "Ross Winter Garden",
    imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "4",
    title: "DEI & Professional Workshop",
    date: "2026-09-15T18:30",
    description: "Interactive resume and case workshop demonstrating our commitment to professional growth and inclusion.",
    location: "Ross School of Business, R1240",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  },
];

const DEFAULTS = {
  "recruitment.banner.hide_image": "false",
  "recruitment.banner.image_url": "",
  "recruitment.side_image.hide_image": "false",
  "recruitment.side_image.image_url": "",
  "recruitment.body":
    "Fall 2026 recruitment is coming soon. Sign up to stay in the loop on events and applications.",
  "recruitment.cta_text": "Join Interest Form",
  "recruitment.interest_form_url": "#",
  "recruitment.events.subtitle": "Recruitment Schedule",
  "recruitment.events.heading": "Upcoming Events",
  "recruitment.events": JSON.stringify(DEFAULT_EVENTS),
};

type Fields = typeof DEFAULTS;

function AdminRecruitmentContent() {
  const [fields, setFields] = useState<Fields>({ ...DEFAULTS });
  const [events, setEvents] = useState<RecruitmentEvent[]>(DEFAULT_EVENTS);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    fetch(`/api/content?ns=${NS}`)
      .then((r) => r.json())
      .then((data: Partial<Fields>) => {
        setFields((f) => ({ ...f, ...data }));
        if (data["recruitment.events"]) {
          try {
            const parsed = JSON.parse(data["recruitment.events"]);
            if (Array.isArray(parsed)) {
              setEvents(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const toggleHide = (key: keyof Fields) => () =>
    setFields((f) => ({ ...f, [key]: f[key] === "true" ? "false" : "true" }));

  function updateEvent(index: number, patch: Partial<RecruitmentEvent>) {
    const updated = events.map((ev, i) => (i === index ? { ...ev, ...patch } : ev));
    setEvents(updated);
    setFields((f) => ({ ...f, "recruitment.events": JSON.stringify(updated) }));
  }

  function addEvent() {
    const newEv: RecruitmentEvent = {
      id: Date.now().toString(),
      title: "New Event",
      date: new Date().toISOString().slice(0, 16),
      description: "Description of the recruitment event.",
      location: "Ross School of Business",
      imageUrl: "",
    };
    const updated = [...events, newEv];
    setEvents(updated);
    setFields((f) => ({ ...f, "recruitment.events": JSON.stringify(updated) }));
  }

  function removeEvent(index: number) {
    const updated = events.filter((_, i) => i !== index);
    setEvents(updated);
    setFields((f) => ({ ...f, "recruitment.events": JSON.stringify(updated) }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    setErrMsg("");
    try {
      const payload = {
        ...fields,
        "recruitment.events": JSON.stringify(events),
      };

      const res = await fetch("/api/content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        <p className="text-white/40 text-sm mt-2">Edit hero banner, side photo, copy, interest form link, and upcoming recruitment events.</p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl space-y-6">
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

        {/* ── Upcoming Events Section ── */}
        <Section title="Upcoming Events Cards">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
            <Field label="Subtitle label">
              <input
                type="text"
                value={fields["recruitment.events.subtitle"]}
                onChange={set("recruitment.events.subtitle")}
                className={inputCls}
              />
            </Field>
            <Field label="Section heading">
              <input
                type="text"
                value={fields["recruitment.events.heading"]}
                onChange={set("recruitment.events.heading")}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Events List ({events.length})</p>
              <button
                type="button"
                onClick={addEvent}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7A0C0C]/10 text-[#7A0C0C] hover:bg-[#7A0C0C] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Event
              </button>
            </div>

            {events.map((ev, i) => (
              <div
                key={ev.id || i}
                className="border border-gray-200 rounded-xl p-5 bg-stone-50/50 space-y-4 relative group"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Event #{i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEvent(i)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Delete Event"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Event Title">
                    <input
                      type="text"
                      value={ev.title}
                      onChange={(e) => updateEvent(i, { title: e.target.value })}
                      placeholder="e.g. Mass Meeting 1"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Date & Time" hint="Format: YYYY-MM-DDTHH:mm or ISO date">
                    <input
                      type="datetime-local"
                      value={ev.date ? ev.date.slice(0, 16) : ""}
                      onChange={(e) => updateEvent(i, { date: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field label="Location">
                  <input
                    type="text"
                    value={ev.location}
                    onChange={(e) => updateEvent(i, { location: e.target.value })}
                    placeholder="e.g. Ross School of Business, R0220"
                    className={inputCls}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={ev.description}
                    onChange={(e) => updateEvent(i, { description: e.target.value })}
                    rows={3}
                    placeholder="Short description of this event..."
                    className={textareaCls}
                  />
                </Field>

                <Field
                  label="Faded Background Image URL"
                  hint="Paste a high-res photo link (https://…). It will be displayed faintly in the card background."
                >
                  <input
                    type="url"
                    value={ev.imageUrl || ""}
                    onChange={(e) => updateEvent(i, { imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className={inputCls}
                  />
                  {ev.imageUrl && (
                    <div className="mt-2 relative w-48 h-24 rounded-lg overflow-hidden border border-gray-200">
                      <img src={ev.imageUrl} alt="Event Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[11px] font-medium">
                        Faded Card Preview
                      </div>
                    </div>
                  )}
                </Field>
              </div>
            ))}

            {events.length === 0 && (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl bg-white">
                <p className="text-xs text-gray-500 mb-3">No events currently added.</p>
                <button
                  type="button"
                  onClick={addEvent}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#7A0C0C] text-white text-xs font-semibold"
                >
                  <Plus size={14} /> Add First Event
                </button>
              </div>
            )}
          </div>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
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
        className="flex items-center gap-2 px-8 py-3 bg-[#7A0C0C] text-white text-sm font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors disabled:opacity-60 cursor-pointer"
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


