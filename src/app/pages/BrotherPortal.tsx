import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, CheckCircle2, Clock, FileText, ExternalLink, 
  Search, Award, MessageSquare, AlertCircle, ChevronRight,
  Sparkles, Filter, RefreshCw, Download, Heart, Briefcase,
  Lightbulb, BookOpen, Check
} from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";
import { useAuth } from "@/app/context/AuthContext";
import { resolveApplicantPhoto } from "@/app/utils/applicantPhoto";

type AssignedSubmission = {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  major?: string;
  minor?: string;
  gpa?: string;
  grad_term?: string;
  pronouns?: string;
  resume_url?: string;
  photo_url?: string;
  is_bba?: boolean;
  status: string;
  responses?: Record<string, any>;
  assigned_at?: string;
  assigned_by?: string;
  assigned_brothers?: string[];
  question_labels?: Record<string, string>;
  current_round?: "application" | "round1" | "round2";
  current_round_name?: string;
  existingScore?: {
    score: number;
    criteria_scores?: Record<string, number> | null;
    notes?: string;
    round_name: string;
  } | null;
};

const SCORE_OPTIONS = [
  { value: -1, label: "-1.0", desc: "Strong No", color: "bg-red-900/10 text-red-700 border-red-200 hover:bg-red-900/20 active:bg-red-900/30" },
  { value: -0.5, label: "-0.5", desc: "Weak No", color: "bg-amber-900/10 text-amber-700 border-amber-200 hover:bg-amber-900/20 active:bg-amber-900/30" },
  { value: 0, label: "0.0", desc: "Neutral", color: "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200 active:bg-stone-300" },
  { value: 0.5, label: "+0.5", desc: "Weak Yes", color: "bg-blue-900/10 text-blue-700 border-blue-200 hover:bg-blue-900/20 active:bg-blue-900/30" },
  { value: 1, label: "+1.0", desc: "Strong Yes", color: "bg-emerald-900/10 text-emerald-700 border-emerald-200 hover:bg-emerald-900/20 active:bg-emerald-900/30" },
];

export const formatScoreNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "—";
  if (num === 0) return "0.0";
  const abs = Math.abs(num);
  const formatted = Number.isInteger(abs) ? `${abs}.0` : `${Math.round(abs * 1000) / 1000}`;
  return num > 0 ? `+${formatted}` : `-${formatted}`;
};

export const formatScoreVal = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return "—";
  if (Number.isInteger(val)) return val > 0 ? `+${val}.0` : `${val}.0`;
  const rounded = Math.round(val * 1000) / 1000;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
};

export const getWordCount = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export const extractFRQData = (
  responses: Record<string, any> = {},
  questionLabels: Record<string, string> = {},
) => {
  let artifactFile: { url: string; prompt: string } | null = null;
  let frq1: { key: string; prompt: string; text: string } | null = null;
  let frq2: { key: string; prompt: string; text: string } | null = null;
  let frq3: { key: string; prompt: string; text: string } | null = null;

  for (const [k, v] of Object.entries(responses)) {
    const prompt = (questionLabels[k] || k).trim();
    const promptLower = prompt.toLowerCase();
    const keyLower = k.toLowerCase();
    const strVal =
      typeof v === "string"
        ? v.trim()
        : v && typeof v === "object"
        ? Array.isArray(v)
          ? v.join(", ")
          : JSON.stringify(v)
        : "";

    // 1. Personal artifact file/upload (not the explanation)
    if (
      !artifactFile &&
      (promptLower.includes("artifact") || keyLower.includes("artifact")) &&
      !promptLower.includes("explain") &&
      !promptLower.includes("100 word")
    ) {
      if (strVal) {
        artifactFile = { url: strVal, prompt };
      }
    }

    // 2. FRQ 1: Explain your artifact in 100 words or less
    if (
      !frq1 &&
      ((promptLower.includes("artifact") &&
        (promptLower.includes("explain") || promptLower.includes("100 word"))) ||
        (keyLower.includes("artifact") && keyLower.includes("explain")))
    ) {
      frq1 = { key: k, prompt, text: strVal };
    }

    // 3. FRQ 2: Small business
    if (
      !frq2 &&
      (promptLower.includes("small business") ||
        promptLower.includes("choose an industry") ||
        promptLower.includes("fill a gap") ||
        keyLower.includes("small_business") ||
        keyLower.includes("business"))
    ) {
      frq2 = { key: k, prompt, text: strVal };
    }

    // 4. FRQ 3: Why PGN
    if (
      !frq3 &&
      (promptLower.includes("why pgn") ||
        promptLower.includes("why do you want to join phi gamma nu") ||
        promptLower.includes("why phi gamma nu") ||
        keyLower.includes("whypgn") ||
        keyLower === "why_pgn")
    ) {
      frq3 = { key: k, prompt, text: strVal };
    }
  }

  return { artifactFile, frq1, frq2, frq3 };
};

