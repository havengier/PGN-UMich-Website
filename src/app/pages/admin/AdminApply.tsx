import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Sliders,
  Download,
  Users,
  Eye,
  FileText,
  ExternalLink,
  ChevronDown,
  Calendar,
  MessageSquare,
  Settings,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  X,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";
import { useAuth } from "@/app/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type FieldType = "text" | "email" | "tel" | "textarea" | "select" | "file";

interface ConfigField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  hint?: string;
  options?: string[];
  required: boolean;
  core?: boolean;
}

interface ConfigSection {
  id: string;
  label: string;
  fields: ConfigField[];
}

interface CycleForm {
  id: number;
  cycle_id: number;
  questions: ConfigSection[];
  opens_at: string | null;
  closes_at: string | null;
  is_locked: boolean;
  status_messages?: Record<string, Record<string, { title: string; body: string }>>;
  updated_at: string;
}

interface RecruitmentCycle {
  id: number;
  name: string;
  status: "draft" | "open" | "closed" | "archived";
  created_at: string;
  created_by: string;
  submissionCount?: number;
}

interface CandidateRow {
  submissionId: number;
  applicantName: string;
  applicantEmail: string;
  submittedAt: string;
  answers: Record<string, any>;
  status: string;
  isOverridden: boolean;
  scores: Record<string, { score: number; note: string | null; ratedAt: string }>;
  referenceSum: number;
  scoredCount: number;
  assignedBrothers?: string[];
}

const SCORE_OPTIONS = [-1, -0.5, 0, 0.5, 1];

function newFieldId() {
  return `custom_${Date.now()}`;
}

function newSectionId() {
  return `section_${Date.now()}`;
}

// ── Admin Apply Main Component ────────────────────────────────────────────────

export default function AdminApply() {
  return (
    <LoginGate requireAdmin>
      <AdminApplyPortal />
    </LoginGate>
  );
}

