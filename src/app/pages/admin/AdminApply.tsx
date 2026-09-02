import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  GripVertical,
  Lock,
  Unlock,
} from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

type FieldType = "text" | "email" | "tel" | "textarea" | "select" | "file";

type ConfigField = {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  hint?: string;
  options?: string[];
  required: boolean;
  core?: boolean;
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

function newFieldId() {
  return `custom_${Date.now()}`;
}

function newSectionId() {
  return `section_${Date.now()}`;
}

const DEFAULT_FALLBACK_CONFIG: ApplyConfig = {
  isOpen: false,
  sections: [
    {
      id: "personal",
      label: "Personal Information",
      fields: [
        { id: "firstName", type: "text", label: "First Name", placeholder: "Jane", required: true, core: true },
        { id: "lastName", type: "text", label: "Last Name", placeholder: "Doe", required: true, core: true },
        { id: "email", type: "email", label: "University Email", placeholder: "jdoe@umich.edu", required: true, core: true },
        { id: "phone", type: "tel", label: "Phone Number", placeholder: "(555) 000-0000", required: false, core: false },
      ],
    },
    {
      id: "academic",
      label: "Academic Background",
      fields: [
        { id: "year", type: "select", label: "Year", options: ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"], required: true, core: true },
        { id: "major", type: "text", label: "Major", placeholder: "e.g. Business Administration", required: true, core: true },
        { id: "minor", type: "text", label: "Minor (if applicable)", placeholder: "e.g. Psychology", required: false, core: false },
        { id: "gpa", type: "text", label: "Cumulative GPA", placeholder: "e.g. 3.7", required: false, core: false },
      ],
    },
    {
      id: "shortAnswers",
      label: "Short Answers",
      fields: [
        { id: "whyPGN", type: "textarea", label: "Why do you want to join Phi Gamma Nu?", hint: "Tell us what drew you to PGN and what you hope to gain from membership. (150–300 words)", placeholder: "I am drawn to PGN because...", required: true, core: true },
        { id: "strengths", type: "textarea", label: "What unique strengths would you bring to PGN?", hint: "Highlight specific skills, experiences, or perspectives. (150–300 words)", placeholder: "One strength I would bring is...", required: true, core: true },
        { id: "involvement", type: "textarea", label: "Describe your previous involvement in campus or professional organizations.", hint: "Include clubs, internships, research, volunteer work, or leadership roles.", placeholder: "I have been involved in...", required: false, core: false },
      ],
    },
    {
      id: "resumeAdditional",
      label: "Resume & Additional Information",
      fields: [
        { id: "resume", type: "file", label: "Upload Resume", required: false, core: false },
        { id: "questions", type: "textarea", label: "Any questions or additional comments?", placeholder: "Feel free to share anything else you would like us to know.", required: false, core: false },
      ],
    },
  ],
};

function AdminApplyContent() {
  const [config, setConfig] = useState<ApplyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    fetch("/api/apply-config")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data: ApplyConfig) => setConfig(data))
      .catch(() => setConfig(DEFAULT_FALLBACK_CONFIG))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(overrideConfig?: ApplyConfig) {
    const toSave = overrideConfig || config;
    if (!toSave) return;
    setSaving(true);
    setStatus("idle");
    setErrMsg("");
    try {
      const res = await fetch("/api/apply-config", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
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

  async function toggleApplicationOpen() {
    if (!config) return;
    const currentOpen = config.isOpen !== false;
    const nextOpen = !currentOpen;
    const updatedConfig: ApplyConfig = { ...config, isOpen: nextOpen };
    setConfig(updatedConfig);
    await handleSave(updatedConfig);
  }

  function updateSectionLabel(sectionId: string, label: string) {
    setConfig((c) => c && ({
      ...c,
      sections: c.sections.map((s) => (s.id === sectionId ? { ...s, label } : s)),
    }));
  }

  function deleteSection(sectionId: string) {
    if (!confirm("Delete this section and all its fields?")) return;
    setConfig((c) => c && ({
      ...c,
      sections: c.sections.filter((s) => s.id !== sectionId),
    }));
  }

  function addSection() {
    setConfig((c) => c && ({
      ...c,
      sections: [...c.sections, { id: newSectionId(), label: "New Section", fields: [] }],
    }));
  }

  function updateField(sectionId: string, fieldId: string, patch: Partial<ConfigField>) {
    setConfig((c) => c && ({
      ...c,
      sections: c.sections.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
            }
      ),
    }));
  }

  function deleteField(sectionId: string, fieldId: string) {
    setConfig((c) => c && ({
      ...c,
      sections: c.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
      ),
    }));
  }

  function addField(sectionId: string) {
    const newField: ConfigField = {
      id: newFieldId(),
      type: "text",
      label: "New Question",
      required: false,
    };
    setConfig((c) => c && ({
      ...c,
      sections: c.sections.map((s) =>
        s.id !== sectionId ? s : { ...s, fields: [...s.fields, newField] }
      ),
    }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="bg-[#1a0303] px-8 md:px-16 py-10 pt-24">
        <Link to="/admin" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Admin
        </Link>
        <h1 className="text-white font-normal" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
          Apply Page
        </h1>
        <p className="text-white/40 text-sm mt-2">
          Lock or open application submissions, and customize questions, sections, and requirements.
        </p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">
        {/* Application Lock Toggle Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                config?.isOpen !== false
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-[#7A0C0C]"
              }`}
            >
              {config?.isOpen !== false ? <Unlock size={22} /> : <Lock size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">
                  Application Submissions
                </h3>
                {config?.isOpen !== false ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                    Accepting Applications
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#7A0C0C] text-white px-2.5 py-0.5 rounded-full">
                    Locked (Opening Soon)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {config?.isOpen !== false
                  ? "Applications are currently open. Prospective applicants can fill out and submit the form."
                  : "Applications are currently locked. Public visitors see the 'Application Opening Soon' screen and submissions are blocked."}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={config?.isOpen !== false}
            onClick={toggleApplicationOpen}
            disabled={saving}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7A0C0C] focus:ring-offset-2 ${
              config?.isOpen !== false ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                config?.isOpen !== false ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Section List */}
        {config?.sections.map((section) => (
          <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
              <input
                type="text"
                value={section.label}
                onChange={(e) => updateSectionLabel(section.id, e.target.value)}
                className="flex-1 text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#7A0C0C] outline-none py-0.5 transition-colors"
              />
              <button
                onClick={() => deleteSection(section.id)}
                className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                title="Delete section"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {section.fields.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  onChange={(patch) => updateField(section.id, field.id, patch)}
                  onDelete={() => deleteField(section.id, field.id)}
                />
              ))}
            </div>

            {/* Add field button */}
            <button
              onClick={() => addField(section.id)}
              className="mt-5 flex items-center gap-2 text-xs text-[#7A0C0C] font-semibold hover:text-[#5C0A0A] transition-colors"
            >
              <Plus size={13} /> Add Question
            </button>
          </div>
        ))}

        {/* Add section button */}
        <button
          onClick={addSection}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-[#7A0C0C] hover:border-[#7A0C0C]/40 transition-colors flex items-center justify-center gap-2 mb-8"
        >
          <Plus size={14} /> Add Section
        </button>

        {/* Save Bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-[#7A0C0C] text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save Form Changes"}
          </button>

          {status === "ok" && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle size={14} /> Saved successfully
            </span>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <AlertCircle size={14} /> {errMsg || "Failed to save"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  onChange,
  onDelete,
}: {
  field: ConfigField;
  onChange: (patch: Partial<ConfigField>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-[#FAFAF9]/60 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Label */}
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Question / Label"
          className="flex-1 text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#7A0C0C]"
        />

        {/* Type select */}
        <select
          value={field.type}
          onChange={(e) => onChange({ type: e.target.value as FieldType })}
          disabled={field.core}
          className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 outline-none focus:border-[#7A0C0C] disabled:opacity-50"
        >
          <option value="text">Short Text</option>
          <option value="textarea">Long Text</option>
          <option value="email">Email</option>
          <option value="tel">Phone</option>
          <option value="select">Dropdown</option>
          <option value="file">File Upload</option>
        </select>

        {/* Required toggle */}
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ required: e.target.checked })}
            disabled={field.core && field.required}
            className="accent-[#7A0C0C]"
          />
          Required
        </label>

        {/* Delete */}
        {!field.core && (
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            title="Delete field"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Placeholder / hint row for text & textarea */}
      {(field.type === "text" || field.type === "textarea" || field.type === "email" || field.type === "tel") && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={field.placeholder ?? ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Placeholder text…"
            className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-[#7A0C0C]"
          />
          <input
            type="text"
            value={field.hint ?? ""}
            onChange={(e) => onChange({ hint: e.target.value })}
            placeholder="Helper hint (optional)…"
            className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-[#7A0C0C]"
          />
        </div>
      )}

      {/* Options row for select */}
      {field.type === "select" && (
        <input
          type="text"
          value={(field.options ?? []).join(", ")}
          onChange={(e) =>
            onChange({ options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="Comma-separated options (e.g. Option 1, Option 2, Option 3)"
          className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-[#7A0C0C]"
        />
      )}
    </div>
  );
}

export default function AdminApply() {
  return (
    <LoginGate requireAdmin>
      <AdminApplyContent />
    </LoginGate>
  );
}
