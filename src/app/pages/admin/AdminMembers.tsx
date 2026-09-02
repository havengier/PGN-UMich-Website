import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Upload,
  Download,
  FileSpreadsheet,
  Linkedin,
  ExternalLink,
  Users,
} from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

type Category = "BOARD" | "CHAIRS" | "ACTIVES";
const FILTER_TABS = ["ALL", "BOARD", "CHAIRS"] as const;
const LEADERSHIP_ROLES: { id: Category; label: string }[] = [
  { id: "BOARD", label: "Executive Board (BOARD)" },
  { id: "CHAIRS", label: "Committee Chair / Director (CHAIRS)" },
];

type DBMember = {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  major: string;
  minor: string;
  pledge_class: string | null;
  linkedin_url: string | null;
  photo_url: string | null;
  hue: string;
  categories: Category[];
  sort_order: number;
};

type MemberForm = {
  name: string;
  role: string;
  major: string;
  minor: string;
  pledge_class: string;
  linkedin_url: string;
  photo_url: string;
  categories: Category[];
};

const EMPTY_FORM: MemberForm = {
  name: "",
  role: "",
  major: "",
  minor: "",
  pledge_class: "",
  linkedin_url: "",
  photo_url: "",
  categories: ["ACTIVES"],
};

type ParsedCSVRow = {
  name: string;
  pledge_class: string;
  position: string;
  major: string;
  minor: string;
  linkedin_url: string;
  categories?: Category[];
  photo_url?: string;
  valid: boolean;
  error?: string;
};

// ── Robust CSV line parser ───────────────────────────────────────────────────
function parseCSV(text: string): ParsedCSVRow[] {
  const lines = text
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const rawHeaders = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const nameIdx = rawHeaders.findIndex((h) => h === "name" || h === "fullname" || h === "member");
  const pledgeIdx = rawHeaders.findIndex((h) => h === "pledgeclass" || h === "class" || h === "pc");
  const posIdx = rawHeaders.findIndex((h) => h === "position" || h === "role" || h === "title");
  const majorIdx = rawHeaders.findIndex((h) => h === "major");
  const minorIdx = rawHeaders.findIndex((h) => h === "minor");
  const linkedinIdx = rawHeaders.findIndex((h) => h === "linkedinurl" || h === "linkedin" || h === "link");
  const catIdx = rawHeaders.findIndex((h) => h === "categories" || h === "category" || h === "tab");
  const photoIdx = rawHeaders.findIndex((h) => h === "photourl" || h === "photo" || h === "image");

  const results: ParsedCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.every((c) => !c)) continue;

    const name = nameIdx !== -1 ? cols[nameIdx] || "" : cols[0] || "";
    const pledge_class = pledgeIdx !== -1 ? cols[pledgeIdx] || "" : "";
    const position = posIdx !== -1 ? cols[posIdx] || "Active Member" : "Active Member";
    const major = majorIdx !== -1 ? cols[majorIdx] || "" : "";
    const minor = minorIdx !== -1 ? cols[minorIdx] || "" : "";
    let linkedin_url = linkedinIdx !== -1 ? cols[linkedinIdx] || "" : "";
    if (linkedin_url && !linkedin_url.startsWith("http://") && !linkedin_url.startsWith("https://")) {
      linkedin_url = `https://${linkedin_url}`;
    }

    let categories: Category[] = ["ACTIVES"];
    if (catIdx !== -1 && cols[catIdx]) {
      const rawCats = cols[catIdx].toUpperCase().split(/[,;|]/).map((c) => c.trim());
      rawCats.forEach((c) => {
        if ((c === "BOARD" || c === "CHAIRS" || c === "ACTIVES") && !categories.includes(c as Category)) {
          categories.push(c as Category);
        }
      });
    }
    const photo_url = photoIdx !== -1 ? cols[photoIdx] || "" : "";

    const valid = Boolean(name.trim());
    results.push({
      name: name.trim(),
      pledge_class: pledge_class.trim(),
      position: position.trim() || "Active Member",
      major: major.trim(),
      minor: minor.trim(),
      linkedin_url: linkedin_url.trim(),
      categories,
      photo_url: photo_url.trim() || undefined,
      valid,
      error: !valid ? "Name is required" : undefined,
    });
  }

  return results;
}