function AdminApplyPortal() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<RecruitmentCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "builder" | "app_review" | "round1" | "round2" | "messages" | "settings"
  >("app_review");

  const [form, setForm] = useState<CycleForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingForm, setSavingForm] = useState(false);
  const [formStatusMsg, setFormStatusMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // New Cycle Modal state
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [newCycleName, setNewCycleName] = useState("");
  const [creatingCycle, setCreatingCycle] = useState(false);

  // Delete Cycle Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deletingCycle, setDeletingCycle] = useState(false);

  // Load all cycles on mount
  useEffect(() => {
    loadCycles();
  }, []);

  async function loadCycles(selectId?: number) {
    try {
      const res = await fetch("/api/recruitment/cycles");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCycles(data);
        if (data.length > 0) {
          const targetId = selectId || selectedCycleId || data[0].id;
          const found = data.find((c: RecruitmentCycle) => c.id === targetId);
          setSelectedCycleId(found ? found.id : data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load cycles:", err);
    } finally {
      setLoading(false);
    }
  }

  // When selectedCycleId changes, load that cycle's form definition
  useEffect(() => {
    if (!selectedCycleId) return;
    loadCycleForm(selectedCycleId);
  }, [selectedCycleId]);

  async function loadCycleForm(cycleId: number) {
    try {
      const res = await fetch(`/api/recruitment/cycles/${cycleId}/form`);
      const data = await res.json();
      if (data && data.cycle_id) {
        setForm(data);
      }
    } catch (err) {
      console.error("Failed to load form:", err);
    }
  }

  const currentCycle = useMemo(
    () => cycles.find((c) => c.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId],
  );

  async function handleCreateCycle(e: React.FormEvent) {
    e.preventDefault();
    if (!newCycleName.trim()) return;
    setCreatingCycle(true);
    try {
      const res = await fetch("/api/recruitment/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCycleName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setNewCycleName("");
        setShowNewCycleModal(false);
        await loadCycles(data.id);
        setActiveTab("builder");
      }
    } catch (err) {
      console.error("Failed to create cycle:", err);
    } finally {
      setCreatingCycle(false);
    }
  }

  async function handleDeleteCycle() {
    if (!currentCycle) return;
    if (deleteConfirmInput.trim() !== currentCycle.name.trim()) return;
    setDeletingCycle(true);
    try {
      const res = await fetch(`/api/recruitment/cycles/${currentCycle.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName: deleteConfirmInput.trim() }),
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setDeleteConfirmInput("");
        await loadCycles();
      }
    } catch (err) {
      console.error("Failed to delete cycle:", err);
    } finally {
      setDeletingCycle(false);
    }
  }

  async function handleSaveForm(overrideForm?: CycleForm) {
    const toSave = overrideForm || form;
    if (!toSave || !selectedCycleId) return;
    setSavingForm(true);
    setFormStatusMsg(null);
    try {
      const res = await fetch(`/api/recruitment/cycles/${selectedCycleId}/form`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: toSave.questions,
          opens_at: toSave.opens_at,
          closes_at: toSave.closes_at,
          is_locked: toSave.is_locked,
          status_messages: toSave.status_messages,
        }),
      });
      if (res.ok) {
        setFormStatusMsg({ type: "ok", text: "Form saved successfully." });
      } else {
        setFormStatusMsg({ type: "err", text: "Failed to save form changes." });
      }
    } catch {
      setFormStatusMsg({ type: "err", text: "Network error saving form." });
    } finally {
      setSavingForm(false);
    }
  }

  async function handleToggleLock() {
    if (!form || !selectedCycleId) return;
    const nextLocked = !form.is_locked;
    const updated = { ...form, is_locked: nextLocked };
    setForm(updated);
    try {
      await fetch(`/api/recruitment/cycles/${selectedCycleId}/toggle-lock`, { method: "POST" });
    } catch {
      setForm((prev) => (prev ? { ...prev, is_locked: !nextLocked } : null));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="w-7 h-7 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Banner */}
      <div className="bg-[#1a0303] px-8 md:px-16 py-10 pt-24 text-white">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Admin Overview
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#F5A623] text-xs font-bold tracking-[0.25em] uppercase">
                Recruitment Command Center
              </span>
              {currentCycle && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    currentCycle.status === "open"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : currentCycle.status === "draft"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-stone-500/20 text-stone-300 border border-stone-500/30"
                  }`}
                >
                  {currentCycle.status}
                </span>
              )}
            </div>

            <h1
              className="text-white font-normal"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              {currentCycle ? currentCycle.name : "Recruitment Cycles"}
            </h1>
          </div>

          {/* Cycle Switcher & New Cycle Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedCycleId ?? ""}
                onChange={(e) => setSelectedCycleId(Number(e.target.value))}
                className="appearance-none bg-stone-900 border border-stone-700 text-white text-xs font-semibold rounded-xl px-4 py-2.5 pr-9 hover:border-stone-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowNewCycleModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-sm"
            >
              <Plus size={14} /> New Cycle
            </button>
          </div>
        </div>

        {/* Cycle Sub-bar with Quick Lock Switch */}
        {currentCycle && form && (
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6 text-white/70">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-[#F5A623]" />
                <strong className="text-white">{currentCycle.submissionCount ?? 0}</strong> Applicants
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#F5A623]" />
                {form.opens_at || form.closes_at
                  ? `Window: ${form.opens_at ? new Date(form.opens_at).toLocaleDateString() : "Immediate"} - ${
                      form.closes_at ? new Date(form.closes_at).toLocaleDateString() : "Open"
                    }`
                  : "No deadline set"}
              </span>
            </div>

            {/* Quick Lock Toggle Button */}
            <div className="flex items-center gap-3">
              <span className="text-white/60">Application Lock:</span>
              <button
                type="button"
                onClick={handleToggleLock}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all ${
                  form.is_locked
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                }`}
              >
                {form.is_locked ? <Lock size={12} /> : <Unlock size={12} />}
                <span>{form.is_locked ? "Locked (Submissions Paused)" : "Unlocked (Accepting)"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-stone-200 px-8 md:px-16 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab("app_review")}
            className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all whitespace-nowrap ${
              activeTab === "app_review"
                ? "bg-[#7A0C0C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            1. Applications Review
          </button>
          <button
            onClick={() => setActiveTab("round1")}
            className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all whitespace-nowrap ${
              activeTab === "round1"
                ? "bg-[#7A0C0C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            2. Round 1 Interviews
          </button>
          <button
            onClick={() => setActiveTab("round2")}
            className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all whitespace-nowrap ${
              activeTab === "round2"
                ? "bg-[#7A0C0C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            3. Round 2 & Bids
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all whitespace-nowrap ${
              activeTab === "builder"
                ? "bg-[#7A0C0C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            Application Builder
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all whitespace-nowrap ${
              activeTab === "messages"
                ? "bg-[#7A0C0C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            Status Messages
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-[#7A0C0C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            Cycle Settings
          </button>
        </div>
      </div>

      {/* Main Tab View */}
      <div className="px-6 md:px-16 py-10 max-w-7xl mx-auto">
        {!currentCycle ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
            <h3 className="text-xl font-semibold text-stone-900 mb-2">No Recruitment Cycles Found</h3>
            <p className="text-xs text-stone-500 mb-6">Create your first recruitment cycle to get started.</p>
            <button
              onClick={() => setShowNewCycleModal(true)}
              className="px-6 py-2.5 bg-[#7A0C0C] text-white text-xs font-bold tracking-wider uppercase rounded-full"
            >
              Create Cycle
            </button>
          </div>
        ) : (
          <>
            {activeTab === "app_review" && (
              <RoundReviewTab
                cycleId={currentCycle.id}
                round="application"
                roundTitle="Application Round Review"
                roundDescription="Evaluate written applications. Scores are kept strictly isolated and never averaged with interview rounds."
                currentUserEmail={user?.email || "admin@umich.edu"}
                advanceStatusKey="advanced_to_round_1"
                rejectStatusKey="not_selected_application"
                advanceStatusLabel="Advance to Round 1"
                rejectStatusLabel="Not Selected"
              />
            )}

            {activeTab === "round1" && (
              <RoundReviewTab
                cycleId={currentCycle.id}
                round="round1"
                roundTitle="Round 1 Interviews Review"
                roundDescription="Candidates who passed the application round. Round 1 scores are independent and separate from all other rounds."
                currentUserEmail={user?.email || "admin@umich.edu"}
                advanceStatusKey="advanced"
                rejectStatusKey="not_selected"
                advanceStatusLabel="Advance to Round 2"
                rejectStatusLabel="Not Selected"
              />
            )}

            {activeTab === "round2" && (
              <RoundReviewTab
                cycleId={currentCycle.id}
                round="round2"
                roundTitle="Round 2 Interviews & Final Bid Decisions"
                roundDescription="Final stage deliberating candidates for official bids. Passing Round 2 extends an official bid to join PGN."
                currentUserEmail={user?.email || "admin@umich.edu"}
                advanceStatusKey="offered_bid"
                rejectStatusKey="not_selected"
                advanceStatusLabel="Extend Bid 🎉"
                rejectStatusLabel="Not Selected"
              />
            )}

            {activeTab === "builder" && form && (
              <ApplicationBuilderTab
                form={form}
                setForm={setForm}
                saving={savingForm}
                statusMsg={formStatusMsg}
                onSave={handleSaveForm}
                onToggleLock={handleToggleLock}
              />
            )}

            {activeTab === "messages" && form && (
              <StatusMessagesTab
                form={form}
                setForm={setForm}
                saving={savingForm}
                statusMsg={formStatusMsg}
                onSave={handleSaveForm}
              />
            )}

            {activeTab === "settings" && (
              <CycleSettingsTab
                cycle={currentCycle}
                onUpdateCycle={async (patch) => {
                  await fetch(`/api/recruitment/cycles/${currentCycle.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patch),
                  });
                  await loadCycles(currentCycle.id);
                }}
                onOpenDeleteModal={() => {
                  setDeleteConfirmInput("");
                  setShowDeleteModal(true);
                }}
              />
            )}
          </>
        )}
      </div>

      {/* ── Modal: Create New Cycle ── */}
      {showNewCycleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Create Recruitment Cycle</h3>
              <button
                onClick={() => setShowNewCycleModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCycle} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Cycle Name (e.g. "Fall 2026 Rush")
                </label>
                <input
                  type="text"
                  required
                  placeholder="Fall 2026 Rush"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#7A0C0C]"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                New cycles start in <strong>Draft</strong> status with the default application questions
                and status messages ready to be edited.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCycleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCycle || !newCycleName.trim()}
                  className="px-5 py-2 text-xs font-bold tracking-wider uppercase bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white rounded-lg disabled:opacity-50"
                >
                  {creatingCycle ? "Creating…" : "Create Cycle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Cycle Confirmation (Strict typed name verification) ── */}
      {showDeleteModal && currentCycle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Permanently Delete Cycle?</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              This action <strong>CANNOT</strong> be undone. This will permanently delete{" "}
              <strong>{currentCycle.name}</strong>, along with its application questions, all submissions,
              interviews, rater scores, and evaluations.
            </p>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 mb-4">
              To confirm, type <span className="font-mono font-bold select-all text-red-950">{currentCycle.name}</span> below:
            </div>
            <input
              type="text"
              placeholder={currentCycle.name}
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="w-full text-xs font-mono border border-stone-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-red-600 mb-5"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCycle}
                disabled={deletingCycle || deleteConfirmInput.trim() !== currentCycle.name.trim()}
                className="px-5 py-2 text-xs font-bold tracking-wider uppercase bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deletingCycle ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Round Review Component ───────────────────────────────────────────────

function RoundReviewTab({
  cycleId,
  round,
  roundTitle,
  roundDescription,
  currentUserEmail,
  advanceStatusKey,
  rejectStatusKey,
  advanceStatusLabel,
  rejectStatusLabel,
}: {
  cycleId: number;
  round: "application" | "round1" | "round2";
  roundTitle: string;
  roundDescription: string;
  currentUserEmail: string;
  advanceStatusKey: string;
  rejectStatusKey: string;
  advanceStatusLabel: string;
  rejectStatusLabel: string;
}) {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [raters, setRaters] = useState<{ raterId: string; raterName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Cutoff tool modal state
  const [showCutoffModal, setShowCutoffModal] = useState(false);
  const [cutoffColumn, setCutoffColumn] = useState<string>("sum");
  const [cutoffThreshold, setCutoffThreshold] = useState<number>(0);
  const [applyingCutoff, setApplyingCutoff] = useState(false);

  // Selected candidate details slide-over
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);

  // Scoring note modal state
  const [noteModalTarget, setNoteModalTarget] = useState<{
    submissionId: number;
    applicantName: string;
    currentScore: number | null;
    currentNote: string;
  } | null>(null);

  // Brother assignment modal state
  const [assignModalTarget, setAssignModalTarget] = useState<CandidateRow | null>(null);
  const [assignEmailInput, setAssignEmailInput] = useState("");
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    loadData();
  }, [cycleId, round]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruitment/cycles/${cycleId}/round/${round}`);
      const data = await res.json();
      if (data && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
        setRaters(data.raters || []);
      }
    } catch (err) {
      console.error("Failed to load round candidates:", err);
    } finally {
      setLoading(false);
    }
  }

  // Quick rate handler
  async function handleRate(submissionId: number, score: number, note?: string) {
    try {
      await fetch(`/api/recruitment/cycles/${cycleId}/round/${round}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, score, note }),
      });
      await loadData();
    } catch (err) {
      console.error("Failed to submit rating:", err);
    }
  }

  // Manual override handler
  async function handleOverride(submissionId: number, newStatus: string) {
    try {
      await fetch(`/api/recruitment/submissions/${submissionId}/override-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round, status: newStatus }),
      });
      await loadData();
    } catch (err) {
      console.error("Failed to override status:", err);
    }
  }

  // Brother assignment handlers
  async function handleAssignBrother(submissionId: number, email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.endsWith("@umich.edu")) {
      setAssignError("Brother email must end with @umich.edu");
      return;
    }
    setAssigningLoading(true);
    setAssignError("");
    try {
      const res = await fetch(`/api/recruitment/submissions/${submissionId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brotherEmail: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign brother");
      setAssignEmailInput("");
      await loadData();
      if (assignModalTarget && assignModalTarget.submissionId === submissionId) {
        setAssignModalTarget((prev) =>
          prev
            ? {
                ...prev,
                assignedBrothers: [...(prev.assignedBrothers || []).filter((e) => e !== trimmed), trimmed],
              }
            : null,
        );
      }
      if (selectedCandidate && selectedCandidate.submissionId === submissionId) {
        setSelectedCandidate((prev) =>
          prev
            ? {
                ...prev,
                assignedBrothers: [...(prev.assignedBrothers || []).filter((e) => e !== trimmed), trimmed],
              }
            : null,
        );
      }
    } catch (err: any) {
      setAssignError(err.message || "Failed to assign brother");
    } finally {
      setAssigningLoading(false);
    }
  }

  async function handleUnassignBrother(submissionId: number, email: string) {
    try {
      const res = await fetch(`/api/recruitment/submissions/${submissionId}/assign`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brotherEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove brother");
      await loadData();
      if (assignModalTarget && assignModalTarget.submissionId === submissionId) {
        setAssignModalTarget((prev) =>
          prev
            ? {
                ...prev,
                assignedBrothers: (prev.assignedBrothers || []).filter((e) => e !== email),
              }
            : null,
        );
      }
      if (selectedCandidate && selectedCandidate.submissionId === submissionId) {
        setSelectedCandidate((prev) =>
          prev
            ? {
                ...prev,
                assignedBrothers: (prev.assignedBrothers || []).filter((e) => e !== email),
              }
            : null,
        );
      }
    } catch (err: any) {
      alert("Error removing brother: " + err.message);
    }
  }

  // Live cutoff computation
  const cutoffPreview = useMemo(() => {
    const above: CandidateRow[] = [];
    const below: CandidateRow[] = [];

    candidates.forEach((c) => {
      let val = 0;
      if (cutoffColumn === "sum") {
        val = c.referenceSum;
      } else {
        val = c.scores[cutoffColumn]?.score ?? 0;
      }

      if (val >= cutoffThreshold) {
        above.push(c);
      } else {
        below.push(c);
      }
    });

    return { above, below };
  }, [candidates, cutoffColumn, cutoffThreshold]);

  // Execute cutoff bulk update
  async function handleConfirmCutoff() {
    setApplyingCutoff(true);
    try {
      const decisions = [
        ...cutoffPreview.above.map((c) => ({ submissionId: c.submissionId, newStatus: advanceStatusKey })),
        ...cutoffPreview.below.map((c) => ({ submissionId: c.submissionId, newStatus: rejectStatusKey })),
      ];

      await fetch(`/api/recruitment/cycles/${cycleId}/round/${round}/cutoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions }),
      });
      setShowCutoffModal(false);
      await loadData();
    } catch (err) {
      console.error("Failed to apply cutoff:", err);
    } finally {
      setApplyingCutoff(false);
    }
  }

  // CSV Export handler
  function handleExportCsv() {
    if (candidates.length === 0) return;

    const raterHeaders = raters.map((r) => `Rater: ${r.raterName} (${r.raterId})`);
    const headers = [
      "Submission ID",
      "Applicant Name",
      "Applicant Email",
      ...(round === "application" ? ["Assigned Brothers"] : []),
      "Submitted At",
      ...raterHeaders,
      "Reference Sum",
      "Status",
      "Manually Overridden",
    ];

    const rows = candidates.map((c) => {
      const raterScores = raters.map((r) => {
        const item = c.scores[r.raterId];
        return item ? item.score : "";
      });
      const assignedBrothersStr = `"${(c.assignedBrothers || []).join("; ")}"`;
      return [
        c.submissionId,
        `"${c.applicantName.replace(/"/g, '""')}"`,
        c.applicantEmail,
        ...(round === "application" ? [assignedBrothersStr] : []),
        new Date(c.submittedAt).toLocaleDateString(),
        ...raterScores,
        c.referenceSum,
        c.status,
        c.isOverridden ? "Yes" : "No",
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `PGN_${round}_candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.applicantName.toLowerCase().includes(search.toLowerCase()) ||
        c.applicantEmail.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidates, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900">{roundTitle}</h2>
          <p className="text-xs text-stone-500 mt-1">{roundDescription}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCutoffModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-xs"
          >
            <Sliders size={14} /> Set Cutoff Tool
          </button>
          <button
            onClick={handleExportCsv}
            disabled={candidates.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold tracking-wider uppercase rounded-xl transition-all border border-stone-200 disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={loadData}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search candidate name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl outline-none focus:border-[#7A0C0C]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#7A0C0C]"
          >
            <option value="all">All Statuses ({candidates.length})</option>
            <option value={advanceStatusKey}>{advanceStatusLabel}</option>
            <option value={rejectStatusKey}>{rejectStatusLabel}</option>
            <option value="pending">Pending</option>
            <option value="pending_review">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin" />
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <p className="text-sm font-semibold text-stone-700">No candidates found in this round.</p>
          <p className="text-xs text-stone-400 mt-1">
            Candidates must advance from the previous stage to appear in this round.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  {round === "application" && (
                    <th className="px-4 py-3.5 whitespace-nowrap">Assigned Brothers</th>
                  )}
                  {/* Distinct columns for each rater who scored */}
                  {raters.map((r) => (
                    <th key={r.raterId} className="px-3 py-3.5 whitespace-nowrap text-center">
                      {r.raterName}
                    </th>
                  ))}
                  {/* Interactive score column for current logged-in rater */}
                  <th className="px-4 py-3.5 whitespace-nowrap text-center bg-amber-50/50 text-[#7A0C0C]">
                    Your Score
                  </th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Reference Sum</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Round Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCandidates.map((c) => {
                  const myScoreObj = c.scores[currentUserEmail];
                  const myScore = myScoreObj ? myScoreObj.score : null;

                  return (
                    <tr key={c.submissionId} className="hover:bg-stone-50/70 transition-colors">
                      {/* Candidate Column */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(c)}
                          className="text-left font-semibold text-stone-900 hover:text-[#7A0C0C] transition-colors block"
                        >
                          {c.applicantName}
                        </button>
                        <span className="text-[11px] text-stone-400 block">{c.applicantEmail}</span>
                      </td>

                      {/* Assigned Brothers Column */}
                      {round === "application" && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {c.assignedBrothers && c.assignedBrothers.length > 0 ? (
                              c.assignedBrothers.map((bEmail) => (
                                <span
                                  key={bEmail}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200"
                                  title={bEmail}
                                >
                                  <span className="max-w-[90px] truncate">{bEmail.split("@")[0]}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnassignBrother(c.submissionId, bEmail);
                                    }}
                                    className="text-stone-400 hover:text-red-600 transition cursor-pointer"
                                    title={`Remove ${bEmail}`}
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-300 text-[11px] italic">None</span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalTarget(c);
                                setAssignEmailInput("");
                                setAssignError("");
                              }}
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#7A0C0C] hover:text-[#5C0A0A] bg-[#7A0C0C]/5 hover:bg-[#7A0C0C]/10 px-1.5 py-0.5 rounded-md transition cursor-pointer"
                              title="Assign brother for review"
                            >
                              <UserPlus size={10} /> Assign
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Other Raters' individual scores */}
                      {raters.map((r) => {
                        const scoreData = c.scores[r.raterId];
                        return (
                          <td key={r.raterId} className="px-3 py-4 text-center whitespace-nowrap">
                            {scoreData ? (
                              <span
                                title={scoreData.note ? `Note: "${scoreData.note}"` : undefined}
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  scoreData.score > 0
                                    ? "bg-emerald-100 text-emerald-800"
                                    : scoreData.score === 0
                                    ? "bg-stone-100 text-stone-700"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {scoreData.score > 0 ? `+${scoreData.score}` : scoreData.score}
                              </span>
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Current Admin Interactive Score Pill Selector */}
                      <td className="px-4 py-4 text-center whitespace-nowrap bg-amber-50/30">
                        <div className="inline-flex items-center gap-1">
                          {SCORE_OPTIONS.map((val) => {
                            const isSelected = myScore === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleRate(c.submissionId, val, myScoreObj?.note ?? undefined)}
                                className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                                  isSelected
                                    ? "bg-[#7A0C0C] text-white shadow-xs scale-105"
                                    : "bg-white border border-stone-200 text-stone-600 hover:border-[#7A0C0C]/50"
                                }`}
                              >
                                {val > 0 ? `+${val}` : val}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() =>
                              setNoteModalTarget({
                                submissionId: c.submissionId,
                                applicantName: c.applicantName,
                                currentScore: myScore,
                                currentNote: myScoreObj?.note || "",
                              })
                            }
                            title="Add/Edit rater note"
                            className={`p-1.5 rounded-lg transition-colors ${
                              myScoreObj?.note ? "text-amber-600 bg-amber-100" : "text-stone-300 hover:text-stone-600"
                            }`}
                          >
                            <MessageSquare size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Reference Sum (Non-averaged, purely sortable reference) */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className="font-bold text-stone-800 text-xs px-2.5 py-1 rounded-md bg-stone-100">
                          {c.referenceSum > 0 ? `+${c.referenceSum}` : c.referenceSum}
                        </span>
                      </td>

                      {/* Round Status & Override indicator */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <select
                            value={c.status}
                            onChange={(e) => handleOverride(c.submissionId, e.target.value)}
                            className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border outline-none ${
                              c.status === advanceStatusKey
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : c.status === rejectStatusKey
                                ? "bg-stone-100 text-stone-600 border-stone-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <option value={advanceStatusKey}>{advanceStatusLabel}</option>
                            <option value={rejectStatusKey}>{rejectStatusLabel}</option>
                            <option value="pending">Pending</option>
                            <option value="pending_review">Pending Review</option>
                          </select>

                          {c.isOverridden && (
                            <span
                              title="Status was manually overridden by an admin"
                              className="text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md"
                            >
                              Overridden
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(c)}
                          className="text-xs text-stone-500 hover:text-[#7A0C0C] font-semibold inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Set Cutoff Tool ── */}
      {showCutoffModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#7A0C0C]" />
                <h3 className="text-base font-bold text-stone-900">Set Cutoff & Bulk Decide</h3>
              </div>
              <button onClick={() => setShowCutoffModal(false)} className="text-stone-400 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-stone-600">
                Select the numeric column to filter on and set a threshold. Candidates meeting or exceeding the
                cutoff will be marked <strong>{advanceStatusLabel}</strong>, while candidates below will be
                marked <strong>{rejectStatusLabel}</strong>. You can manually override individual candidates afterward.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Filter Column</label>
                  <select
                    value={cutoffColumn}
                    onChange={(e) => setCutoffColumn(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#7A0C0C]"
                  >
                    <option value="sum">Reference Sum (Σ Scores)</option>
                    {raters.map((r) => (
                      <option key={r.raterId} value={r.raterId}>
                        {r.raterName}'s Score
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Cutoff Threshold (&gt;= Value)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={cutoffThreshold}
                    onChange={(e) => setCutoffThreshold(Number(e.target.value))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#7A0C0C]"
                  />
                </div>
              </div>

              {/* Live Preview Split Box */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-800 block mb-2 uppercase text-[10px] tracking-wider">
                  Live Split Preview ({candidates.length} Total Candidates)
                </span>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                    <span className="text-xl font-bold text-emerald-800 block">{cutoffPreview.above.length}</span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {advanceStatusLabel} (&gt;= {cutoffThreshold})
                    </span>
                  </div>
                  <div className="p-3 bg-stone-100 rounded-lg border border-stone-300 text-center">
                    <span className="text-xl font-bold text-stone-800 block">{cutoffPreview.below.length}</span>
                    <span className="text-[11px] font-semibold text-stone-600">
                      {rejectStatusLabel} (&lt; {cutoffThreshold})
                    </span>
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-stone-200 text-[11px]">
                  {cutoffPreview.above.map((c) => (
                    <div key={c.submissionId} className="py-1 flex justify-between text-emerald-900">
                      <span>{c.applicantName}</span>
                      <span className="font-semibold">
                        Score: {cutoffColumn === "sum" ? c.referenceSum : c.scores[cutoffColumn]?.score ?? 0}
                      </span>
                    </div>
                  ))}
                  {cutoffPreview.below.map((c) => (
                    <div key={c.submissionId} className="py-1 flex justify-between text-stone-500">
                      <span>{c.applicantName}</span>
                      <span className="font-semibold">
                        Score: {cutoffColumn === "sum" ? c.referenceSum : c.scores[cutoffColumn]?.score ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 mt-4">
              <button
                type="button"
                onClick={() => setShowCutoffModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCutoff}
                disabled={applyingCutoff || candidates.length === 0}
                className="px-5 py-2 text-xs font-bold tracking-wider uppercase bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white rounded-lg disabled:opacity-50"
              >
                {applyingCutoff ? "Applying…" : "Apply Cutoff & Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-Over Drawer: Candidate Full Details ── */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A0C0C]">
                    Candidate Application
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">{selectedCandidate.applicantName}</h3>
                  <span className="text-xs text-stone-400">{selectedCandidate.applicantEmail}</span>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status and scoring breakdown */}
              <div className="py-6 border-b border-stone-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-600">Current Status</span>
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-[#7A0C0C]">
                    {selectedCandidate.status}
                  </span>
                </div>

                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-xs font-bold text-stone-700 block mb-2">
                    {roundTitle} — Individual Scores
                  </span>
                  <div className="space-y-1.5">
                    {raters.map((r) => {
                      const sc = selectedCandidate.scores[r.raterId];
                      return (
                        <div key={r.raterId} className="flex items-center justify-between text-xs">
                          <span className="text-stone-600">{r.raterName}</span>
                          <span className="font-semibold text-stone-900">
                            {sc ? (sc.score > 0 ? `+${sc.score}` : sc.score) : "Not scored"}
                            {sc?.note && <span className="text-stone-400 text-[10px] ml-1.5">({sc.note})</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assigned Brothers for Review */}
                {round === "application" && (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                        <Users size={13} className="text-[#7A0C0C]" />
                        Assigned Brother Reviewers
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignModalTarget(selectedCandidate);
                          setAssignEmailInput("");
                          setAssignError("");
                        }}
                        className="text-[11px] font-semibold text-[#7A0C0C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus size={12} /> Manage Assignments
                      </button>
                    </div>
                    {selectedCandidate.assignedBrothers && selectedCandidate.assignedBrothers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedCandidate.assignedBrothers.map((bEmail) => (
                          <span
                            key={bEmail}
                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white text-stone-700 border border-stone-200"
                          >
                            {bEmail}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-400 italic">No brothers currently assigned to this candidate.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Candidate Answers */}
              <div className="py-6 space-y-4 text-xs">
                <h4 className="font-bold text-stone-900 text-sm">Application Responses</h4>
                {Object.entries(selectedCandidate.answers).map(([key, val]) => {
                  if (!val || typeof val !== "string") return null;
                  const isUrl = val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/uploads/");
                  return (
                    <div key={key} className="p-3 bg-stone-50/70 rounded-xl border border-stone-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A0C0C] block mb-1">
                        {key}
                      </span>
                      {isUrl ? (
                        <a
                          href={val}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7A0C0C] font-semibold underline inline-flex items-center gap-1"
                        >
                          View Uploaded Document <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{val}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-6 py-2 bg-stone-900 text-white text-xs font-bold tracking-wider uppercase rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add/Edit Rater Note ── */}
      {noteModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200 text-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Add Note for {noteModalTarget.applicantName}
            </h3>
            <p className="text-stone-500 mb-3">Visible to all raters and admins in this round.</p>
            <textarea
              rows={4}
              placeholder="Candidate feedback, interview highlights, or reservations…"
              value={noteModalTarget.currentNote}
              onChange={(e) =>
                setNoteModalTarget((prev) => (prev ? { ...prev, currentNote: e.target.value } : null))
              }
              className="w-full border border-stone-200 rounded-xl p-3 outline-none focus:border-[#7A0C0C] resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModalTarget(null)}
                className="px-4 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (noteModalTarget.currentScore !== null) {
                    await handleRate(
                      noteModalTarget.submissionId,
                      noteModalTarget.currentScore,
                      noteModalTarget.currentNote,
                    );
                  }
                  setNoteModalTarget(null);
                }}
                className="px-5 py-2 font-bold tracking-wider uppercase bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white rounded-lg"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Assign Brothers for Review ── */}
      {assignModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#7A0C0C]" />
                <h3 className="text-sm font-bold text-stone-900">
                  Assign Reviewers: {assignModalTarget.applicantName}
                </h3>
              </div>
              <button
                onClick={() => {
                  setAssignModalTarget(null);
                  setAssignError("");
                }}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-stone-500 mt-3 mb-4">
              Enter a brother's <strong>@umich.edu</strong> email address. This application will appear in their Brother Portal queue for review and scoring.
            </p>

            {/* Currently assigned brothers */}
            <div className="mb-4">
              <label className="font-bold text-stone-700 block mb-1.5 uppercase text-[10px] tracking-wider">
                Currently Assigned Brothers ({assignModalTarget.assignedBrothers?.length || 0})
              </label>
              {assignModalTarget.assignedBrothers && assignModalTarget.assignedBrothers.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {assignModalTarget.assignedBrothers.map((bEmail) => (
                    <div
                      key={bEmail}
                      className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200"
                    >
                      <span className="font-medium text-stone-800">{bEmail}</span>
                      <button
                        type="button"
                        onClick={() => handleUnassignBrother(assignModalTarget.submissionId, bEmail)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-xl text-center text-stone-400 italic">
                  No brothers currently assigned to this candidate.
                </div>
              )}
            </div>

            {/* Add brother form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAssignBrother(assignModalTarget.submissionId, assignEmailInput);
              }}
              className="space-y-3 pt-3 border-t border-stone-100"
            >
              <div>
                <label className="font-bold text-stone-700 block mb-1">Add Brother by @umich.edu Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="uniqname@umich.edu"
                    value={assignEmailInput}
                    onChange={(e) => {
                      setAssignEmailInput(e.target.value);
                      setAssignError("");
                    }}
                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#7A0C0C] text-xs"
                  />
                  <button
                    type="submit"
                    disabled={assigningLoading || !assignEmailInput.trim()}
                    className="px-4 py-2 font-bold uppercase tracking-wider bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white rounded-xl disabled:opacity-50 transition cursor-pointer shrink-0"
                  >
                    {assigningLoading ? "Assigning..." : "Assign"}
                  </button>
                </div>
                {assignError && (
                  <p className="text-red-600 text-[11px] mt-1 font-medium">{assignError}</p>
                )}
              </div>
            </form>

            <div className="mt-5 pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAssignModalTarget(null);
                  setAssignError("");
                }}
                className="px-5 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Application Builder Component ────────────────────────────────────────

function ApplicationBuilderTab({
  form,
  setForm,
  saving,
  statusMsg,
  onSave,
  onToggleLock,
}: {
  form: CycleForm;
  setForm: React.Dispatch<React.SetStateAction<CycleForm | null>>;
  saving: boolean;
  statusMsg: { type: "ok" | "err"; text: string } | null;
  onSave: (override?: CycleForm) => void;
  onToggleLock: () => void;
}) {
  function updateSectionLabel(sectionId: string, label: string) {
    setForm((prev) =>
      prev ? { ...prev, questions: prev.questions.map((s) => (s.id === sectionId ? { ...s, label } : s)) } : null,
    );
  }

  function addSection() {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            questions: [...prev.questions, { id: newSectionId(), label: "New Section", fields: [] }],
          }
        : null,
    );
  }

  function deleteSection(sectionId: string) {
    if (!confirm("Delete section and all its questions?")) return;
    setForm((prev) =>
      prev ? { ...prev, questions: prev.questions.filter((s) => s.id !== sectionId) } : null,
    );
  }

  function updateField(sectionId: string, fieldId: string, patch: Partial<ConfigField>) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((s) =>
              s.id !== sectionId
                ? s
                : {
                    ...s,
                    fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
                  },
            ),
          }
        : null,
    );
  }

  function addField(sectionId: string) {
    const newF: ConfigField = {
      id: newFieldId(),
      type: "text",
      label: "New Question",
      required: false,
    };
    setForm((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((s) =>
              s.id !== sectionId ? s : { ...s, fields: [...s.fields, newF] },
            ),
          }
        : null,
    );
  }

  function deleteField(sectionId: string, fieldId: string) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((s) =>
              s.id !== sectionId ? s : { ...s, fields: s.fields.filter((f) => f.id !== fieldId) },
            ),
          }
        : null,
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Scheduler & Lock Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                form.is_locked ? "bg-amber-100 text-[#7A0C0C]" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {form.is_locked ? <Lock size={20} /> : <Unlock size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Application Submissions State</h3>
              <p className="text-xs text-stone-500">
                {form.is_locked
                  ? "Locked. No one can submit applications right now, overriding scheduled dates."
                  : "Unlocked. Submissions allowed within scheduled window."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleLock}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              form.is_locked
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-stone-950"
            }`}
          >
            {form.is_locked ? "Unlock Form" : "Lock Form"}
          </button>
        </div>

        {/* Datetime Scheduler */}
        <div>
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">
            Application Window Scheduler
          </h4>
          <p className="text-xs text-stone-500 mb-4">
            Leave dates blank to keep the form open indefinitely while the cycle is open and unlocked.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Opens At</label>
              <input
                type="datetime-local"
                value={form.opens_at ? form.opens_at.slice(0, 16) : ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, opens_at: e.target.value ? new Date(e.target.value).toISOString() : null } : null,
                  )
                }
                className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#7A0C0C]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Closes At (Deadline)</label>
              <input
                type="datetime-local"
                value={form.closes_at ? form.closes_at.slice(0, 16) : ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, closes_at: e.target.value ? new Date(e.target.value).toISOString() : null } : null,
                  )
                }
                className="w-full text-xs border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-[#7A0C0C]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sections and Questions Builder */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900">Application Form Questions</h3>
          <button
            onClick={addSection}
            className="inline-flex items-center gap-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            <Plus size={14} /> Add Section
          </button>
        </div>

        {form.questions.map((section, sIdx) => (
          <div key={section.id || sIdx} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A0C0C] bg-[#7A0C0C]/5 px-2 py-0.5 rounded">
                  Section {sIdx + 1}
                </span>
                <input
                  type="text"
                  value={section.label}
                  onChange={(e) => updateSectionLabel(section.id, e.target.value)}
                  className="font-bold text-sm text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#7A0C0C] outline-none px-1"
                />
              </div>
              <button
                type="button"
                onClick={() => deleteSection(section.id)}
                className="text-stone-300 hover:text-red-500 p-1 rounded"
                title="Delete section"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Fields List */}
            <div className="space-y-3">
              {(section.fields || []).map((f) => (
                <div key={f.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Question / Label"
                      value={f.label}
                      onChange={(e) => updateField(section.id, f.id, { label: e.target.value })}
                      className="flex-1 text-xs font-semibold text-stone-900 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#7A0C0C]"
                    />

                    <select
                      value={f.type}
                      disabled={f.core}
                      onChange={(e) => updateField(section.id, f.id, { type: e.target.value as FieldType })}
                      className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#7A0C0C] disabled:opacity-50"
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Long Text</option>
                      <option value="select">Dropdown</option>
                      <option value="file">File Upload</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                    </select>

                    <label className="flex items-center gap-1 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => updateField(section.id, f.id, { required: e.target.checked })}
                        className="accent-[#7A0C0C]"
                      />
                      Required
                    </label>

                    {!f.core && (
                      <button
                        type="button"
                        onClick={() => deleteField(section.id, f.id)}
                        className="text-stone-300 hover:text-red-500 p-1"
                        title="Delete question"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Options or Hint */}
                  {f.type === "select" && (
                    <input
                      type="text"
                      placeholder="Comma-separated options (e.g. Option 1, Option 2, Option 3)"
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) =>
                        updateField(section.id, f.id, {
                          options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      className="w-full text-xs text-stone-600 bg-white border border-stone-200 rounded-lg px-2.5 py-1 outline-none focus:border-[#7A0C0C]"
                    />
                  )}
                  {(f.type === "text" || f.type === "textarea") && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Placeholder text (optional)…"
                        value={f.placeholder ?? ""}
                        onChange={(e) => updateField(section.id, f.id, { placeholder: e.target.value })}
                        className="text-xs text-stone-600 bg-white border border-stone-200 rounded-lg px-2.5 py-1 outline-none focus:border-[#7A0C0C]"
                      />
                      <input
                        type="text"
                        placeholder="Helper hint (optional)…"
                        value={f.hint ?? ""}
                        onChange={(e) => updateField(section.id, f.id, { hint: e.target.value })}
                        className="text-xs text-stone-600 bg-white border border-stone-200 rounded-lg px-2.5 py-1 outline-none focus:border-[#7A0C0C]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addField(section.id)}
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#7A0C0C] hover:underline"
            >
              <Plus size={13} /> Add Question to Section
            </button>
          </div>
        ))}
      </div>

      {/* Save Action Bar */}
      <div className="sticky bottom-6 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusMsg && (
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                statusMsg.type === "ok" ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {statusMsg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {statusMsg.text}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSave()}
          disabled={saving}
          className="px-8 py-2.5 bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          {saving ? "Saving Changes…" : "Save Form Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Tab: Status Messages Customization Component ──────────────────────────────

function StatusMessagesTab({
  form,
  setForm,
  saving,
  statusMsg,
  onSave,
}: {
  form: CycleForm;
  setForm: React.Dispatch<React.SetStateAction<CycleForm | null>>;
  saving: boolean;
  statusMsg: { type: "ok" | "err"; text: string } | null;
  onSave: (override?: CycleForm) => void;
}) {
  const currentMessages = form.status_messages || {};

  function updateMsg(stage: string, statusKey: string, field: "title" | "body", value: string) {
    setForm((prev) => {
      if (!prev) return null;
      const msgs = { ...(prev.status_messages || {}) };
      if (!msgs[stage]) msgs[stage] = {};
      if (!msgs[stage][statusKey]) msgs[stage][statusKey] = { title: "", body: "" };
      msgs[stage][statusKey] = {
        ...msgs[stage][statusKey],
        [field]: value,
      };
      return { ...prev, status_messages: msgs };
    });
  }

  const sections = [
    {
      stage: "application",
      stageTitle: "1. Application Round Checkpoint",
      items: [
        { key: "pending_review", label: "Pending Review Message" },
        { key: "advanced_to_round_1", label: "Advanced to Round 1 Message" },
        { key: "not_selected_application", label: "Not Selected Message" },
      ],
    },
    {
      stage: "round1",
      stageTitle: "2. Round 1 Interviews Checkpoint",
      items: [
        { key: "pending", label: "Round 1 Pending Review Message" },
        { key: "advanced", label: "Advanced to Round 2 Message" },
        { key: "not_selected", label: "Not Selected for Round 2 Message" },
      ],
    },
    {
      stage: "round2",
      stageTitle: "3. Round 2 Interviews & Final Decisions Checkpoint",
      items: [
        { key: "pending", label: "Final Deliberation Pending Message" },
        { key: "offered_bid", label: "Official Bid Extended Message 🎉" },
        { key: "not_selected", label: "Not Extended Bid Message" },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs">
        <h3 className="text-base font-bold text-stone-900">Custom Applicant Status Messages</h3>
        <p className="text-xs text-stone-500 mt-1">
          Customize the exact title and copy displayed to applicants at each stage of the recruitment
          pipeline. Changes are immediately reflected on the applicant status page.
        </p>
      </div>

      {sections.map((sec) => (
        <div key={sec.stage} className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-6">
          <h4 className="text-sm font-bold text-[#7A0C0C] uppercase tracking-wider pb-2 border-b border-stone-100">
            {sec.stageTitle}
          </h4>

          <div className="space-y-6">
            {sec.items.map((it) => {
              const val = currentMessages[sec.stage]?.[it.key] || { title: "", body: "" };
              return (
                <div key={it.key} className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-3">
                  <span className="text-xs font-bold text-stone-800 block">{it.label}</span>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-0.5">Title</label>
                    <input
                      type="text"
                      value={val.title || ""}
                      onChange={(e) => updateMsg(sec.stage, it.key, "title", e.target.value)}
                      placeholder="Title heading displayed to applicant"
                      className="w-full text-xs font-semibold text-stone-900 bg-white border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#7A0C0C]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-0.5">Body Message</label>
                    <textarea
                      rows={3}
                      value={val.body || ""}
                      onChange={(e) => updateMsg(sec.stage, it.key, "body", e.target.value)}
                      placeholder="Paragraph text explaining next steps or decision…"
                      className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded-lg p-3 outline-none focus:border-[#7A0C0C] resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Save Action Bar */}
      <div className="sticky bottom-6 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusMsg && (
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                statusMsg.type === "ok" ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {statusMsg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {statusMsg.text}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSave()}
          disabled={saving}
          className="px-8 py-2.5 bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          {saving ? "Saving Messages…" : "Save Messages"}
        </button>
      </div>
    </div>
  );
}

// ── Tab: Cycle Settings Component ─────────────────────────────────────────────

function CycleSettingsTab({
  cycle,
  onUpdateCycle,
  onOpenDeleteModal,
}: {
  cycle: RecruitmentCycle;
  onUpdateCycle: (patch: { name?: string; status?: "draft" | "open" | "closed" | "archived" }) => Promise<void>;
  onOpenDeleteModal: () => void;
}) {
  const [name, setName] = useState(cycle.name);
  const [status, setStatus] = useState(cycle.status);
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setName(cycle.name);
    setStatus(cycle.status);
  }, [cycle]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    setStatusMsg(null);
    try {
      await onUpdateCycle({ name: name.trim(), status });
      setStatusMsg("Settings saved.");
    } catch {
      setStatusMsg("Error updating settings.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs">
        <h3 className="text-base font-bold text-stone-900 mb-1">Recruitment Cycle Settings</h3>
        <p className="text-xs text-stone-500 mb-6">Manage cycle name and public recruitment visibility.</p>

        <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">Cycle Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-semibold text-stone-900 border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#7A0C0C]"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Cycle Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full text-xs font-semibold text-stone-900 border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#7A0C0C]"
            >
              <option value="draft">Draft (Private, not visible to applicants)</option>
              <option value="open">Open (Active recruitment cycle; closes other cycles)</option>
              <option value="closed">Closed (Applications closed)</option>
              <option value="archived">Archived (Read-only historical record)</option>
            </select>
            {status === "open" && (
              <p className="text-[11px] text-amber-600 mt-1">
                Note: Setting this cycle to <strong>Open</strong> will automatically set any other
                previously open cycle to Closed.
              </p>
            )}
          </div>

          {statusMsg && <p className="text-xs text-emerald-600 font-semibold">{statusMsg}</p>}

          <button
            type="submit"
            disabled={updating}
            className="px-6 py-2.5 bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            {updating ? "Saving…" : "Save Cycle Settings"}
          </button>
        </form>
      </div>

      {/* Danger Zone: Delete Cycle */}
      <div className="bg-red-50/70 rounded-2xl p-6 border border-red-200 shadow-xs">
        <h4 className="text-sm font-bold text-red-900 mb-1">Danger Zone</h4>
        <p className="text-xs text-red-700 mb-4 leading-relaxed">
          Permanently delete this recruitment cycle, its form questions, all candidate submissions, rater
          scores, and evaluations. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={onOpenDeleteModal}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-xs"
        >
          Delete This Cycle
        </button>
      </div>
    </div>
  );
}
