import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Save, CheckCircle, AlertCircle, Plus, Trash2, GripVertical } from "lucide-react";
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
  sections: ConfigSection[];
};

function newFieldId() {
  return `custom_${Date.now()}`;
}

function newSectionId() {
  return `section_${Date.now()}`;
}

function AdminApplyContent() {
  const [config, setConfig] = useState<ApplyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    fetch("/api/apply-config")
      .then((r) => r.json())
      .then((data: ApplyConfig) => setConfig(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/apply-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function updateSectionLabel(sectionId: string, label: string) {
    setConfig((c) => c && ({
      ...c,
      sections: c.sections.map((s) => s.id === sectionId ? { ...s, label } : s),
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
        s.id !== sectionId ? s : {
          ...s,
          fields: s.fields.map((f) => f.id === fieldId ? { ...f, ...patch } : f),
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
      placeholder: "",
      hint: "",
      required: false,
      core: false,
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
          Edit application sections, question labels, hints, and required status. Core fields cannot be removed.
        </p>
      </div>

      <div className="px-8 md:px-16 py-12 max-w-4xl">
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

        {/* Add section */}
        <button
          onClick={addSection}
          className="flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold rounded-xl hover:border-[#7A0C0C] hover:text-[#7A0C0C] transition-colors w-full justify-center mb-8"
        >
          <Plus size={15} /> Add Section
        </button>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
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
    <div className="border border-gray-100 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <GripVertical size={15} className="text-gray-300 mt-2.5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          {/* Label + type + required */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Question label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onChange({ label: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="sm:w-32">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Type</label>
              <select
                value={field.type}
                onChange={(e) => onChange({ type: e.target.value as FieldType })}
                disabled={field.core}
                className={inputCls + " disabled:opacity-50"}
              >
                {(["text", "email", "tel", "textarea", "select", "file"] as FieldType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="sm:w-24 flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => onChange({ required: e.target.checked })}
                  disabled={field.core && field.required}
                  className="accent-[#7A0C0C] w-4 h-4"
                />
                <span className="text-xs font-semibold text-gray-600">Required</span>
              </label>
            </div>
          </div>

          {/* Placeholder (not for file/select) */}
          {field.type !== "file" && field.type !== "select" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Placeholder text</label>
              <input
                type="text"
                value={field.placeholder ?? ""}
                onChange={(e) => onChange({ placeholder: e.target.value })}
                className={inputCls}
              />
            </div>
          )}

          {/* Hint (for textarea) */}
          {field.type === "textarea" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Hint text (shown below label)</label>
              <input
                type="text"
                value={field.hint ?? ""}
                onChange={(e) => onChange({ hint: e.target.value })}
                className={inputCls}
              />
            </div>
          )}

          {/* Options (for select) */}
          {field.type === "select" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Options (one per line)</label>
              <textarea
                value={(field.options ?? []).join("\n")}
                onChange={(e) =>
                  onChange({ options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean) })
                }
                rows={4}
                className={textareaCls}
              />
            </div>
          )}
        </div>

        {/* Delete — only for non-core fields */}
        <button
          onClick={onDelete}
          disabled={field.core}
          className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-1 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-300"
          title={field.core ? "Core fields cannot be removed" : "Delete question"}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {field.core && (
        <p className="text-[0.65rem] text-gray-400 pl-6">Core field — cannot be removed</p>
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

const inputCls =
  "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full";
const textareaCls =
  "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full resize-none";
