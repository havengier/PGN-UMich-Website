import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, CheckCircle2, Clock, FileText, ExternalLink, 
  Search, Award, MessageSquare, AlertCircle, ChevronRight,
  Sparkles, Filter, RefreshCw
} from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";
import { useAuth } from "@/app/context/AuthContext";

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
  status: string;
  responses?: Record<string, any>;
  assigned_at?: string;
  assigned_by?: string;
  question_labels?: Record<string, string>;
  current_round?: "application" | "round1" | "round2";
  current_round_name?: string;
  existingScore?: {
    score: number;
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
  const [notesVal, setNotesVal] = useState("");
  const [savingScore, setSavingScore] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
          setScoreVal(updated.existingScore ? updated.existingScore.score : null);
          setNotesVal(updated.existingScore?.notes || "");
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
    setScoreVal(sub.existingScore !== undefined && sub.existingScore !== null ? sub.existingScore.score : null);
    setNotesVal(sub.existingScore?.notes || "");
    setSaveSuccess(false);
  };

  const handleSaveScore = async () => {
    if (!selectedSub || scoreVal === null) return;
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
          score: scoreVal,
          notes: notesVal,
          round: targetRound,
          roundName: targetRoundName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save score");
      
      setSaveSuccess(true);
      // Update local state
      const updatedList = submissions.map((s) => {
        if (s.id === selectedSub.id) {
          return {
            ...s,
            existingScore: {
              score: scoreVal,
              notes: notesVal,
              round_name: targetRoundName,
            },
          };
        }
        return s;
      });
      setSubmissions(updatedList);
      setSelectedSub({
        ...selectedSub,
        existingScore: {
          score: scoreVal,
          notes: notesVal,
          round_name: targetRoundName,
        },
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Error saving evaluation: " + err.message);
    } finally {
      setSavingScore(false);
    }
  };

  // Filtered submissions
  const filtered = submissions.filter((s: any) => {
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

  const totalAssigned = submissions.length;
  const totalReviewed = submissions.filter((s: any) => Boolean(s.existingScore || s.my_score)).length;
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
                Welcome, <span className="text-white font-medium">{user?.name}</span>. Review the applications assigned to you for this cycle. Your scores and notes feed directly into the general deliberations pool.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xs">
              <div className="text-center px-3 py-1">
                <div className="text-2xl font-bold text-white font-sans">{totalAssigned}</div>
                <div className="text-[11px] text-white/50 uppercase font-medium">Assigned</div>
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
                    All ({submissions.length})
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
              <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center">
                <Users size={36} className="mx-auto mb-3 text-stone-300" />
                <h3 className="text-base font-medium text-stone-700">No candidates found</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                  {submissions.length === 0
                    ? "You currently have no applications assigned to review. When an admin assigns candidates to your @umich.edu email, they will appear here."
                    : "No candidates match your current search and filter criteria."}
                </p>
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
                          {sub.current_round_name && (
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 ${
                              isSelected ? "bg-white/10 text-stone-200" : "bg-stone-100 text-stone-600"
                            }`}>
                              {sub.current_round_name}
                            </span>
                          )}
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
                              {scoreObj.score > 0 ? `+${scoreObj.score}` : scoreObj.score}
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
                          Evaluated ({selectedSub.existingScore.score > 0 ? `+${selectedSub.existingScore.score}` : selectedSub.existingScore.score})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score Pill Buttons */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                      Deliberation Vote ({selectedSub.current_round_name || "Application Round"})
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {SCORE_OPTIONS.map((opt) => {
                        const isSelected = scoreVal === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setScoreVal(opt.value)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isSelected
                                ? "ring-2 ring-[#7A0C0C] bg-[#7A0C0C] text-white border-[#7A0C0C] shadow-sm scale-102"
                                : `${opt.color}`
                            }`}
                          >
                            <span className="text-base font-bold leading-tight">{opt.label}</span>
                            <span className={`text-[10px] mt-0.5 leading-tight ${isSelected ? "text-white/80" : "text-stone-500"}`}>
                              {opt.desc}
                            </span>
                          </button>
                        );
                      })}
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

                {/* Candidate Details Card */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                  
                  {/* Candidate Profile Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
                    <div>
                      <h2 className="text-2xl font-serif text-stone-900 font-normal">
                        {selectedSub.full_name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                        <span>{selectedSub.email}</span>
                        {selectedSub.phone && <span>• {selectedSub.phone}</span>}
                        {selectedSub.pronouns && <span>• ({selectedSub.pronouns})</span>}
                      </div>
                    </div>

                    {selectedSub.resume_url && (
                      <a
                        href={selectedSub.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200 transition border border-stone-200 shrink-0"
                      >
                        <FileText size={14} className="text-[#7A0C0C]" />
                        <span>View Resume PDF</span>
                        <ExternalLink size={12} className="text-stone-400" />
                      </a>
                    )}
                  </div>

                  {/* Key Academic & Identity Metrics */}
                  {(() => {
                    const effectiveMajor = selectedSub.major || (() => {
                      if (!selectedSub.responses) return "";
                      for (const [k, v] of Object.entries(selectedSub.responses)) {
                        const label = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (/major|field.*study|concentration/i.test(label) && typeof v === "string") return v;
                      }
                      return "";
                    })();

                    const effectiveMinor = selectedSub.minor || (() => {
                      if (!selectedSub.responses) return "";
                      for (const [k, v] of Object.entries(selectedSub.responses)) {
                        const label = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (/minor/i.test(label) && typeof v === "string") return v;
                      }
                      return "";
                    })();

                    const effectiveGpa = selectedSub.gpa || (() => {
                      if (!selectedSub.responses) return "";
                      for (const [k, v] of Object.entries(selectedSub.responses)) {
                        const label = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (/gpa|grade\s*point/i.test(label) && typeof v === "string") return v;
                      }
                      return "";
                    })();

                    const effectiveGrad = selectedSub.grad_term || (() => {
                      if (!selectedSub.responses) return "";
                      for (const [k, v] of Object.entries(selectedSub.responses)) {
                        const label = (selectedSub.question_labels?.[k] || k).toLowerCase();
                        if (/grad.*term|graduation|grad.*year|class\s*standing/i.test(label) && typeof v === "string") return v;
                      }
                      return "";
                    })();

                    const hasAnyAcademicMetric = Boolean(effectiveMajor || effectiveMinor || effectiveGpa || effectiveGrad);
                    if (!hasAnyAcademicMetric) return null;

                    return (
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
                    );
                  })()}

                  {/* Application Question Responses */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center gap-1.5">
                      <FileText size={13} />
                      Application Responses
                    </h4>
                    
                    {selectedSub.responses && Object.keys(selectedSub.responses).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(selectedSub.responses).map(([key, value]: [string, any]) => {
                          // Format clean label from question_labels or formatted key
                          const prompt = selectedSub.question_labels?.[key] || key
                            .replace(/_/g, " ")
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase());

                          const displayValue = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
                          const isImageUrl =
                            typeof displayValue === "string" &&
                            (displayValue.startsWith("/uploads/") ||
                              displayValue.startsWith("http://") ||
                              displayValue.startsWith("https://")) &&
                            /\.(jpe?g|png|webp|gif|avif)$/i.test(displayValue);

                          return (
                            <div key={key} className="bg-stone-50/60 p-4 rounded-xl border border-stone-200/60 space-y-1.5">
                              <span className="text-xs font-semibold text-stone-800 block whitespace-pre-wrap">
                                {prompt}
                              </span>
                              {isImageUrl ? (
                                <div className="space-y-2 pt-1">
                                  <a href={displayValue} target="_blank" rel="noopener noreferrer" className="block w-fit group">
                                    <img
                                      src={displayValue}
                                      alt={prompt}
                                      className="max-h-56 rounded-xl border border-stone-200 object-cover shadow-xs group-hover:opacity-90 transition-opacity"
                                    />
                                  </a>
                                  <a
                                    href={displayValue}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#7A0C0C] font-semibold underline inline-flex items-center gap-1 text-xs"
                                  >
                                    View Full Photo <ExternalLink size={12} />
                                  </a>
                                </div>
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