function downloadTemplate() {
  const csvContent =
    "Name,Pledge Class,Position,Major,Minor,LinkedIn URL\n" +
    "Elliott Nederhood,Fall 2023,President,Business Administration,Philosophy,https://www.linkedin.com/in/example\n" +
    "Jing Li,Winter 2024,VP Professional Development,Business Administration,,https://www.linkedin.com/in/example\n" +
    "Alex Torres,Fall 2024,Active Member,Economics,Computer Science,https://www.linkedin.com/in/example\n";

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", "pgn_members_template.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AdminMembersContent() {
  const [members, setMembers] = useState<DBMember[]>([]);
  const [activeTab, setActiveTab] = useState<typeof FILTER_TABS[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MemberForm>({ ...EMPTY_FORM });
  const [addForm, setAddForm] = useState<MemberForm>({ ...EMPTY_FORM });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [opStatus, setOpStatus] = useState<"idle" | "ok" | "error">("idle");
  const [opMsg, setOpMsg] = useState("");

  // Bulk state
  const [csvRows, setCsvRows] = useState<ParsedCSVRow[]>([]);
  const [bulkMode, setBulkMode] = useState<"append" | "replace">("append");
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = useCallback(() => {
    setLoading(true);
    fetch("/api/members")
      .then((r) => r.json())
      .then((data: DBMember[]) => setMembers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const visible =
    activeTab === "ALL"
      ? members
      : members.filter((m) => m.categories?.includes(activeTab as Category));

  function startEdit(m: DBMember) {
    setEditingId(m.id);
    const fullName = m.name || [m.first_name, m.last_name].filter(Boolean).join(" ");
    setEditForm({
      name: fullName,
      role: m.role ?? "",
      major: m.major ?? "",
      minor: m.minor ?? "",
      pledge_class: m.pledge_class ?? "",
      linkedin_url: m.linkedin_url ?? "",
      photo_url: m.photo_url ?? "",
      categories: m.categories ?? ["ACTIVES"],
    });
  }

  async function saveEdit(id: number) {
    setApiError("");
    const finalCategories = Array.from(new Set([...editForm.categories, "ACTIVES"]));
    const res = await fetch(`/api/members/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        categories: finalCategories,
        sort_order: members.find((m) => m.id === id)?.sort_order ?? 0,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      setOpStatus("ok");
      setOpMsg("Member saved successfully.");
      fetchMembers();
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setApiError(d.error ?? "Save failed");
      setOpStatus("error");
    }
  }

  async function deleteMember(id: number) {
    if (!confirm("Delete this member?")) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setOpStatus("ok");
      setOpMsg("Member removed.");
      fetchMembers();
    } else {
      setOpStatus("error");
    }
  }

  async function clearAllMembers() {
    setApiError("");
    setIsClearing(true);
    try {
      const res = await fetch("/api/members", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setShowClearConfirm(false);
        setOpStatus("ok");
        setOpMsg("All members have been removed from the directory.");
        fetchMembers();
      } else {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setApiError(d.error ?? "Failed to clear members directory.");
        setOpStatus("error");
      }
    } catch {
      setApiError("Network error while clearing directory.");
      setOpStatus("error");
    } finally {
      setIsClearing(false);
    }
  }

  async function addMember() {
    setApiError("");
    if (!addForm.name.trim()) {
      setApiError("Member name is required.");
      return;
    }
    const finalCategories = Array.from(new Set([...addForm.categories, "ACTIVES"]));
    const res = await fetch("/api/members", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...addForm,
        categories: finalCategories,
        sort_order: members.length,
      }),
    });
    if (res.ok) {
      setAddForm({ ...EMPTY_FORM });
      setShowAddForm(false);
      setOpStatus("ok");
      setOpMsg("Member added successfully.");
      fetchMembers();
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setApiError(d.error ?? "Failed to add member");
      setOpStatus("error");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseCSV(text);
        setCsvRows(parsed);
      }
    };
    reader.readAsText(file);
  }

  async function executeBulkUpload() {
    const validRows = csvRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      setApiError("No valid rows found in the CSV file.");
      return;
    }

    setIsUploadingBulk(true);
    setApiError("");

    try {
      const res = await fetch("/api/members/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: validRows.map((r) => ({
            name: r.name,
            pledge_class: r.pledge_class,
            role: r.position,
            major: r.major,
            minor: r.minor,
            linkedin_url: r.linkedin_url,
            categories: Array.from(new Set([...(r.categories || []), "ACTIVES"])),
            photo_url: r.photo_url,
          })),
          mode: bulkMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOpStatus("ok");
        setOpMsg(`Successfully imported ${data.count} members!`);
        setShowBulkModal(false);
        setCsvRows([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchMembers();
      } else {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setApiError(d.error ?? "Bulk upload failed.");
        setOpStatus("error");
      }
    } catch {
      setApiError("Network error during bulk upload.");
      setOpStatus("error");
    } finally {
      setIsUploadingBulk(false);
    }
  }

  function toggleCat(form: MemberForm, cat: Category): MemberForm {
    const has = form.categories.includes(cat);
    return {
      ...form,
      categories: has ? form.categories.filter((c) => c !== cat) : [...form.categories, cat],
    };
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="bg-[#1a0303] px-8 md:px-16 py-10 pt-24">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Admin
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-white font-normal"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              }}
            >
              Members Directory
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Add individual members, bulk upload via CSV, or manage existing records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors border border-white/10"
              title="Download sample CSV template"
            >
              <Download size={14} /> Download CSV Template
            </button>
            <button
              onClick={() => {
                setShowBulkModal((v) => !v);
                setShowAddForm(false);
                setApiError("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-semibold rounded-lg transition-colors border border-amber-900/40"
            >
              <FileSpreadsheet size={14} /> Bulk Upload CSV
            </button>
            {members.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-950/70 hover:bg-red-900 text-red-200 hover:text-white text-xs font-semibold rounded-lg transition-colors border border-red-800/50"
                title="Clear all members from the directory"
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-8 md:px-16 py-10">
        {/* Warning Confirmation Modal for Clear All */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-red-100">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Clear All Members?
                  </h3>
                  <p className="text-xs text-red-600 font-semibold tracking-wide uppercase mt-0.5">
                    Permanent Deletion Warning
                  </p>
                </div>
              </div>

              <div className="bg-red-50/80 border border-red-200/80 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-900 leading-relaxed font-medium">
                  Warning: This action will permanently remove all{" "}
                  <span className="font-bold underline">{members.length} members</span> from the database.
                </p>
                <p className="text-xs text-red-700/90 mt-2">
                  This action cannot be undone. You will need to re-upload or re-enter members manually or via CSV.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="px-5 py-2.5 text-xs font-bold tracking-wider uppercase border border-gray-300 rounded-full text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={clearAllMembers}
                  disabled={isClearing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase rounded-full shadow-md shadow-red-600/20 transition-colors disabled:opacity-50"
                >
                  {isClearing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk CSV Upload Panel */}
        {showBulkModal && (
          <div className="bg-white rounded-2xl border border-amber-900/20 shadow-md p-6 sm:p-8 mb-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#7A0C0C] flex items-center justify-center">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Bulk Upload Members from CSV</h3>
                  <p className="text-xs text-gray-500">
                    Required headers:{" "}
                    <code className="bg-gray-100 text-[#7A0C0C] px-1.5 py-0.5 rounded font-mono">
                      name, pledge class, Position, major, minor, linkedin url
                    </code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setCsvRows([]);
                }}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* File drop / picker */}
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#7A0C0C] rounded-2xl p-8 cursor-pointer bg-stone-50/60 hover:bg-stone-50 transition-colors">
                <Upload size={28} className="text-[#7A0C0C] mb-2" />
                <span className="text-sm font-semibold text-gray-800">
                  Click to select CSV file or drag and drop
                </span>
                <span className="text-xs text-gray-500 mt-1">Accepts standard .csv spreadsheets</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Options & Preview */}
            {csvRows.length > 0 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
                  <div className="flex items-center gap-3">
                    <Users size={18} className="text-[#7A0C0C]" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {csvRows.filter((r) => r.valid).length} valid members found
                      </p>
                      {csvRows.some((r) => !r.valid) && (
                        <p className="text-xs text-red-600">
                          {csvRows.filter((r) => !r.valid).length} rows skipped due to missing name
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mode selector */}
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkMode"
                        checked={bulkMode === "append"}
                        onChange={() => setBulkMode("append")}
                        className="accent-[#7A0C0C]"
                      />
                      <span className="font-medium text-gray-700">Add to existing members</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="bulkMode"
                        checked={bulkMode === "replace"}
                        onChange={() => setBulkMode("replace")}
                        className="accent-[#7A0C0C]"
                      />
                      <span className="font-medium text-red-700">Replace entire directory</span>
                    </label>
                  </div>
                </div>

                {/* Live Preview Table */}
                <div className="border border-gray-200 rounded-xl overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 uppercase font-semibold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Pledge Class</th>
                        <th className="py-2.5 px-3">Position</th>
                        <th className="py-2.5 px-3">Major / Minor</th>
                        <th className="py-2.5 px-3">LinkedIn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.valid ? "hover:bg-gray-50" : "bg-red-50/50 text-red-700"}
                        >
                          <td className="py-2 px-3 text-gray-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-gray-900">
                            {row.name || <span className="italic text-red-500">Missing</span>}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{row.pledge_class || "—"}</td>
                          <td className="py-2 px-3 text-[#7A0C0C] font-medium">{row.position}</td>
                          <td className="py-2 px-3 text-gray-600">
                            {row.major}
                            {row.minor ? ` (${row.minor})` : ""}
                          </td>
                          <td className="py-2 px-3">
                            {row.linkedin_url ? (
                              <a
                                href={row.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[#0077B5] hover:underline"
                              >
                                <Linkedin size={12} /> View
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {apiError && <p className="text-sm text-red-600 font-medium">{apiError}</p>}

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={executeBulkUpload}
                    disabled={isUploadingBulk || csvRows.filter((r) => r.valid).length === 0}
                    className="flex items-center gap-2 px-7 py-2.5 bg-[#7A0C0C] disabled:bg-gray-300 text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors"
                  >
                    {isUploadingBulk ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    Import {csvRows.filter((r) => r.valid).length} Members
                  </button>
                  <button
                    onClick={() => {
                      setCsvRows([]);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase border border-gray-300 rounded-full text-gray-600 hover:border-gray-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab bar + Add button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-xs font-bold tracking-widest uppercase border-2 transition-all ${
                  activeTab === tab
                    ? "bg-[#7A0C0C] border-[#7A0C0C] text-white"
                    : "bg-white border-gray-300 text-gray-600 hover:border-[#7A0C0C] hover:text-[#7A0C0C]"
                }`}
              >
                {tab === "ALL" ? "All Actives" : tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              setShowBulkModal(false);
              setApiError("");
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7A0C0C] text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-[#5C0A0A] transition-colors"
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Cancel" : "Add Member"}
          </button>
        </div>

        {/* Add member form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-[#7A0C0C]/20 shadow-sm p-6 mb-8">
            <h3 className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-5">
              New Member
            </h3>
            <MemberFormFields
              form={addForm}
              onChange={setAddForm}
              toggleCat={(cat) => setAddForm((f) => toggleCat(f, cat))}
            />
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
            <CheckCircle size={14} /> {opMsg || "Done"}
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
            No members found in this category. Add one above or upload a CSV file.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((m) => {
              const displayName = m.name || [m.first_name, m.last_name].filter(Boolean).join(" ");
              const initials =
                displayName
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "PGN";

              return editingId === m.id ? (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-[#7A0C0C]/20 shadow-sm p-6"
                >
                  <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#7A0C0C] mb-5">
                    Editing {displayName}
                  </p>
                  <MemberFormFields
                    form={editForm}
                    onChange={setEditForm}
                    toggleCat={(cat) => setEditForm((f) => toggleCat(f, cat))}
                  />
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
                  className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 flex items-center gap-4 hover:border-gray-200 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.hue} flex-shrink-0 flex items-center justify-center`}
                  >
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white/80 text-xs font-semibold">{initials}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">{displayName}</p>
                      {m.pledge_class && (
                        <span className="text-[0.65rem] font-medium bg-amber-50 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded-full">
                          {m.pledge_class}
                        </span>
                      )}
                      {m.linkedin_url && (
                        <a
                          href={m.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0077B5] hover:text-[#005582] inline-flex items-center gap-0.5 text-xs transition-colors"
                          title="View LinkedIn Profile"
                        >
                          <Linkedin size={12} className="fill-current" />
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-[#7A0C0C]">{m.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(m.categories ?? []).map((c) => (
                        <span
                          key={c}
                          className="text-[0.6rem] font-bold tracking-wider uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                        >
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
              );
            })}
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
      <LabeledInput
        label="Full Name *"
        value={form.name}
        onChange={set("name")}
        placeholder="e.g. Elliott Nederhood"
      />
      <LabeledInput
        label="Role / Title"
        value={form.role}
        onChange={set("role")}
        placeholder="e.g. President"
      />
      <div className="grid grid-cols-2 gap-4">
        <LabeledInput
          label="Major"
          value={form.major}
          onChange={set("major")}
          placeholder="e.g. Business Administration"
        />
        <LabeledInput
          label="Minor"
          value={form.minor}
          onChange={set("minor")}
          placeholder="e.g. Philosophy"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <LabeledInput
          label="Pledge Class"
          value={form.pledge_class}
          onChange={set("pledge_class")}
          placeholder="e.g. Tau, Upsilon, Phi, Chi, Psi, Omega"
        />
        <LabeledInput
          label="LinkedIn URL"
          value={form.linkedin_url}
          onChange={set("linkedin_url")}
          placeholder="https://linkedin.com/in/..."
          type="url"
        />
      </div>
      <LabeledInput
        label="Photo URL"
        value={form.photo_url}
        onChange={set("photo_url")}
        placeholder="https://…"
        type="url"
      />
      {form.photo_url && (
        <img
          src={form.photo_url}
          alt="Preview"
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
        />
      )}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">Leadership Roles (Optional)</p>
        <p className="text-xs text-gray-500 mb-2">
          All members are automatically actives. Check if this member is also on Board or Chairs:
        </p>
        <div className="flex flex-wrap gap-4">
          {LEADERSHIP_ROLES.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.categories.includes(id)}
                onChange={() => toggleCat(id)}
                className="accent-[#7A0C0C] w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700 font-medium">{label}</span>
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
