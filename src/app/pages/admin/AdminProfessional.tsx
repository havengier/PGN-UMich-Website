import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const NS = "professional";

const DEFAULTS = {
  "professional.internship.hide_image": "false",
  "professional.internship_image_url": "",
  "professional.feature_0.body":
    "Every year, PGN organizes exclusive trips to major business hubs like Chicago and New York. These trips offer our members unparalleled opportunities to network with professionals across a wide array of industries. During these visits, we tour prestigious companies, gain insights into various business operations, and connect with alumni and industry leaders who share their experiences and offer guidance.",
  "professional.feature_1.body":
    "At PGN, we are committed to the continuous professional growth of our members. Our weekly professional development sessions are designed to equip our members with the essential skills needed in today's business world. From mastering LinkedIn to perfecting excel skills, these sessions cover a broad spectrum of business-related topics.",
  "professional.feature_2.body":
    "Our alumni network is one of PGN's greatest assets, with members successfully placed in a variety of fields and locations across the globe. Whether it's finance, consulting, tech, or entrepreneurship, our alumni have made their mark in nearly every industry.",
  "professional.testimonial_0.hide_photo": "false",
  "professional.testimonial_0.quote":
    "\u201cI always appreciate getting the opportunity to give back to the organization that gave me my family on campus. It's also great to stay connected with PGN brothers as we all find ourselves in new cities.\u201d",
  "professional.testimonial_0.name": "Kelvin Chang",
  "professional.testimonial_0.classYear": "Lambda Class",
  "professional.testimonial_0.photo_url": "",
  "professional.testimonial_1.hide_photo": "false",
  "professional.testimonial_1.quote":
    "\u201cI am consistently impressed by the ambition and professionalism of younger members and I love being part of the organization that empowers them to take the first few steps in their career.\u201d",
  "professional.testimonial_1.name": "Priyanka Tomar",
  "professional.testimonial_1.classYear": "Xi Class",
  "professional.testimonial_1.photo_url": "",
  "professional.testimonial_2.hide_photo": "false",
  "professional.testimonial_2.quote":
    "\u201cLeveraging connections from PGN to explore career paths and opportunities is what led me to where I am today. I express my gratitude for those who helped me by paying it forward to new members.\u201d",
  "professional.testimonial_2.name": "Josh Fontaine",
  "professional.testimonial_2.classYear": "Xi Class",
  "professional.testimonial_2.photo_url": "",
};

type Fields = typeof DEFAULTS;

function AdminProfessionalContent() {
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
          Professional Page
        </h1>
        <p className="text-white/40 text-sm mt-2">Edit the internship image, feature cards, and alumni testimonials.</p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">

        <Section title="Internship Summary Image">
          <ImageField
            label="Internship summary image URL"
            value={fields["professional.internship_image_url"]}
            onChange={set("professional.internship_image_url")}
            hideValue={fields["professional.internship.hide_image"]}
            onToggleHide={toggleHide("professional.internship.hide_image")}
          />
        </Section>

        <Section title="Feature Cards">
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Card {i + 1}</p>
              <Field label="Body text">
                <textarea
                  value={fields[`professional.feature_${i}.body` as keyof Fields]}
                  onChange={set(`professional.feature_${i}.body` as keyof Fields)}
                  rows={4}
                  className={textareaCls}
                />
              </Field>
            </div>
          ))}
        </Section>

        <Section title="Alumni Testimonials">
          {([0, 1, 2] as const).map((i) => {
            const hideKey = `professional.testimonial_${i}.hide_photo` as keyof Fields;
            const isHidden = fields[hideKey] === "true";

            return (
              <div key={i} className="border border-gray-100 rounded-xl p-5 space-y-4 bg-white shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Testimonial {i + 1}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Show Photo:</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!isHidden}
                      onClick={toggleHide(hideKey)}
                      className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        !isHidden ? "bg-[#7A0C0C]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          !isHidden ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <Field label="Photo URL">
                  <input
                    type="url"
                    value={fields[`professional.testimonial_${i}.photo_url` as keyof Fields]}
                    onChange={set(`professional.testimonial_${i}.photo_url` as keyof Fields)}
                    placeholder="https://example.com/photo.jpg"
                    className={inputCls}
                  />
                  {fields[`professional.testimonial_${i}.photo_url` as keyof Fields] && !isHidden && (
                    <img
                      src={fields[`professional.testimonial_${i}.photo_url` as keyof Fields]}
                      alt="Preview"
                      className="mt-2 w-16 h-16 rounded-full object-cover border border-gray-200"
                    />
                  )}
                </Field>
                <Field label="Quote">
                  <textarea
                    value={fields[`professional.testimonial_${i}.quote` as keyof Fields]}
                    onChange={set(`professional.testimonial_${i}.quote` as keyof Fields)}
                    rows={3}
                    className={textareaCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Name">
                    <input
                      type="text"
                      value={fields[`professional.testimonial_${i}.name` as keyof Fields]}
                      onChange={set(`professional.testimonial_${i}.name` as keyof Fields)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Class / Year">
                    <input
                      type="text"
                      value={fields[`professional.testimonial_${i}.classYear` as keyof Fields]}
                      onChange={set(`professional.testimonial_${i}.classYear` as keyof Fields)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            );
          })}
        </Section>

        <SaveBar saving={saving} status={status} errMsg={errMsg} onSave={handleSave} />
      </div>
    </div>
  );
}

export default function AdminProfessional() {
  return (
    <LoginGate requireAdmin>
      <AdminProfessionalContent />
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
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hideValue?: string;
  onToggleHide?: () => void;
}) {
  const isHidden = hideValue === "true";
  return (
    <div className="space-y-3">
      {onToggleHide && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
          <div>
            <p className="text-xs font-semibold text-gray-800">Display Internship Summary Image on Page</p>
            <p className="text-[11px] text-gray-500">
              {isHidden ? "Image banner is currently hidden completely on the public page." : "Image banner is visible on the public page."}
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
      <Field label={label} hint="Paste a direct image link (https://…). Leave blank to use the default image.">
        <input type="url" value={value} onChange={onChange} placeholder="https://example.com/image.jpg" className={inputCls} />
        {value && !isHidden && (
          <img src={value} alt="Preview" className="mt-3 w-48 h-28 object-cover rounded-xl border border-gray-200" />
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
