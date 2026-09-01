import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { ArrowLeft, Plus, Pencil, Trash2, X, CheckCircle, AlertCircle } from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

type Category = "BOARD" | "CHAIRS" | "ACTIVES";
const TABS: Category[] = ["BOARD", "CHAIRS", "ACTIVES"];

type DBMember = {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  major: string;
  minor: string;
  photo_url: string | null;
  hue: string;
  categories: Category[];
  sort_order: number;
};

type MemberForm = {
  first_name: string;
  last_name: string;
  role: string;
  major: string;
  minor: string;
  photo_url: string;
  categories: Category[];
};

const EMPTY_FORM: MemberForm = {
  first_name: "",
  last_name: "",
  role: "",
  major: "",
  minor: "",
  photo_url: "",
  categories: [],
};

function AdminMembersContent() {
  const [members, setMembers] = useState<DBMember[]>([]);
  const [activeTab, setActiveTab] = useState<Category | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MemberForm>({ ...EMPTY_FORM });
  const [addForm, setAddForm] = useState<MemberForm>({ ...EMPTY_FORM });
  const [showAddForm, setShowAddForm] = useState(false);
  const [apiError, setApiError] = useState("");
  const [opStatus, setOpStatus] = useState<"idle" | "ok" | "error">("idle");

  const fetchMembers = useCallback(() => {
    setLoading(true);
    fetch("/api/members")
      .then((r) => r.json())
      .then((data: DBMember[]) => setMembers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const visible = activeTab === "ALL"
    ? members
    : members.filter((m) => m.categories?.includes(activeTab));

  function startEdit(m: DBMember) {
    setEditingId(m.id);
    setEditForm({
      first_name: m.first_name,
      last_name: m.last_name,
      role: m.role ?? "",
      major: m.major ?? "",
      minor: m.minor ?? "",
      photo_url: m.photo_url ?? "",
      categories: m.categories ?? [],
    });
  }

  async function saveEdit(id: number) {
    setApiError("");
    const res = await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, sort_order: members.find((m) => m.id === id)?.sort_order ?? 0 }),
    });
    if (res.ok) {
      setEditingId(null);
      setOpStatus("ok");
      fetchMembers();
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setApiError(d.error ?? "Save failed");
      setOpStatus("error");
    }
  }

  async function deleteMember(id: number) {
    if (!confirm("Delete this member?")) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) { setOpStatus("ok"); fetchMembers(); }
    else setOpStatus("error");
  }

  async function addMember() {
    setApiError("");
    if (!addForm.first_name || !addForm.last_name) {
      setApiError("First and last name are required.");
      return;
    }
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, sort_order: members.length }),
    });
    if (res.ok) {
      setAddForm({ ...EMPTY_FORM });
      setShowAddForm(false);
      setOpStatus("ok");
      fetchMembers();
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setApiError(d.error ?? "Failed to add member");
      setOpStatus("error");
    }
  }

  function toggleCat(form: MemberForm, cat: Category): MemberForm {
    const has = form.categories.includes(cat);
    return { ...form, categories: has ? form.categories.filter((c) => c !== cat) : [...form.categories, cat] };
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="bg-[#1a0303] px-8 md:px-16 py-10 pt-24">
        <Link to="/admin" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Admin
        </Link>
        <h1 className="text-white font-normal" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
          Members Page
        </h1>
        <p className="text-white/40 text-sm mt-2">Add, edit, or remove member cards. Members can belong to multiple categories.</p>
      </div>

      <div className="px-8 md:px-16 py-12">

        {/* Tab bar + Add button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {(["ALL", ...TABS] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-xs font-bold tracking-widest uppercase border-2 transition-all ${
                  activeTab === tab
                    ? "bg-[#7A0C0C] border-[#7A0C0C] text-white"
                    : "bg-white border-gray-300 text-gray-600 hover:border-[#7A0C0C] hover:text-[#7A0C0C]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setShowAddForm((v) => !v); setApiError(""); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7A0C0C] text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors"
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Cancel" : "Add Member"}
          </button>
        </div>

        {/* Add member form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-[#7A0C0C]/20 shadow-sm p-6 mb-8">
            <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-5">New Member</h3>
            <MemberFormFields form={addForm} onChange={setAddForm} toggleCat={(cat) => setAddForm((f) => toggleCat(f, cat))} />
            {apiError && <p className="text-sm text-red-600 mt-3">{apiError}</p>}
            <div className="flex gap-3 mt-5">
              <button
                onClick={addMember}
                className="flex items-center gap-2 px-7 py-2.5 bg-[#7A0C0C] text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors"
              >
                <Plus size={14} /> Add Member
              </button>
            </div>
          </div>
        )}

        {/* Status messages */}
        {opStatus === "ok" && (
          <p className="flex items-center gap-1.5 text-sm text-green-600 font-medium mb-4">
            <CheckCircle size={14} /> Done
          </p>
        )}
        {opStatus === "error" && !apiError && (
          <p className="flex items-center gap-1.5 text-sm text-red-600 font-medium mb-4">
            <AlertCircle size={14} /> Operation failed
          </p>
        )}

        {/* Members list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No members in this category. Add one above.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((m) =>
              editingId === m.id ? (
                <div key={m.id} className="bg-white rounded-2xl border border-[#7A0C0C]/20 shadow-sm p-6">
                  <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-5">Editing {m.first_name} {m.last_name}</p>
                  <MemberFormFields form={editForm} onChange={setEditForm} toggleCat={(cat) => setEditForm((f) => toggleCat(f, cat))} />
                  {apiError && <p className="text-sm text-red-600 mt-3">{apiError}</p>}
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => saveEdit(m.id)}
                      className="flex items-center gap-2 px-7 py-2.5 bg-[#7A0C0C] text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors"
                    >
                      <CheckCircle size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase border border-gray-300 rounded-full text-gray-600 hover:border-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.hue} flex-shrink-0 flex items-center justify-center`}>
                    {m.photo_url ? (
                      <img src={m.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white/80 text-xs font-semibold">{m.first_name[0]}{m.last_name[0]}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-[#7A0C0C]">{m.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(m.categories ?? []).map((c) => (
                        <span key={c} className="text-[0.6rem] font-bold tracking-wider uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(m)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteMember(m.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberFormFields({
  form,
  onChange,
  toggleCat,
}: {
  form: MemberForm;
  onChange: (f: MemberForm) => void;
  toggleCat: (cat: Category) => void;
}) {
  const set = (key: keyof MemberForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <LabeledInput label="First Name *" value={form.first_name} onChange={set("first_name")} />
        <LabeledInput label="Last Name *" value={form.last_name} onChange={set("last_name")} />
      </div>
      <LabeledInput label="Role / Title" value={form.role} onChange={set("role")} placeholder="e.g. President" />
      <div className="grid grid-cols-2 gap-4">
        <LabeledInput label="Major" value={form.major} onChange={set("major")} />
        <LabeledInput label="Minor" value={form.minor} onChange={set("minor")} />
      </div>
      <LabeledInput label="Photo URL" value={form.photo_url} onChange={set("photo_url")} placeholder="https://…" type="url" />
      {form.photo_url && (
        <img src={form.photo_url} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
      )}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Categories</p>
        <div className="flex gap-3">
          {TABS.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.categories.includes(cat)}
                onChange={() => toggleCat(cat)}
                className="accent-[#7A0C0C] w-4 h-4"
              />
              <span className="text-sm text-gray-700">{cat}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors w-full"
      />
    </div>
  );
}

export default function AdminMembers() {
  return (
    <LoginGate requireAdmin>
      <AdminMembersContent />
    </LoginGate>
  );
}
