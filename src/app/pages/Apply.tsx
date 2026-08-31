import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, ChevronDown } from "lucide-react";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  year: string;
  major: string;
  minor: string;
  gpa: string;
  whyPGN: string;
  strengths: string;
  involvement: string;
  questions: string;
  resume: File | null;
};

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"];

const REQUIRED_FIELDS: (keyof FormData)[] = [
  "firstName", "lastName", "email", "year", "major", "whyPGN", "strengths",
];

function Select({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
        {label}{required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full appearance-none border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors pr-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
        {label}{required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      <input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
    </div>
  );
}

function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  hint,
  rows = 5,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
        {label}{required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      {hint && (
        <p className="text-xs text-gray-500 -mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{hint}</p>
      )}
      <textarea
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors resize-none"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
    </div>
  );
}

const EMPTY: FormData = {
  firstName: "", lastName: "", email: "", phone: "",
  year: "", major: "", minor: "", gpa: "",
  whyPGN: "", strengths: "", involvement: "", questions: "",
  resume: null,
};

export default function Apply() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormData) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing = REQUIRED_FIELDS.filter((k) => !form[k]);
    if (missing.length) {
      setError("Please fill in all required fields before submitting.");
      return;
    }
    setError("");
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

          {submitted ? (
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
                Thank you, {form.firstName}! We have received your application and will be in touch via email. We look forward to meeting you.
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
              {/* Intro */}
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
                {/* ── Section: Personal Info ────────────────────────────── */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h3
                    className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-6"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="First Name" name="firstName" value={form.firstName} onChange={set("firstName")} placeholder="Jane" required />
                    <Field label="Last Name" name="lastName" value={form.lastName} onChange={set("lastName")} placeholder="Doe" required />
                    <Field label="University Email" name="email" value={form.email} onChange={set("email")} type="email" placeholder="jdoe@umich.edu" required />
                    <Field label="Phone Number" name="phone" value={form.phone} onChange={set("phone")} type="tel" placeholder="(555) 000-0000" />
                  </div>
                </section>

                {/* ── Section: Academic Background ─────────────────────── */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h3
                    className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-6"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Academic Background
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Select label="Year" value={form.year} options={YEARS} onChange={set("year")} required />
                    <Field label="Major" name="major" value={form.major} onChange={set("major")} placeholder="e.g. Business Administration" required />
                    <Field label="Minor (if applicable)" name="minor" value={form.minor} onChange={set("minor")} placeholder="e.g. Psychology" />
                    <Field label="Cumulative GPA" name="gpa" value={form.gpa} onChange={set("gpa")} placeholder="e.g. 3.7" />
                  </div>
                </section>

                {/* ── Section: Short Answers ────────────────────────────── */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h3
                    className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-6"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Short Answers
                  </h3>
                  <div className="space-y-6">
                    <Textarea
                      label="Why do you want to join Phi Gamma Nu?"
                      name="whyPGN"
                      value={form.whyPGN}
                      onChange={set("whyPGN")}
                      hint="Tell us what drew you to PGN and what you hope to gain from membership. (150–300 words)"
                      placeholder="I am drawn to PGN because..."
                      required
                    />
                    <Textarea
                      label="What unique strengths would you bring to PGN?"
                      name="strengths"
                      value={form.strengths}
                      onChange={set("strengths")}
                      hint="Highlight specific skills, experiences, or perspectives. (150–300 words)"
                      placeholder="One strength I would bring is..."
                      required
                    />
                    <Textarea
                      label="Describe your previous involvement in campus or professional organizations."
                      name="involvement"
                      value={form.involvement}
                      onChange={set("involvement")}
                      hint="Include clubs, internships, research, volunteer work, or leadership roles."
                      placeholder="I have been involved in..."
                      rows={4}
                    />
                  </div>
                </section>

                {/* ── Section: Resume + Additional ─────────────────────── */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h3
                    className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-6"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Resume & Additional Information
                  </h3>
                  <div className="space-y-6">
                    {/* Resume upload */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Upload Resume <span className="text-gray-400 font-normal">(PDF, max 5 MB)</span>
                      </label>
                      <label className="flex items-center gap-4 border-2 border-dashed border-gray-200 rounded-xl px-6 py-5 cursor-pointer hover:border-[#7A0C0C]/40 transition-colors group">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {form.resume ? form.resume.name : "Click to upload or drag and drop"}
                          </p>
                        </div>
                        <span
                          className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-gray-50 group-hover:border-[#7A0C0C]/40 transition-colors"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          Browse
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            setForm((prev) => ({ ...prev, resume: f }));
                          }}
                        />
                      </label>
                    </div>

                    <Textarea
                      label="Any questions or additional comments?"
                      name="questions"
                      value={form.questions}
                      onChange={set("questions")}
                      placeholder="Feel free to share anything else you would like us to know."
                      rows={3}
                    />
                  </div>
                </section>

                {/* ── Error + Submit ────────────────────────────────────── */}
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
                    className="px-10 py-3.5 bg-[#7A0C0C] text-white text-sm font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors duration-200 whitespace-nowrap"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Submit Application
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