function BrotherPortalInner() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssignedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSub, setSelectedSub] = useState<AssignedSubmission | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "reviewed">("all");

  // Scoring state for selected candidate
  const [scoreVal, setScoreVal] = useState<number | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number | null>>({
    artifact_passion: null,
    business_feasibility: null,
    business_creativity: null,
    why_pgn_interest: null,
  });
  const [notesVal, setNotesVal] = useState("");
  const [savingScore, setSavingScore] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live computed average across the 4 criteria
  const computedAverageScore = useMemo(() => {
    const vals = [
      criteriaScores.artifact_passion,
      criteriaScores.business_feasibility,
      criteriaScores.business_creativity,
      criteriaScores.why_pgn_interest,
    ];
    if (vals.some((v) => v === null || v === undefined)) return null;
    const sum = (vals as number[]).reduce((a, b) => a + b, 0);
    return Math.round((sum / 4) * 1000) / 1000;
  }, [criteriaScores]);

  const completedCriteriaCount = useMemo(() => {
    return [
      criteriaScores.artifact_passion,
      criteriaScores.business_feasibility,
      criteriaScores.business_creativity,
      criteriaScores.why_pgn_interest,
    ].filter((v) => v !== null && v !== undefined).length;
  }, [criteriaScores]);

  const fetchAssigned = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recruitment/brother/assigned");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assigned candidates");
      setSubmissions(data.submissions || []);
      // If we had a selected candidate, update its reference
      if (selectedSub) {
        const updated = (data.submissions || []).find((s: AssignedSubmission) => s.id === selectedSub.id);
        if (updated) {
          setSelectedSub(updated);
          const existing = updated.existingScore;
          setScoreVal(existing ? existing.score : null);
          setNotesVal(existing?.notes || "");
          if (existing?.criteria_scores) {
            setCriteriaScores({
              artifact_passion: existing.criteria_scores.artifact_passion ?? null,
              business_feasibility: existing.criteria_scores.business_feasibility ?? null,
              business_creativity: existing.criteria_scores.business_creativity ?? null,
              why_pgn_interest: existing.criteria_scores.why_pgn_interest ?? null,
            });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const handleSelectCandidate = (sub: AssignedSubmission) => {
    setSelectedSub(sub);
    const existing = sub.existingScore;
    setScoreVal(existing !== undefined && existing !== null ? existing.score : null);
    setNotesVal(existing?.notes || "");
    setSaveSuccess(false);

    if (existing?.criteria_scores) {
      setCriteriaScores({
        artifact_passion: existing.criteria_scores.artifact_passion ?? null,
        business_feasibility: existing.criteria_scores.business_feasibility ?? null,
        business_creativity: existing.criteria_scores.business_creativity ?? null,
        why_pgn_interest: existing.criteria_scores.why_pgn_interest ?? null,
      });
    } else {
      setCriteriaScores({
        artifact_passion: null,
        business_feasibility: null,
        business_creativity: null,
        why_pgn_interest: null,
      });
    }
  };

  const handleSaveScore = async () => {
    if (!selectedSub) return;
    const isAppRound = !selectedSub.current_round || selectedSub.current_round === "application";

    let payloadScore: number;
    let payloadCriteria: Record<string, number> | null = null;

    if (isAppRound) {
      if (computedAverageScore === null) return;
      payloadScore = computedAverageScore;
      payloadCriteria = {
        artifact_passion: criteriaScores.artifact_passion!,
        business_feasibility: criteriaScores.business_feasibility!,
        business_creativity: criteriaScores.business_creativity!,
        why_pgn_interest: criteriaScores.why_pgn_interest!,
      };
    } else {
      if (scoreVal === null) return;
      payloadScore = scoreVal;
    }

    setSavingScore(true);
    setSaveSuccess(false);
    try {
      const targetRound = selectedSub.current_round || "application";
      const targetRoundName = selectedSub.current_round_name || "Application";
      const res = await fetch("/api/recruitment/brother/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          score: payloadScore,
          criteriaScores: payloadCriteria,
          notes: notesVal,
          round: targetRound,
          roundName: targetRoundName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save score");
      
      setSaveSuccess(true);
      setScoreVal(payloadScore);

      // Update local state
      const updatedExisting = {
        score: payloadScore,
        criteria_scores: payloadCriteria,
        notes: notesVal,
        round_name: targetRoundName,
      };

      const updatedList = submissions.map((s) => {
        if (s.id === selectedSub.id) {
          return {
            ...s,
            existingScore: updatedExisting,
          };
        }
        return s;
      });
      setSubmissions(updatedList);
      setSelectedSub({
        ...selectedSub,
        existingScore: updatedExisting,
      });
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert("Error saving evaluation: " + err.message);
    } finally {
      setSavingScore(false);
    }
  };

  const userEmail = (user?.email || "").toLowerCase();
  const isCandidateAssignedToMe = (sub: any) =>
    Array.isArray(sub.assigned_brothers) &&
    sub.assigned_brothers.some((e: string) => (e || "").toLowerCase() === userEmail);

  const assignedToMeCount = useMemo(() => {
    return submissions.filter(isCandidateAssignedToMe).length;
  }, [submissions, userEmail]);

  // If the user is an admin, let them toggle between their own assignments and all candidates
  const [adminScope, setAdminScope] = useState<"assigned_to_me" | "all">("all");
  const [hasInitializedScope, setHasInitializedScope] = useState(false);

  useEffect(() => {
    if (!hasInitializedScope && submissions.length > 0 && user?.isAdmin) {
      if (assignedToMeCount > 0) {
        setAdminScope("assigned_to_me");
      } else {
        setAdminScope("all");
      }
      setHasInitializedScope(true);
    }
  }, [submissions, user?.isAdmin, hasInitializedScope, assignedToMeCount]);

  // Base list depending on scope
  const scopedSubmissions = useMemo(() => {
    if (user?.isAdmin && adminScope === "assigned_to_me") {
      return submissions.filter(isCandidateAssignedToMe);
    }
    return submissions;
  }, [submissions, user?.isAdmin, adminScope, userEmail]);

  // Filtered submissions (search + status)
  const filtered = useMemo(() => {
    return scopedSubmissions.filter((s: any) => {
      const q = search.toLowerCase();
      const name = (s.full_name || s.applicant_name || "").toLowerCase();
      const email = (s.email || s.applicant_email || "").toLowerCase();
      const major = (s.major || s.answers?.major || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || major.includes(q);
      
      const hasScore = Boolean(s.existingScore || s.my_score);
      if (!matchesSearch) return false;
      if (filterMode === "pending") return !hasScore;
      if (filterMode === "reviewed") return hasScore;
      return true;
    });
  }, [scopedSubmissions, search, filterMode]);

  // Auto-sync selected candidate when scope or filters change
  useEffect(() => {
    if (filtered.length > 0) {
      const stillInList = selectedSub && filtered.some((s) => s.id === selectedSub.id);
      if (!stillInList) {
        setSelectedSub(filtered[0]);
      }
    } else {
      setSelectedSub(null);
    }
  }, [adminScope, filterMode, search]);

  const totalAssigned = scopedSubmissions.length;
  const totalReviewed = scopedSubmissions.filter((s: any) => Boolean(s.existingScore || s.my_score)).length;
  const totalPending = totalAssigned - totalReviewed;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-[#1a0303] rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#7A0C0C]/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles size={14} className="text-[#F5A623]" />
                Brother Deliberation Portal
              </div>
              <h1 className="text-3xl md:text-4xl font-normal font-serif text-white tracking-tight">
                Candidate Review & Deliberations
              </h1>
              <p className="text-white/70 text-sm mt-2 max-w-xl font-sans leading-relaxed">
                Welcome, <span className="text-white font-medium">{user?.name}</span>. {user?.isAdmin ? "As an administrator, you can toggle between your direct assignments and all applicants." : "Review the applications assigned to you for this cycle."} Your scores and notes feed directly into deliberations.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
              <div className="text-center px-3 py-1">
                <div className="text-2xl font-bold text-white font-sans">{totalAssigned}</div>
                <div className="text-[11px] text-white/50 uppercase font-medium">
                  {user?.isAdmin && adminScope === "all" ? "In Cycle" : "Assigned"}
                </div>
              </div>
              <div className="w-[1px] h-8 bg-white/15" />
              <div className="text-center px-3 py-1">
                <div className="text-2xl font-bold text-emerald-400 font-sans">{totalReviewed}</div>
                <div className="text-[11px] text-white/50 uppercase font-medium">Reviewed</div>
              </div>
              <div className="w-[1px] h-8 bg-white/15" />
              <div className="text-center px-3 py-1">
                <div className="text-2xl font-bold text-[#F5A623] font-sans">{totalPending}</div>
                <div className="text-[11px] text-white/50 uppercase font-medium">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout: Left list / Right detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Candidates List */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-3">
              {/* Admin Scope Toggle (Only shown to Admins) */}
              {user?.isAdmin && (
                <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => setAdminScope("assigned_to_me")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      adminScope === "assigned_to_me"
                        ? "bg-white text-[#7A0C0C] shadow-2xs border border-stone-200"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <span>Assigned to Me</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        adminScope === "assigned_to_me"
                          ? "bg-[#7A0C0C]/10 text-[#7A0C0C]"
                          : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {assignedToMeCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminScope("all")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                      adminScope === "all"
                        ? "bg-[#7A0C0C] text-white shadow-2xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <span>All Candidates (Admin)</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        adminScope === "all"
                          ? "bg-white/20 text-white"
                          : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {submissions.length}
                    </span>
                  </button>
                </div>
              )}

              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by name, major, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/20 focus:border-[#7A0C0C] transition"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                      filterMode === "all" ? "bg-[#7A0C0C] text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    All ({scopedSubmissions.length})
                  </button>
                  <button
                    onClick={() => setFilterMode("pending")}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                      filterMode === "pending" ? "bg-[#F5A623] text-stone-900 font-semibold" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Pending ({totalPending})
                  </button>
                  <button
                    onClick={() => setFilterMode("reviewed")}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                      filterMode === "reviewed" ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    Reviewed ({totalReviewed})
                  </button>
                </div>

                <button
                  onClick={fetchAssigned}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                  title="Refresh candidates"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm text-stone-500">Loading assigned candidates...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
                <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={fetchAssigned} className="mt-3 text-xs text-red-700 underline font-semibold">
                  Try Again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center">
                <Users size={36} className="mx-auto mb-3 text-stone-300" />
                <h3 className="text-base font-medium text-stone-700">
                  {user?.isAdmin && adminScope === "assigned_to_me" && assignedToMeCount === 0
                    ? "No candidates assigned to you yet"
                    : "No candidates found"}
                </h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  {user?.isAdmin && adminScope === "assigned_to_me" && assignedToMeCount === 0 ? (
                    <>
                      You currently have no applications specifically assigned to your email. You can switch to{" "}
                      <strong className="text-stone-700">All Candidates (Admin)</strong> to view and evaluate any candidate across the cycle.
                    </>
                  ) : scopedSubmissions.length === 0 ? (
                    "You currently have no applications assigned to review. When an admin assigns candidates to your @umich.edu email, they will appear here."
                  ) : (
                    "No candidates match your current search and filter criteria."
                  )}
                </p>
                {user?.isAdmin && adminScope === "assigned_to_me" && assignedToMeCount === 0 && (
                  <button
                    type="button"
                    onClick={() => setAdminScope("all")}
                    className="mt-3.5 px-3.5 py-1.5 bg-[#7A0C0C] text-white text-xs font-semibold rounded-lg hover:bg-[#5A0808] transition shadow-2xs"
                  >
                    View All Candidates ({submissions.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((sub: any) => {
                  const isSelected = selectedSub?.id === sub.id;
                  const scoreObj = sub.existingScore || sub.my_score;
                  const hasScore = !!scoreObj;
                  const displayName = sub.full_name || sub.applicant_name || "Applicant";
                  const displayEmail = sub.email || sub.applicant_email || "";
                  const displayMajor = sub.major || sub.answers?.major || "Undeclared";
                  const displayGrad = sub.grad_term || sub.answers?.grad_term;
                  const isAssigned = isCandidateAssignedToMe(sub);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleSelectCandidate(sub)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                        isSelected
                          ? "bg-stone-900 text-white border-stone-900 shadow-md translate-x-1"
                          : "bg-white text-stone-800 border-stone-200 hover:border-stone-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-stone-900"}`}>
                            {displayName}
                          </h4>
                          <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-stone-300" : "text-stone-500"}`}>
                            {displayMajor} {displayGrad ? `• Class of '${String(displayGrad).slice(-2)}` : ""}
                          </p>
                          <p className={`text-[11px] truncate mt-0.5 ${isSelected ? "text-stone-400" : "text-stone-400"}`}>
                            {displayEmail}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            {sub.current_round_name && (
                              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                isSelected ? "bg-white/10 text-stone-200" : "bg-stone-100 text-stone-600"
                              }`}>
                                {sub.current_round_name}
                              </span>
                            )}
                            {user?.isAdmin && isAssigned && (
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isSelected
                                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                  : "bg-amber-50 text-amber-900 border border-amber-200"
                              }`}>
                                Assigned to You
                              </span>
                            )}
                            {user?.isAdmin && adminScope === "all" && !isAssigned && (
                              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md ${
                                isSelected ? "bg-white/5 text-stone-400" : "bg-stone-100 text-stone-500"
                              }`}>
                                {Array.isArray(sub.assigned_brothers) && sub.assigned_brothers.length > 0
                                  ? `${sub.assigned_brothers.length} assigned`
                                  : "Unassigned"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {hasScore ? (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : scoreObj.score > 0
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : scoreObj.score < 0
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-stone-100 text-stone-800 border border-stone-200"
                            }`}>
                              <CheckCircle2 size={11} />
                              {formatScoreNumber(scoreObj.score)}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}>
                              <Clock size={11} />
                              Pending
                            </span>
                          )}
                          <ChevronRight size={14} className={isSelected ? "text-white/60" : "text-stone-300"} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Candidate Details & Scoring Card */}
          <div className="lg:col-span-7">
            {selectedSub ? (
              <div className="space-y-6">
                
                {/* Scoring Form Card */}
                {(() => {
                  const isAppRound = !selectedSub.current_round || selectedSub.current_round === "application";
                  const parsedResponses: Record<string, any> = (() => {
                    if (!selectedSub.responses) return {};
                    if (typeof selectedSub.responses === "string") {
                      try {
                        const parsed = JSON.parse(selectedSub.responses);
                        return typeof parsed === "object" && parsed !== null ? parsed : {};
                      } catch {
                        return {};
                      }
                    }
                    return typeof selectedSub.responses === "object" ? selectedSub.responses : {};
                  })();

                  const isPhotoUrl = (str: string, promptText = "", keyText = "") => {
                    if (!str || typeof str !== "string") return false;
                    const s = str.trim();
                    if (s.startsWith("data:image/")) return true;
                    if (/\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?.*)?$/i.test(s)) return true;
                    if (s.startsWith("/uploads/photo_")) return true;
                    if (s.startsWith("/uploads/") && /photo|headshot|picture|portrait/i.test(promptText + " " + keyText)) return true;
                    return false;
                  };

                  const isDocumentUrl = (str: string) => {
                    if (!str || typeof str !== "string") return false;
                    const s = str.trim();
                    if (/\.(pdf|docx?|doc|txt|xlsx?|pptx?|csv)(\?.*)?$/i.test(s)) return true;
                    if (s.startsWith("/uploads/resume_")) return true;
                    if (s.startsWith("/uploads/")) return true;
                    return false;
                  };

                  const renderScorePills = (
                    currentVal: number | null,
                    onSelect: (val: number) => void,
                  ) => (
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {SCORE_OPTIONS.map((opt) => {
                        const isSelected = currentVal === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => onSelect(opt.value)}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isSelected
                                ? "ring-2 ring-[#7A0C0C] bg-[#7A0C0C] text-white border-[#7A0C0C] shadow-sm scale-102"
                                : `${opt.color}`
                            }`}
                          >
                            <span className="text-sm sm:text-base font-bold leading-tight">{opt.label}</span>
                            <span className={`text-[9px] sm:text-[10px] mt-0.5 leading-tight ${isSelected ? "text-white/80" : "text-stone-500"}`}>
                              {opt.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );

                  if (isAppRound) {
                    const { artifactFile, frq1, frq2, frq3 } = extractFRQData(
                      parsedResponses,
                      selectedSub.question_labels || {},
                    );

                    return (
                      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-semibold text-stone-900">
                                Application FRQ Rubric
                              </h3>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-[#7A0C0C] border border-amber-200">
                                4 Criteria Evaluation
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                              Evaluate all 3 FRQs across 4 distinct criteria. Your overall candidate score is the arithmetic mean of these 4 grades.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                                completedCriteriaCount === 4
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {completedCriteriaCount === 4 ? (
                                <CheckCircle2 size={13} className="text-emerald-600" />
                              ) : (
                                <Clock size={13} className="text-amber-600" />
                              )}
                              {completedCriteriaCount}/4 Criteria Graded
                            </span>

                            {selectedSub.existingScore && (
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                Overall: {formatScoreNumber(selectedSub.existingScore.score)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ── FRQ 1 Section ── */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-4">
                          <div className="flex items-start justify-between gap-2 border-b border-stone-200/60 pb-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A0C0C] bg-[#7A0C0C]/10 px-2.5 py-0.5 rounded-md">
                                Question 1 of 3
                              </span>
                              <h4 className="text-sm font-bold text-stone-900 mt-1.5">
                                Explain your artifact in 100 words or less.
                              </h4>
                            </div>
                            {frq1?.text && (
                              <span className="text-[10px] text-stone-500 font-mono bg-white px-2 py-0.5 rounded-md border border-stone-200 shrink-0">
                                {getWordCount(frq1.text)} words
                              </span>
                            )}
                          </div>

                          {/* Personal Artifact Display (if uploaded) */}
                          {artifactFile && (
                            <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                                <span className="flex items-center gap-1.5 text-stone-700">
                                  <Sparkles size={13} className="text-amber-500" /> Submitted Personal Artifact
                                </span>
                                {artifactFile.url && (
                                  <a
                                    href={artifactFile.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-[#7A0C0C] hover:underline inline-flex items-center gap-1 font-semibold"
                                  >
                                    <ExternalLink size={11} /> Open Original Artifact
                                  </a>
                                )}
                              </div>
                              {isPhotoUrl(artifactFile.url) ? (
                                <a href={artifactFile.url} target="_blank" rel="noopener noreferrer" className="block w-fit group">
                                  <img
                                    src={artifactFile.url}
                                    alt="Personal Artifact"
                                    className="max-h-52 rounded-xl border border-stone-200 object-cover shadow-2xs group-hover:opacity-95 transition"
                                  />
                                </a>
                              ) : isDocumentUrl(artifactFile.url) ? (
                                <a
                                  href={artifactFile.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 hover:bg-stone-100 transition"
                                >
                                  <FileText size={16} className="text-[#7A0C0C]" />
                                  <span>View Submitted Artifact Document</span>
                                  <ExternalLink size={12} className="text-stone-400" />
                                </a>
                              ) : (
                                <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                                  {artifactFile.url}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Candidate Explanation Text */}
                          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                              Candidate Response:
                            </span>
                            <p className="text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                              {frq1?.text || "No written response submitted."}
                            </p>
                          </div>

                          {/* Criterion 1: Personal meaning / passion */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                  <Heart size={14} className="text-[#7A0C0C]" />
                                  Criterion 1: Personal Meaning / Passion
                                </label>
                                <p className="text-[11px] text-stone-500 italic mt-0.5">
                                  Please score based on passion and genuineness shown in the response
                                </p>
                              </div>
                              {criteriaScores.artifact_passion !== null && (
                                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                                  {formatScoreNumber(criteriaScores.artifact_passion)}
                                </span>
                              )}
                            </div>
                            {renderScorePills(criteriaScores.artifact_passion, (val) =>
                              setCriteriaScores((prev) => ({ ...prev, artifact_passion: val }))
                            )}
                          </div>
                        </div>

                        {/* ── FRQ 2 Section ── */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-4">
                          <div className="flex items-start justify-between gap-2 border-b border-stone-200/60 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A0C0C] bg-[#7A0C0C]/10 px-2.5 py-0.5 rounded-md">
                                  Question 2 of 3
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded-md">
                                  2 Grades
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-stone-900 mt-1.5 whitespace-pre-line leading-snug">
                                Choose an industry to start a small business in.
                                {"\n"}A) Describe your business and its functions.
                                {"\n"}B) Explain the reasoning behind your choice and how the business would fill a gap within your chosen industry (200 words or less).
                              </h4>
                            </div>
                            {frq2?.text && (
                              <span className="text-[10px] text-stone-500 font-mono bg-white px-2 py-0.5 rounded-md border border-stone-200 shrink-0">
                                {getWordCount(frq2.text)} words
                              </span>
                            )}
                          </div>

                          {/* Candidate Proposal Text */}
                          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                              Candidate Response:
                            </span>
                            <p className="text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                              {frq2?.text || "No written response submitted."}
                            </p>
                          </div>

                          {/* Criterion 2: Demonstrated understanding of feasibility of business */}
                          <div className="pt-2 border-t border-stone-200/70">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                  <Briefcase size={14} className="text-[#7A0C0C]" />
                                  Criterion 2: Demonstrated Understanding of Business Feasibility
                                </label>
                                <p className="text-[11px] text-stone-500 italic mt-0.5">
                                  Evaluate operational feasibility, realistic execution, and industry understanding
                                </p>
                              </div>
                              {criteriaScores.business_feasibility !== null && (
                                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                                  {formatScoreNumber(criteriaScores.business_feasibility)}
                                </span>
                              )}
                            </div>
                            {renderScorePills(criteriaScores.business_feasibility, (val) =>
                              setCriteriaScores((prev) => ({ ...prev, business_feasibility: val }))
                            )}
                          </div>

                          {/* Criterion 3: Creativity */}
                          <div className="pt-3 border-t border-stone-200/70">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                  <Lightbulb size={14} className="text-amber-600" />
                                  Criterion 3: Creativity
                                </label>
                                <p className="text-[11px] text-stone-500 italic mt-0.5">
                                  Evaluate originality, unique positioning, and inventive problem-solving
                                </p>
                              </div>
                              {criteriaScores.business_creativity !== null && (
                                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                                  {formatScoreNumber(criteriaScores.business_creativity)}
                                </span>
                              )}
                            </div>
                            {renderScorePills(criteriaScores.business_creativity, (val) =>
                              setCriteriaScores((prev) => ({ ...prev, business_creativity: val }))
                            )}
                          </div>
                        </div>

                        {/* ── FRQ 3 Section ── */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/70 border border-stone-200/80 space-y-4">
                          <div className="flex items-start justify-between gap-2 border-b border-stone-200/60 pb-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A0C0C] bg-[#7A0C0C]/10 px-2.5 py-0.5 rounded-md">
                                Question 3 of 3
                              </span>
                              <h4 className="text-sm font-bold text-stone-900 mt-1.5">
                                Why PGN?
                              </h4>
                            </div>
                            {frq3?.text && (
                              <span className="text-[10px] text-stone-500 font-mono bg-white px-2 py-0.5 rounded-md border border-stone-200 shrink-0">
                                {getWordCount(frq3.text)} words
                              </span>
                            )}
                          </div>

                          {/* Candidate Why PGN Text */}
                          <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                              Candidate Response:
                            </span>
                            <p className="text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                              {frq3?.text || "No written response submitted."}
                            </p>
                          </div>

                          {/* Criterion 4: Genuine interest in PGN */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                                  <BookOpen size={14} className="text-[#7A0C0C]" />
                                  Criterion 4: Genuine Interest in PGN
                                </label>
                                <p className="text-[11px] text-stone-500 italic mt-0.5">
                                  Evaluate authentic motivation, cultural alignment, and dedication to joining PGN
                                </p>
                              </div>
                              {criteriaScores.why_pgn_interest !== null && (
                                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                                  {formatScoreNumber(criteriaScores.why_pgn_interest)}
                                </span>
                              )}
                            </div>
                            {renderScorePills(criteriaScores.why_pgn_interest, (val) =>
                              setCriteriaScores((prev) => ({ ...prev, why_pgn_interest: val }))
                            )}
                          </div>
                        </div>

                        {/* Overall Computed Score Display */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 flex items-center gap-1.5">
                              <Sparkles size={13} className="text-[#F5A623]" /> Live Overall Application Score
                            </span>
                            <p className="text-xs text-stone-700 mt-0.5 font-medium">
                              Arithmetic mean: (Passion + Feasibility + Creativity + Interest) / 4
                            </p>
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 text-xs text-stone-600 font-mono flex-wrap">
                              <span className="px-1.5 py-0.5 bg-white rounded border border-amber-200">
                                {formatScoreVal(criteriaScores.artifact_passion)}
                              </span>
                              <span>+</span>
                              <span className="px-1.5 py-0.5 bg-white rounded border border-amber-200">
                                {formatScoreVal(criteriaScores.business_feasibility)}
                              </span>
                              <span>+</span>
                              <span className="px-1.5 py-0.5 bg-white rounded border border-amber-200">
                                {formatScoreVal(criteriaScores.business_creativity)}
                              </span>
                              <span>+</span>
                              <span className="px-1.5 py-0.5 bg-white rounded border border-amber-200">
                                {formatScoreVal(criteriaScores.why_pgn_interest)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {computedAverageScore !== null ? (
                              <div className="inline-flex flex-col items-end">
                                <span className={`text-2xl sm:text-3xl font-bold font-mono px-4 py-1.5 rounded-xl border shadow-xs ${
                                  computedAverageScore > 0
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : computedAverageScore < 0
                                    ? "bg-rose-50 text-rose-800 border-rose-300"
                                    : "bg-stone-100 text-stone-800 border-stone-300"
                                }`}>
                                  {formatScoreNumber(computedAverageScore)}
                                </span>
                                <span className="text-[10px] text-stone-500 mt-1 font-semibold uppercase tracking-wider">
                                  Computed Overall Grade
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col items-end">
                                <span className="text-xs font-semibold text-amber-900 px-3.5 py-2 bg-white/90 rounded-xl border border-amber-200 shadow-2xs">
                                  {4 - completedCriteriaCount} remaining to grade
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes / Deliberation Comments */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2 flex items-center gap-1.5">
                            <MessageSquare size={13} />
                            Deliberation Notes & Thoughts (Optional)
                          </label>
                          <textarea
                            rows={3}
                            value={notesVal}
                            onChange={(e) => setNotesVal(e.target.value)}
                            placeholder="Share your feedback, impressions, strengths, or concerns about this applicant for the brotherhood..."
                            className="w-full text-sm p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/20 focus:border-[#7A0C0C] transition"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2">
                          {saveSuccess ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in">
                              <CheckCircle2 size={14} className="text-emerald-600" />
                              Evaluation recorded successfully!
                            </div>
                          ) : (
                            <span className="text-xs text-stone-500">
                              {computedAverageScore === null
                                ? `Please select grades for all 4 criteria (${completedCriteriaCount}/4 graded)`
                                : "Ready to submit evaluation"}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={handleSaveScore}
                            disabled={computedAverageScore === null || savingScore}
                            className="px-6 py-2.5 rounded-xl bg-[#7A0C0C] text-white text-sm font-semibold hover:bg-[#5C0A0A] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm flex items-center gap-2 cursor-pointer"
                          >
                            {savingScore ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                <span>Save Evaluation</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Standard Interview Round Single Vote Selector
                  return (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-5">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                        <div>
                          <h3 className="text-base font-semibold text-stone-900">
                            Candidate Deliberation Vote
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Assign your vote for {selectedSub.full_name}. This goes directly into the deliberations pool.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedSub.current_round_name && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-[#7A0C0C] border border-amber-200">
                              {selectedSub.current_round_name}
                            </span>
                          )}
                          {selectedSub.existingScore && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              Evaluated ({formatScoreNumber(selectedSub.existingScore.score)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score Pill Buttons */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                          Deliberation Vote ({selectedSub.current_round_name || "Interview Round"})
                        </label>
                        {renderScorePills(scoreVal, (val) => setScoreVal(val))}
                      </div>

                      {/* Notes / Deliberation Comments */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2 flex items-center gap-1.5">
                          <MessageSquare size={13} />
                          Deliberation Notes & Thoughts (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={notesVal}
                          onChange={(e) => setNotesVal(e.target.value)}
                          placeholder="Share your feedback, impressions, strengths, or concerns about this applicant for the brotherhood..."
                          className="w-full text-sm p-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/20 focus:border-[#7A0C0C] transition"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2">
                        {saveSuccess ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            Evaluation recorded successfully!
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400">
                            {scoreVal === null ? "Select a vote above to submit" : "Ready to submit evaluation"}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={handleSaveScore}
                          disabled={scoreVal === null || savingScore}
                          className="px-6 py-2.5 rounded-xl bg-[#7A0C0C] text-white text-sm font-semibold hover:bg-[#5C0A0A] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          {savingScore ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              <span>Save Evaluation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Candidate Details Card */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                  {(() => {
                    const parsedResponses: Record<string, any> = (() => {
                      if (!selectedSub.responses) return {};
                      if (typeof selectedSub.responses === "string") {
                        try {
                          const parsed = JSON.parse(selectedSub.responses);
                          return typeof parsed === "object" && parsed !== null ? parsed : {};
                        } catch {
                          return {};
                        }
                      }
                      return typeof selectedSub.responses === "object" ? selectedSub.responses : {};
                    })();

                    const isPhotoUrl = (str: string, promptText = "", keyText = "") => {
                      if (!str || typeof str !== "string") return false;
                      const s = str.trim();
                      if (s.startsWith("data:image/")) return true;
                      if (/\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?.*)?$/i.test(s)) return true;
                      if (s.startsWith("/uploads/photo_")) return true;
                      if (s.startsWith("/uploads/") && /photo|headshot|picture|portrait/i.test(promptText + " " + keyText)) return true;
                      return false;
                    };

                    const isDocumentUrl = (str: string) => {
                      if (!str || typeof str !== "string") return false;
                      const s = str.trim();
                      if (/\.(pdf|docx?|doc|txt|xlsx?|pptx?|csv)(\?.*)?$/i.test(s)) return true;
                      if (s.startsWith("/uploads/resume_")) return true;
                      if (s.startsWith("/uploads/")) return true;
                      return false;
                    };

                    // Professional headshots are strictly hidden in Brother Portal to prevent bias during review.
                    // Personal artifacts (e.g. photos of drawings, poems, songs) remain visible.
                    const resolvedHeadshot =
                      resolveApplicantPhoto(parsedResponses, selectedSub.question_labels || {}) ||
                      selectedSub.photo_url ||
                      "";

                    const visibleResponses = Object.entries(parsedResponses).filter(([key, value]: [string, any]) => {
                      const prompt = (selectedSub.question_labels?.[key] || key).toLowerCase();
                      const strVal = typeof value === "string" ? value.trim() : "";
                      const isHeadshot =
                        (resolvedHeadshot && strVal === resolvedHeadshot) ||
                        ((/professional.*(picture|photo|headshot|portrait)/i.test(prompt) ||
                          /head\s*shot/i.test(prompt) ||
                          /(picture|photo)\s*of\s*yourself/i.test(prompt) ||
                          /^(headshot|photo_headshot|professional_headshot)$/i.test(key.toLowerCase())) &&
                         !/artifact|portfolio|poem|song|story|creative/i.test(prompt));
                      return !isHeadshot;
                    });

                    const candidateResume = selectedSub.resume_url || (() => {
                      for (const [k, v] of Object.entries(parsedResponses)) {
                        const prompt = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (typeof v === "string" && (v.startsWith("/uploads/resume_") || (isDocumentUrl(v) && /resume|cv/i.test(prompt)))) {
                          return v;
                        }
                      }
                      return null;
                    })();

                    const effectiveMajor = selectedSub.major || (() => {
                      for (const [k, v] of Object.entries(parsedResponses)) {
                        const label = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (/major|field.*study|concentration/i.test(label) && typeof v === "string") return v;
                      }
                      return "";
                    })();

                    const effectiveMinor = selectedSub.minor || (() => {
                      for (const [k, v] of Object.entries(parsedResponses)) {
                        const label = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (/minor/i.test(label) && typeof v === "string") return v;
                      }
                      return "";
                    })();

                    const effectiveGpa = selectedSub.gpa || (() => {
                      for (const [k, v] of Object.entries(parsedResponses)) {
                        const label = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (/gpa|grade\s*point/i.test(label) && typeof v === "string") return v;
                      }
                      return "";
                    })();

                    const effectiveGrad = selectedSub.grad_term || (() => {
                      for (const [k, v] of Object.entries(parsedResponses)) {
                        const label = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (/grad.*term|graduation|grad.*year|class\s*standing/i.test(label) && typeof v === "string") return v;
                      }
                      return "";
                    })();

                    const hasAnyAcademicMetric = Boolean(effectiveMajor || effectiveMinor || effectiveGpa || effectiveGrad);

                    const getDocFilename = (url: string, fallback: string) => {
                      try {
                        const parts = url.split("/");
                        const last = parts[parts.length - 1] || "";
                        if (!last) return fallback;
                        const cleaned = last.replace(/^(resume|photo)_\d+_[a-z0-9]+/, "$1");
                        return cleaned || fallback;
                      } catch {
                        return fallback;
                      }
                    };

                    return (
                      <>
                        {/* Candidate Profile Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
                          <div className="flex items-center gap-3.5 sm:gap-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 font-bold text-xl shrink-0 font-serif">
                              {selectedSub.full_name?.charAt(0) || "P"}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-2xl font-serif text-stone-900 font-normal">
                                  {selectedSub.full_name}
                                </h2>
                                {selectedSub.is_bba !== undefined && (
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                      selectedSub.is_bba
                                        ? "bg-amber-50 text-amber-900 border-amber-200"
                                        : "bg-stone-100 text-stone-700 border-stone-200"
                                    }`}
                                  >
                                    {selectedSub.is_bba ? "Ross / BBA" : "Non-BBA"}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                                <span>{selectedSub.email}</span>
                                {selectedSub.phone && <span>• {selectedSub.phone}</span>}
                                {selectedSub.pronouns && <span>• ({selectedSub.pronouns})</span>}
                                {user?.isAdmin && (
                                  <span className="font-medium text-stone-600">
                                    • Assigned:{" "}
                                    {selectedSub.assigned_brothers && selectedSub.assigned_brothers.length > 0
                                      ? selectedSub.assigned_brothers.map((e: string) => e.split("@")[0]).join(", ")
                                      : "None"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {candidateResume && (
                              <a
                                href={candidateResume}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200 transition border border-stone-200 shadow-2xs"
                              >
                                <FileText size={14} className="text-[#7A0C0C]" />
                                <span>View Resume PDF</span>
                                <ExternalLink size={12} className="text-stone-400" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Key Academic & Identity Metrics */}
                        {hasAnyAcademicMetric && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100">
                            <div>
                              <div className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Major</div>
                              <div className="text-sm font-semibold text-stone-800 mt-0.5">{effectiveMajor || "N/A"}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Minor</div>
                              <div className="text-sm font-semibold text-stone-800 mt-0.5">{effectiveMinor || "None"}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">GPA</div>
                              <div className="text-sm font-semibold text-stone-800 mt-0.5">{effectiveGpa || "N/A"}</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">Graduation</div>
                              <div className="text-sm font-semibold text-stone-800 mt-0.5">{effectiveGrad || "N/A"}</div>
                            </div>
                          </div>
                        )}

                        {/* Application Question Responses */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                            <FileText size={13} />
                            Application Responses
                          </h4>

                          {visibleResponses.length > 0 ? (
                            <div className="space-y-4">
                              {visibleResponses.map(([key, value]: [string, any]) => {
                                const prompt = selectedSub.question_labels?.[key] || key
                                  .replace(/_/g, " ")
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (str) => str.toUpperCase());

                                const displayValue = typeof value === "object"
                                  ? (Array.isArray(value) ? value.join(", ") : JSON.stringify(value, null, 2))
                                  : String(value ?? "");

                                const isImage = typeof displayValue === "string" && isPhotoUrl(displayValue, prompt, key);
                                const isDoc = !isImage && typeof displayValue === "string" && isDocumentUrl(displayValue);
                                const isGenericLink = !isImage && !isDoc && typeof displayValue === "string" && (displayValue.startsWith("http://") || displayValue.startsWith("https://"));

                                return (
                                  <div key={key} className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/70 space-y-2">
                                    <span className="text-xs font-semibold text-stone-800 block whitespace-pre-wrap">
                                      {prompt}
                                    </span>
                                    {isImage ? (
                                      <div className="space-y-2 pt-1">
                                        <a href={displayValue} target="_blank" rel="noopener noreferrer" className="block w-fit group">
                                          <img
                                            src={displayValue}
                                            alt={prompt}
                                            className="max-h-64 rounded-xl border border-stone-200 object-cover shadow-xs group-hover:opacity-95 transition"
                                          />
                                        </a>
                                        <div className="flex items-center gap-3">
                                          <a
                                            href={displayValue}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#7A0C0C] hover:text-[#5A0808] font-semibold underline inline-flex items-center gap-1.5 text-xs"
                                          >
                                            <ExternalLink size={13} /> View Full Photo
                                          </a>
                                          <a
                                            href={displayValue}
                                            download
                                            className="text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5 text-xs font-medium"
                                          >
                                            <Download size={13} /> Download
                                          </a>
                                        </div>
                                      </div>
                                    ) : isDoc ? (
                                      <div className="pt-1">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200 max-w-md shadow-2xs">
                                          <div className="flex items-center gap-3 min-w-0 pr-3">
                                            <div className="w-9 h-9 rounded-lg bg-red-50 text-[#7A0C0C] flex items-center justify-center shrink-0 border border-red-100">
                                              <FileText size={18} />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-xs font-semibold text-stone-800 truncate">
                                                {getDocFilename(displayValue, prompt)}
                                              </p>
                                              <p className="text-[10px] text-stone-400 uppercase tracking-wider">
                                                Uploaded Document
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <a
                                              href={displayValue}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 flex items-center gap-1.5 transition"
                                            >
                                              <span>Open</span>
                                              <ExternalLink size={12} className="text-stone-500" />
                                            </a>
                                            <a
                                              href={displayValue}
                                              download
                                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
                                              title="Download file"
                                            >
                                              <Download size={14} />
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    ) : isGenericLink ? (
                                      <a
                                        href={displayValue}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#7A0C0C] hover:underline inline-flex items-center gap-1.5 text-xs font-semibold"
                                      >
                                        <span>{displayValue}</span>
                                        <ExternalLink size={12} />
                                      </a>
                                    ) : (
                                      <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed font-sans">
                                        {displayValue || <span className="text-stone-400 italic">No answer provided</span>}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-stone-400 italic bg-stone-50 p-4 rounded-xl">
                              No additional custom application question responses recorded.
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center shadow-xs">
                <Award size={48} className="mx-auto mb-4 text-[#7A0C0C]/40" />
                <h3 className="text-xl font-serif text-stone-800">Select a Candidate</h3>
                <p className="text-xs text-stone-500 mt-2 max-w-sm mx-auto">
                  Click on any candidate in your assigned queue on the left to read their application responses, review their resume, and enter your deliberation vote.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default function BrotherPortal() {
  return (
    <LoginGate 
      requireBrother={true} 
      badge="Phi Gamma Nu Brotherhood"
      title="Brother Portal Sign In"
      subtitle="Sign in with your @umich.edu brother account to review your assigned recruitment candidates."
    >
      <BrotherPortalInner />
    </LoginGate>
  );
}
