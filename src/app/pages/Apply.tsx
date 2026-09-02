import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  CheckCircle,
  ChevronDown,
  Lock,
  Instagram,
  Users,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

// ── Config types ──────────────────────────────────────────────────────────────
type FieldType = "text" | "email" | "tel" | "textarea" | "select" | "file";

type ConfigField = {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  hint?: string;
  options?: string[];
  required: boolean;
};

type ConfigSection = {
  id: string;
  label: string;
  fields: ConfigField[];
};

type ApplyConfig = {
  isOpen?: boolean;
  sections: ConfigSection[];
};

// ── Dynamic form components ───────────────────────────────────────────────────
function DynamicSelect({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
        {field.label}{field.required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full appearance-none border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors pr-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function DynamicTextarea({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
        {field.label}{field.required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      {field.hint && (
        <p className="text-xs text-gray-500 -mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{field.hint}</p>
      )}
      <textarea
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        rows={5}
        className="border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors resize-none"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
    </div>
  );
}

function DynamicInput({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
        {field.label}{field.required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      {field.hint && (
        <p className="text-xs text-gray-500 -mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{field.hint}</p>
      )}
      <input
        id={field.id}
        type={field.type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        className="border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
    </div>
  );
}

// ── Application Opening Soon Screen ──────────────────────────────────────────
function ApplicationOpeningSoon() {
  return (
    <motion.div
      className="bg-white rounded-3xl shadow-sm border border-stone-200/80 p-8 sm:p-14 text-center max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-[#7A0C0C] flex items-center justify-center mx-auto mb-6 shadow-sm">
        <Lock size={28} strokeWidth={1.75} />
      </div>

      <p
        className="text-[#7A0C0C] text-xs font-bold tracking-[0.25em] uppercase mb-3"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Recruitment Application
      </p>

      <h2
        className="text-3xl sm:text-4xl font-normal text-stone-900 mb-4 tracking-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Application Opening Soon
      </h2>

      <div className="h-0.5 w-16 bg-[#F5A623] mx-auto mb-6" />

      <p
        className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Applications for our upcoming recruitment cycle are currently closed and will be opening soon.
        Follow our Instagram or check back here for official announcements, rush dates, and timeline updates.
      </p>

      {/* Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="https://www.instagram.com/pgnuofm/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white text-xs font-bold tracking-widest uppercase rounded-full shadow-sm transition-colors"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <Instagram size={14} /> Follow @pgnuofm
        </a>
        <Link
          to="/members"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold tracking-widest uppercase rounded-full transition-colors border border-stone-200"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <Users size={14} /> Meet Our Members
        </Link>
      </div>
    </motion.div>
  );
}

const DEFAULT_FALLBACK_CONFIG: ApplyConfig = {
  isOpen: false,
  sections: [
    {
      id: "personal",
      label: "Personal Information",
      fields: [
        { id: "firstName", type: "text", label: "First Name", placeholder: "Jane", required: true },
        { id: "lastName", type: "text", label: "Last Name", placeholder: "Doe", required: true },
        { id: "email", type: "email", label: "University Email", placeholder: "jdoe@umich.edu", required: true },
        { id: "phone", type: "tel", label: "Phone Number", placeholder: "(555) 000-0000", required: false },
      ],
    },
    {
      id: "academic",
      label: "Academic Background",
      fields: [
        { id: "year", type: "select", label: "Year", options: ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"], required: true },
        { id: "major", type: "text", label: "Major", placeholder: "e.g. Business Administration", required: true },
        { id: "minor", type: "text", label: "Minor (if applicable)", placeholder: "e.g. Psychology", required: false },
        { id: "gpa", type: "text", label: "Cumulative GPA", placeholder: "e.g. 3.7", required: false },
      ],
    },
    {
      id: "shortAnswers",
      label: "Short Answers",
      fields: [
        { id: "whyPGN", type: "textarea", label: "Why do you want to join Phi Gamma Nu?", hint: "Tell us what drew you to PGN and what you hope to gain from membership. (150–300 words)", placeholder: "I am drawn to PGN because...", required: true },
        { id: "strengths", type: "textarea", label: "What unique strengths would you bring to PGN?", hint: "Highlight specific skills, experiences, or perspectives. (150–300 words)", placeholder: "One strength I would bring is...", required: true },
        { id: "involvement", type: "textarea", label: "Describe your previous involvement in campus or professional organizations.", hint: "Include clubs, internships, research, volunteer work, or leadership roles.", placeholder: "I have been involved in...", required: false },
      ],
    },
    {
      id: "resumeAdditional",
      label: "Resume & Additional Information",
      fields: [
        { id: "resume", type: "file", label: "Upload Resume", required: false },
        { id: "questions", type: "textarea", label: "Any questions or additional comments?", placeholder: "Feel free to share anything else you would like us to know.", required: false },
      ],
    },
  ],
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Apply() {
  const [config, setConfig] = useState<ApplyConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/apply-config")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data: ApplyConfig) => {
        setConfig(data);
        const defaults: Record<string, string> = {};
        data.sections?.forEach((section) => {
          section.fields.forEach((field) => {
            defaults[field.id] = "";
          });
        });
        setFormData(defaults);
      })
      .catch(() => {
        setConfig(DEFAULT_FALLBACK_CONFIG);
      });
  }, []);

  function getValue(id: string): string {
    return formData[id] ?? "";
  }

  function setValue(id: string, value: string) {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Record<string, string> = { ...formData };

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to submit application. Please try again.");
        return;
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isLocked = config !== null && config.isOpen === false;

  return (
    <>
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="relative w-full h-[52vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 60%, #78350f 0%, transparent 50%), radial-gradient(ellipse at 70% 25%, #292524 0%, transparent 55%)",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex items-end px-16 pb-12 pt-20">
          <div>
            <motion.p
              className="text-[#F5A623] text-xs font-bold tracking-[0.25em] uppercase mb-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              Fall 2026 Rush
            </motion.p>
            <motion.h1
              className="text-white font-normal leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.8rem, 6.5vw, 5rem)" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.08 }}
            >
              Apply to PGN
            </motion.h1>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#FAFAF9] min-h-screen py-20 px-6">
        <div className="max-w-3xl mx-auto">
          {config === null ? (
            <div className="flex justify-center py-24">
              <div className="w-6 h-6 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin" />
            </div>
          ) : isLocked ? (
            /* ── Application Locked / Opening Soon Screen ── */
            <ApplicationOpeningSoon />
          ) : submitted ? (
            <motion.div
              className="flex flex-col items-center text-center py-24"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle size={64} className="text-[#7A0C0C] mb-6" strokeWidth={1.5} />
              <h2
                className="text-4xl font-normal text-gray-900 mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Application Submitted
              </h2>
              <p className="text-gray-600 text-base max-w-md leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Thank you, {getValue("firstName") || "applicant"}! We have received your application and will be in touch via email. We look forward to meeting you.
              </p>
              <div className="mt-8 h-px w-24 bg-[#F5A623]" />
              <p className="mt-8 text-sm text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                Questions? Reach us at{" "}
                <a href="mailto:pgnmichigan@gmail.com" className="text-[#7A0C0C] underline underline-offset-2">
                  pgnmichigan@gmail.com
                </a>
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <h2
                  className="text-3xl font-normal text-gray-900 mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Join Our Brotherhood
                </h2>
                <p className="text-gray-600 leading-relaxed text-[0.95rem]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  We are looking for driven individuals who are committed to professionalism, integrity, and making
                  a lasting impact. Complete the form below to begin your application for Fall 2026 recruitment.
                  Fields marked with <span className="text-[#7A0C0C] font-semibold">*</span> are required.
                </p>
              </motion.div>

              <motion.form
                onSubmit={handleSubmit}
                className="space-y-10"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {config.sections.map((section) => (
                  <section key={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h3
                      className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-6"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {section.label}
                    </h3>
                    <div className={`grid gap-5 ${section.fields.some((f) => f.type === "textarea" || f.type === "file") ? "" : "sm:grid-cols-2"}`}>
                      {section.fields.map((field) => {
                        if (field.type === "select") {
                          return (
                            <DynamicSelect
                              key={field.id}
                              field={field}
                              value={getValue(field.id)}
                              onChange={(v) => setValue(field.id, v)}
                            />
                          );
                        }
                        if (field.type === "textarea") {
                          return (
                            <div key={field.id} className="sm:col-span-2">
                              <DynamicTextarea
                                field={field}
                                value={getValue(field.id)}
                                onChange={(v) => setValue(field.id, v)}
                              />
                            </div>
                          );
                        }
                        if (field.type === "file") {
                          return (
                            <div key={field.id} className="flex flex-col gap-1.5 sm:col-span-2">
                              <label className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {field.label} <span className="text-gray-400 font-normal">(PDF, max 5 MB)</span>
                              </label>
                              <label className="flex items-center gap-4 border-2 border-dashed border-gray-200 rounded-xl px-6 py-5 cursor-pointer hover:border-[#7A0C0C]/40 transition-colors group">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {resumeFile ? resumeFile.name : "Click to upload or drag and drop"}
                                  </p>
                                </div>
                                <span className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-gray-50">Browse</span>
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                                />
                              </label>
                            </div>
                          );
                        }
                        return (
                          <DynamicInput
                            key={field.id}
                            field={field}
                            value={getValue(field.id)}
                            onChange={(v) => setValue(field.id, v)}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}

                {error && (
                  <p className="text-sm text-red-600 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {error}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                    By submitting this form you confirm that all information provided is accurate. We will contact you at the email address provided.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-3.5 bg-[#7A0C0C] text-white text-sm font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors duration-200 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {loading ? "Submitting…" : "Submit Application"}
                  </button>
                </div>
              </motion.form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
