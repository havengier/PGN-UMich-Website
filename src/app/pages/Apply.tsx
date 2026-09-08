import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle,
  ChevronDown,
  Lock,
  Instagram,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  Check,
  XCircle,
  ExternalLink,
  ChevronUp,
  LogOut,
  Plus,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { LoginGate } from "@/app/components/LoginGate";
import { useAuth } from "@/app/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type FieldType = "text" | "email" | "tel" | "textarea" | "select" | "file" | "photo";

interface ConfigField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  hint?: string;
  options?: string[];
  required: boolean;
  core?: boolean;
  word_limit?: number;
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
}

interface RecruitmentCycle {
  id: number;
  name: string;
  status: "draft" | "open" | "closed" | "archived";
}

interface ApplicationSubmission {
  id: number;
  cycle_id: number;
  applicant_user_id: string;
  applicant_email: string;
  applicant_name: string;
  answers: Record<string, any>;
  application_status: "pending_review" | "advanced_to_round_1" | "not_selected_application";
  round_1_status: "pending" | "advanced" | "not_selected";
  round_2_status: "pending" | "offered_bid" | "not_selected";
  submitted_at: string;
}

// ── Dynamic Form Inputs ───────────────────────────────────────────────────────

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
      <label className="text-sm font-semibold text-gray-700 whitespace-pre-line leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
        {field.label}
        {field.required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      {field.hint && (
        <p className="text-xs text-gray-500 -mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          {field.hint}
        </p>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full appearance-none border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C] transition-colors pr-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <option value="">Select an option…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function getWordCount(text: string): number {
  if (!text || typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
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
  const wordCount = field.word_limit ? getWordCount(value) : 0;
  const isOverLimit = Boolean(field.word_limit && wordCount > field.word_limit);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-4">
        <label htmlFor={field.id} className="text-sm font-semibold text-gray-700 whitespace-pre-line leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          {field.label}
          {field.required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
        </label>
        {field.word_limit ? (
          <span
            className={`text-xs font-medium tabular-nums transition-colors shrink-0 pt-0.5 ${
              isOverLimit ? "text-red-600 font-bold" : "text-gray-400"
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {wordCount} / {field.word_limit} words
          </span>
        ) : null}
      </div>
      {field.hint && (
        <p className="text-xs text-gray-500 -mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          {field.hint}
        </p>
      )}
      <textarea
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        rows={5}
        className={`border rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
          isOverLimit
            ? "border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50/20"
            : "border-gray-200 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C]"
        }`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
      {isOverLimit && (
        <p className="text-xs text-red-600 font-medium">
          Response exceeds maximum limit of {field.word_limit} words ({wordCount} words entered).
        </p>
      )}
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
  const isTextType = field.type === "text";
  const wordCount = Boolean(field.word_limit && isTextType) ? getWordCount(value) : 0;
  const isOverLimit = Boolean(field.word_limit && isTextType && wordCount > field.word_limit!);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-4">
        <label htmlFor={field.id} className="text-sm font-semibold text-gray-700 whitespace-pre-line leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          {field.label}
          {field.required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
        </label>
        {field.word_limit && isTextType ? (
          <span
            className={`text-xs font-medium tabular-nums transition-colors shrink-0 pt-0.5 ${
              isOverLimit ? "text-red-600 font-bold" : "text-gray-400"
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {wordCount} / {field.word_limit} words
          </span>
        ) : null}
      </div>
      {field.hint && (
        <p className="text-xs text-gray-500 -mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          {field.hint}
        </p>
      )}
      <input
        id={field.id}
        type={field.type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        className={`border rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
          isOverLimit
            ? "border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50/20"
            : "border-gray-200 focus:ring-[#7A0C0C]/30 focus:border-[#7A0C0C]"
        }`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
      {isOverLimit && (
        <p className="text-xs text-red-600 font-medium">
          Response exceeds maximum limit of {field.word_limit} words ({wordCount} words entered).
        </p>
      )}
    </div>
  );
}

function DynamicFileInput({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const res = await fetch("/api/recruitment/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, fileData }),
        });
        const data = await res.json();
        if (res.ok && data.fileUrl) {
          onChange(data.fileUrl);
        } else {
          setUploadError(data.error || "Failed to upload file.");
        }
      } catch {
        setUploadError("Upload network error. Please try again.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700 whitespace-pre-line leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
        {field.label}
        {field.required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      {field.hint && (
        <p className="text-xs text-gray-500 -mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          {field.hint}
        </p>
      )}

      {value ? (
        <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
          <div className="flex items-center gap-2.5">
            <FileText size={18} className="text-[#7A0C0C]" />
            <span className="text-xs font-semibold text-gray-800 truncate max-w-[260px] sm:max-w-md">
              {value.split("/").pop()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#7A0C0C] hover:underline inline-flex items-center gap-1"
            >
              View <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-gray-300 hover:border-[#7A0C0C]/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-white transition-all group">
          <Upload size={22} className="text-gray-400 group-hover:text-[#7A0C0C] transition-colors mb-2" />
          <span className="text-xs font-semibold text-gray-700 group-hover:text-[#7A0C0C] transition-colors">
            {uploading ? "Uploading document…" : "Click to select PDF or DOCX file (Max 10MB)"}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">Resume, CV, or Portfolio Document</span>
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            required={field.required && !value}
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
    </div>
  );
}

function DynamicPhotoUpload({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strictly enforce 2MB max upload size
    const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB
    if (file.size > MAX_PHOTO_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(`Photo exceeds the 2MB limit (${sizeMB}MB). Please choose an image under 2MB.`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const res = await fetch("/api/recruitment/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, fileData }),
        });
        const data = await res.json();
        if (res.ok && data.fileUrl) {
          onChange(data.fileUrl);
        } else {
          setUploadError(data.error || "Failed to upload photo.");
        }
      } catch {
        setUploadError("Upload network error. Please try again.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700 whitespace-pre-line leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
        {field.label}
        {field.required && <span className="text-[#7A0C0C] ml-0.5">*</span>}
      </label>
      {field.hint && (
        <p className="text-xs text-gray-500 -mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
          {field.hint}
        </p>
      )}

      {value ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-300/80 bg-white shadow-xs flex-shrink-0">
              <img src={value} alt="Uploaded preview" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#7A0C0C] bg-[#7A0C0C]/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  Photo Uploaded
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-800 mt-1 truncate max-w-[200px] sm:max-w-xs">
                {value.split("/").pop()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#7A0C0C] hover:underline inline-flex items-center gap-1"
            >
              View Full Size <ExternalLink size={12} />
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              Remove / Replace
            </button>
          </div>
        </div>
      ) : (
        <label className="border-2 border-dashed border-gray-300 hover:border-[#7A0C0C]/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-stone-50/50 transition-all group">
          <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-[#7A0C0C]/10 flex items-center justify-center mb-2.5 transition-colors">
            <ImageIcon size={22} className="text-gray-400 group-hover:text-[#7A0C0C] transition-colors" />
          </div>
          <span className="text-xs font-semibold text-gray-800 group-hover:text-[#7A0C0C] transition-colors text-center">
            {uploading ? "Uploading photo…" : "Click to select a photo (Max 2MB)"}
          </span>
          <span className="text-[11px] text-gray-400 mt-1 text-center">
            PNG, JPG, or WEBP • Maximum file size 2MB
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            required={field.required && !value}
            disabled={uploading}
            onChange={handlePhotoChange}
            className="hidden"
          />
        </label>
      )}

      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}

// ── No Active Cycle Screen ─────────────────────────────────────────────────────

function NoActiveCycleScreen() {
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
        Recruitment Portal
      </p>

      <h2
        className="text-3xl sm:text-4xl font-normal text-stone-900 mb-4 tracking-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Applications Opening Soon
      </h2>

      <div className="h-0.5 w-16 bg-[#F5A623] mx-auto mb-6" />

      <p
        className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Applications for our upcoming recruitment cycle are currently closed. Follow our Instagram or
        check back here for official announcements, rush dates, and timeline updates.
      </p>

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

// ── Application Locked or Outside Window Screen ───────────────────────────────

function LockedOrScheduledScreen({
  cycleName,
  opensAt,
  closesAt,
  isLocked,
}: {
  cycleName: string;
  opensAt: string | null;
  closesAt: string | null;
  isLocked: boolean;
}) {
  const now = new Date();
  const isScheduled = opensAt && now < new Date(opensAt);
  const isPassedDeadline = closesAt && now > new Date(closesAt);

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-sm border border-stone-200/80 p-8 sm:p-14 text-center max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-[#7A0C0C] flex items-center justify-center mx-auto mb-6 shadow-sm">
        {isScheduled ? <Calendar size={28} strokeWidth={1.75} /> : <Lock size={28} strokeWidth={1.75} />}
      </div>

      <p
        className="text-[#7A0C0C] text-xs font-bold tracking-[0.25em] uppercase mb-3"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {cycleName}
      </p>

      <h2
        className="text-3xl sm:text-4xl font-normal text-stone-900 mb-4 tracking-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {isLocked
          ? "Applications Currently Locked"
          : isScheduled
          ? "Applications Open Soon"
          : isPassedDeadline
          ? "Application Deadline Has Passed"
          : "Applications Closed"}
      </h2>

      <div className="h-0.5 w-16 bg-[#F5A623] mx-auto mb-6" />

      <p
        className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6 max-w-lg mx-auto"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {isLocked
          ? "Applications for this recruitment cycle are currently paused or locked by the recruitment chairs. Please check back shortly for updates."
          : isScheduled
          ? `Applications for ${cycleName} are scheduled to open on ${new Date(
              opensAt!,
            ).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
          : isPassedDeadline
          ? `The submission deadline for ${cycleName} closed on ${new Date(
              closesAt!,
            ).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
          : "Submissions for this recruitment cycle are currently closed."}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/recruitment"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white text-xs font-bold tracking-widest uppercase rounded-full shadow-sm transition-colors"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          View Rush Details
        </Link>
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

// ── Applicant Status Screen ───────────────────────────────────────────────────

function ApplicantStatusScreen({
  cycleName,
  stage,
  statusKey,
  statusMessage,
  submission,
  onSignOut,
}: {
  cycleName: string;
  stage: "application" | "round1" | "round2";
  statusKey: string;
  statusMessage: { title: string; body: string };
  submission: ApplicationSubmission;
  onSignOut: () => void;
}) {
  const [showSummary, setShowSummary] = useState(false);

  const isBidOffered = stage === "round2" && statusKey === "offered_bid";
  const isAdvanced =
    (stage === "application" && statusKey === "advanced_to_round_1") ||
    (stage === "round1" && statusKey === "advanced") ||
    isBidOffered;
  const isNotSelected =
    statusKey === "not_selected_application" || statusKey === "not_selected";
  const isPending = !isAdvanced && !isNotSelected;

  useEffect(() => {
    if (isBidOffered) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#7A0C0C", "#F5A623", "#00274C", "#FFCB05", "#FFFFFF"],
        });
      } catch {}
    }
  }, [isBidOffered]);

  // Checkpoints definition
  const steps = [
    {
      label: "1. Written Application",
      active: stage === "application",
      done: stage === "round1" || stage === "round2",
      passed: submission.application_status === "advanced_to_round_1",
      failed: submission.application_status === "not_selected_application",
    },
    {
      label: "2. Round 1 Interviews",
      active: stage === "round1",
      done: stage === "round2",
      passed: submission.round_1_status === "advanced",
      failed: submission.round_1_status === "not_selected",
    },
    {
      label: "3. Final Deliberation & Bid",
      active: stage === "round2",
      done: isBidOffered,
      passed: isBidOffered,
      failed: stage === "round2" && statusKey === "not_selected",
    },
  ];

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-sm border border-stone-200/80 p-8 sm:p-12 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <p
              className="text-[#7A0C0C] text-xs font-bold tracking-[0.25em] uppercase"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {cycleName} • Recruitment Pipeline
            </p>
          </div>
          <h2
            className="text-2xl sm:text-3xl font-normal text-stone-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Applicant Status
          </h2>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-stone-500">
          <span>Signed in as <strong className="text-stone-800">{submission.applicant_email}</strong></span>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1 text-stone-400 hover:text-[#7A0C0C] transition-colors p-1"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Progress Pipeline Stepper */}
      <div className="py-8 border-b border-stone-100">
        <div className="grid grid-cols-3 gap-2">
          {steps.map((step, i) => {
            const isCompleted = step.done || step.passed;
            const isCurrent = step.active;
            const isRejected = step.failed;

            return (
              <div key={i} className="flex flex-col items-center text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                    isRejected
                      ? "bg-stone-100 text-stone-400 border border-stone-300"
                      : isCompleted
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isCurrent
                      ? "bg-[#7A0C0C] text-white ring-4 ring-[#7A0C0C]/15"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {isRejected ? (
                    <XCircle size={16} />
                  ) : isCompleted ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-semibold leading-tight ${
                    isCurrent ? "text-[#7A0C0C]" : isCompleted ? "text-emerald-700" : "text-stone-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Outcome / Status Card */}
      <div className="py-10 text-center">
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm ${
            isBidOffered
              ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white ring-8 ring-amber-100"
              : isAdvanced
              ? "bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50"
              : isPending
              ? "bg-amber-100 text-[#7A0C0C] ring-8 ring-amber-50"
              : "bg-stone-100 text-stone-600 ring-8 ring-stone-50"
          }`}
        >
          {isBidOffered ? (
            <Sparkles size={36} />
          ) : isAdvanced ? (
            <CheckCircle size={36} strokeWidth={1.75} />
          ) : isPending ? (
            <Clock size={36} strokeWidth={1.75} />
          ) : (
            <AlertCircle size={36} strokeWidth={1.75} />
          )}
        </div>

        <span
          className={`inline-block px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4 ${
            isBidOffered
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : isAdvanced
              ? "bg-emerald-100 text-emerald-800"
              : isPending
              ? "bg-amber-50 text-[#7A0C0C] border border-amber-200"
              : "bg-stone-100 text-stone-700"
          }`}
        >
          {isBidOffered
            ? "Official Bid Extended 🎉"
            : isAdvanced
            ? "Stage Advanced"
            : isPending
            ? "Deliberation In Progress"
            : "Cycle Decision"}
        </span>

        <h3
          className="text-2xl sm:text-4xl font-normal text-stone-900 mb-4 tracking-tight leading-tight max-w-xl mx-auto"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {statusMessage.title}
        </h3>

        <div className="h-0.5 w-14 bg-[#F5A623] mx-auto mb-6" />

        <p
          className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {statusMessage.body}
        </p>

        {isBidOffered && (
          <div className="mt-8 p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl max-w-md mx-auto text-xs text-amber-900 leading-relaxed">
            ✨ Welcome to the family! Make sure to monitor your <strong>{submission.applicant_email}</strong> inbox for details regarding orientation and the formal induction schedule.
          </div>
        )}
      </div>

      {/* Submitted Application Accordion (Readonly & Immutable) */}
      <div className="pt-6 border-t border-stone-100">
        <button
          type="button"
          onClick={() => setShowSummary((prev) => !prev)}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-stone-50 hover:bg-stone-100/80 transition-colors text-stone-700 text-xs font-semibold"
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#7A0C0C]" />
            <span>View Your Submitted Application</span>
            <span className="text-[10px] text-stone-400 font-normal">
              (Submitted {new Date(submission.submitted_at).toLocaleDateString()} • Immutable)
            </span>
          </div>
          {showSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-white border border-stone-100 rounded-2xl mt-3 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <span className="text-stone-400 block mb-0.5">Candidate</span>
                    <span className="font-semibold text-stone-900">{submission.applicant_name}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block mb-0.5">Email</span>
                    <span className="font-semibold text-stone-900">{submission.applicant_email}</span>
                  </div>
                </div>

                {Object.entries(submission.answers).map(([key, val]) => {
                  if (!val || typeof val !== "string") return null;
                  const isUrl = val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/uploads/");
                  return (
                    <div key={key} className="pb-3 border-b border-stone-50 last:border-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A0C0C] block mb-1">
                        {key}
                      </span>
                      {isUrl ? (
                        <a
                          href={val}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7A0C0C] font-medium underline inline-flex items-center gap-1"
                        >
                          View Document <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{val}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Sample Candidates for Rapid Admin Testing ─────────────────────────────────
const SAMPLE_APPLICANTS = [
  {
    firstName: "Jordan",
    lastName: "Taylor",
    email: "jordant.test@umich.edu",
    phone: "(734) 555-0192",
    year: "Sophomore",
    isRoss: "Yes",
    major: "Business Administration & Computer Science",
    minor: "Economics",
    gpa: "3.84",
    whyPGN: "I am looking for a driven, diverse professional community that bridges technology and finance. PGN's emphasis on genuine brotherhood and leadership development aligns perfectly with my career goals in venture capital and fintech.",
    strengths: "Strategic problem-solving, financial modeling, team collaboration under tight deadlines, and public speaking.",
    involvement: "Michigan Ross Capital Fund (Analyst), Wolverine Sports Analytics Club, Intramural Soccer captain.",
    questions: "What mentorship opportunities exist between current members and alumni working on the West Coast?",
  },
  {
    firstName: "Maya",
    lastName: "Lin",
    email: "mayal.test@umich.edu",
    phone: "(734) 555-0145",
    year: "Freshman",
    isRoss: "No",
    major: "Industrial & Operations Engineering",
    minor: "Mathematics",
    gpa: "3.91",
    whyPGN: "Phi Gamma Nu represents the ideal intersection of high professional standards and genuine community. The conversations I had with brothers at Coffee Chats showed me a culture of mutual support and relentless curiosity.",
    strengths: "Quantitative analysis, process optimization, Python, empathetic leadership, and cross-functional communication.",
    involvement: "Society of Women Engineers, Michigan Consulting Group (Junior Consultant), Habitat for Humanity volunteer.",
    questions: "How does the professional development curriculum adapt for students interested in supply chain vs finance?",
  },
  {
    firstName: "Marcus",
    lastName: "Washington",
    email: "marcusw.test@umich.edu",
    phone: "(734) 555-0188",
    year: "Junior",
    isRoss: "No",
    major: "Economics & Data Science",
    minor: "User Experience Design",
    gpa: "3.76",
    whyPGN: "I want to surround myself with ambitious peers who challenge me to grow beyond the classroom. The diversity of majors within PGN creates unique opportunities to learn from different perspectives and prepare for tech consulting.",
    strengths: "Data visualization (Tableau, SQL), project management, creative ideation, and workshop facilitation.",
    involvement: "Data Science Association (VP of Marketing), TAMID Group Consulting Track, Michigan Daily copy editor.",
    questions: "Are there inter-chapter national networking events or alumni summits held each year?",
  },
  {
    firstName: "Aaliyah",
    lastName: "Brooks",
    email: "aaliyahb.test@umich.edu",
    phone: "(734) 555-0163",
    year: "Sophomore",
    isRoss: "Yes",
    major: "Business Administration",
    minor: "International Studies",
    gpa: "3.89",
    whyPGN: "After attending the PGN info session, I was struck by how invested the members were in each other's personal growth, not just resume building. I want to contribute to this vibrant culture and build lifelong friendships.",
    strengths: "Brand strategy, cross-cultural collaboration, interpersonal communications, and event planning.",
    involvement: "Black Business Undergraduate Society (BBUS), Michigan Business Women, Admissions student ambassador.",
    questions: "What philanthropy and community service initiatives is the chapter most proud of this year?",
  },
];

// ── Main Apply Content ────────────────────────────────────────────────────────

function ApplyContent() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<RecruitmentCycle | null>(null);
  const [form, setForm] = useState<CycleForm | null>(null);
  const [computedStatus, setComputedStatus] = useState<"scheduled" | "open" | "closed">("closed");
  const [submission, setSubmission] = useState<ApplicationSubmission | null>(null);
  const [stage, setStage] = useState<"application" | "round1" | "round2">("application");
  const [statusKey, setStatusKey] = useState<string>("pending_review");
  const [statusMessage, setStatusMessage] = useState<{ title: string; body: string }>({
    title: "Application Under Review",
    body: "Your application is currently being reviewed.",
  });

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Admin testing states
  const [adminTestMode, setAdminTestMode] = useState(false);
  const [adminPreviewCandidateView, setAdminPreviewCandidateView] = useState(false);
  const [lastSubmittedTest, setLastSubmittedTest] = useState<{ id: number; name: string } | null>(null);
  const [sampleIdx, setSampleIdx] = useState(0);

  // Load active cycle and check submission state
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // 1. Fetch active cycle info
        const cycleRes = await fetch("/api/recruitment/active-cycle");
        const cycleData = await cycleRes.json();

        if (cycleData.active && cycleData.cycle) {
          setCycle(cycleData.cycle);
          setForm(cycleData.form);
          setComputedStatus(cycleData.computedStatus);

          // 2. Check if user already submitted
          if (user?.email) {
            const subRes = await fetch(`/api/recruitment/my-submission?cycleId=${cycleData.cycle.id}`);
            const subData = await subRes.json();
            if (subData.submitted && subData.submission) {
              setSubmission(subData.submission);
              setStage(subData.stage);
              setStatusKey(subData.statusKey);
              if (subData.message) setStatusMessage(subData.message);
            }
          }

          // Initialize form defaults from questions
          const defaults: Record<string, string> = {};
          (cycleData.form?.questions || []).forEach((sec: ConfigSection) => {
            (sec.fields || []).forEach((f: ConfigField) => {
              defaults[f.id] = "";
            });
          });
          if (user?.email) defaults["email"] = user.email;
          if (user?.name) {
            const parts = user.name.trim().split(/\s+/);
            if (parts[0]) defaults["firstName"] = parts[0];
            if (parts.length > 1) defaults["lastName"] = parts.slice(1).join(" ");
          }
          setFormData((prev) => ({ ...defaults, ...prev }));
        }
      } catch (err) {
        console.error("Failed to initialize recruitment portal:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  function getValue(id: string): string {
    return formData[id] ?? "";
  }

  function setValue(id: string, value: any) {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }

  function handleAutofillTestData() {
    const candidate = SAMPLE_APPLICANTS[sampleIdx % SAMPLE_APPLICANTS.length];
    setSampleIdx((prev) => prev + 1);

    const updated = { ...formData };
    updated["firstName"] = candidate.firstName;
    updated["lastName"] = candidate.lastName;
    updated["email"] = candidate.email;
    updated["phone"] = candidate.phone;
    updated["year"] = candidate.year;
    updated["isRoss"] = candidate.isRoss;
    updated["major"] = candidate.major;
    updated["minor"] = candidate.minor;
    updated["gpa"] = candidate.gpa;
    updated["whyPGN"] = candidate.whyPGN;
    updated["strengths"] = candidate.strengths;
    updated["involvement"] = candidate.involvement;
    updated["questions"] = candidate.questions;

    // Fill any extra configured form fields that are empty
    (form?.questions || []).forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        if (!updated[f.id] || String(updated[f.id]).trim() === "") {
          if (f.type === "select" && f.options && f.options.length > 0) {
            updated[f.id] = f.options[0];
          } else if (f.type === "tel") {
            updated[f.id] = candidate.phone;
          } else if (f.type === "email") {
            updated[f.id] = candidate.email;
          } else if (f.type === "textarea") {
            updated[f.id] = candidate.whyPGN;
          } else if (f.type === "file") {
            updated[f.id] = "/uploads/sample_resume.pdf";
          } else {
            updated[f.id] = f.id.toLowerCase().includes("gpa") ? candidate.gpa : "Sample test response";
          }
        }
      });
    });

    setFormData(updated);
    setSubmitError(null);
  }

  function handleStartNewTestApplication() {
    setAdminTestMode(true);
    setLastSubmittedTest(null);
    setSubmitError(null);
    handleAutofillTestData();
    window.scrollTo({ top: 360, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cycle) return;

    setSubmitting(true);
    setSubmitError(null);

    // Validate word limits on all text & textarea fields
    if (form?.questions) {
      for (const section of form.questions) {
        for (const field of section.fields || []) {
          if ((field.type === "text" || field.type === "textarea") && field.word_limit && field.word_limit > 0) {
            const val = formData[field.id];
            if (typeof val === "string" && val.trim()) {
              const count = getWordCount(val);
              if (count > field.word_limit) {
                const labelShort = field.label.split("\n")[0].trim() || field.label;
                setSubmitError(`"${labelShort}" exceeds maximum limit of ${field.word_limit} words (${count} words entered).`);
                setSubmitting(false);
                return;
              }
            }
          }
        }
      }
    }

    const payload = {
      cycleId: cycle.id,
      answers: {
        ...formData,
        email: formData.email || user?.email,
      },
    };

    try {
      const res = await fetch("/api/recruitment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit application. Please try again.");
        return;
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (user?.isAdmin) {
        setLastSubmittedTest({
          id: data.submission?.id || Date.now(),
          name: data.submission?.applicant_name || (formData.firstName ? `${formData.firstName} ${formData.lastName}` : "Test Applicant"),
        });
        setAdminTestMode(true);
      } else {
        // Normal applicant: Re-fetch submission state to show status screen
        const subRes = await fetch(`/api/recruitment/my-submission?cycleId=${cycle.id}`);
        const subData = await subRes.json();
        if (subData.submitted && subData.submission) {
          setSubmission(subData.submission);
          setStage(subData.stage);
          setStatusKey(subData.statusKey);
          if (subData.message) setStatusMessage(subData.message);
        }
      }
      window.scrollTo({ top: 360, behavior: "smooth" });
    } catch {
      setSubmitError("Network error submitting application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasWordLimitViolations = Boolean(
    form?.questions?.some((section) =>
      section.fields?.some((field) => {
        if ((field.type === "text" || field.type === "textarea") && field.word_limit && field.word_limit > 0) {
          const val = formData[field.id];
          if (typeof val === "string" && val.trim()) {
            return getWordCount(val) > field.word_limit;
          }
        }
        return false;
      })
    )
  );

  const isFormFillable =
    cycle !== null &&
    cycle.status === "open" &&
    form !== null &&
    !form.is_locked &&
    computedStatus === "open";

  return (
    <>
      {/* Hero Banner */}
      <div className="relative w-full h-[50vh] min-h-[380px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950" />
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 60%, #78350f 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, #1a0303 0%, transparent 60%)",
          }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 h-full flex items-end px-8 md:px-16 pb-12 pt-24">
          <div>
            <motion.p
              className="text-[#F5A623] text-xs font-bold tracking-[0.25em] uppercase mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {cycle ? cycle.name : "Phi Gamma Nu"} • University of Michigan
            </motion.p>
            <motion.h1
              className="text-white font-normal leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
            >
              Recruitment Portal
            </motion.h1>
            <motion.p
              className="text-white/60 text-sm mt-2 max-w-lg"
              style={{ fontFamily: "'Inter', sans-serif" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Join a distinguished community of driven, ambitious business and multidisciplinary leaders.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#FAFAF9] min-h-screen py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin" />
              <p className="text-xs text-stone-400 font-medium">Checking application status…</p>
            </div>
          ) : !cycle ? (
            /* 1. No Active Cycle */
            <NoActiveCycleScreen />
          ) : submission && !adminTestMode ? (
            /* 2. Applicant Has Already Submitted -> Status Screen */
            <div className="space-y-6">
              {user?.isAdmin && (
                <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#7A0C0C] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7A0C0C] block">
                        Admin Testing Mode Active
                      </span>
                      <p className="text-xs text-stone-700 mt-0.5">
                        You have submitted test application(s). You can submit as many more test applications as desired to test grading, normalization, and deliberations.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link
                      to="/admin/apply"
                      className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Users size={14} /> View Deliberations
                    </Link>
                    <button
                      type="button"
                      onClick={handleStartNewTestApplication}
                      className="px-4 py-2 bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Submit Another Test Application
                    </button>
                  </div>
                </div>
              )}

              <ApplicantStatusScreen
                cycleName={cycle.name}
                stage={stage}
                statusKey={statusKey}
                statusMessage={statusMessage}
                submission={submission}
                onSignOut={logout}
              />
            </div>
          ) : (!isFormFillable && !user?.isAdmin) || (adminPreviewCandidateView && !isFormFillable) ? (
            /* 3. Cycle is Locked or Outside Schedule Window */
            <div className="space-y-4">
              {user?.isAdmin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAdminPreviewCandidateView(false)}
                    className="px-4 py-2 bg-[#7A0C0C] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#5C0A0A] transition-colors inline-flex items-center gap-1.5"
                  >
                    ← Exit Candidate Preview & Open Application (Admin Test Mode)
                  </button>
                </div>
              )}
              <LockedOrScheduledScreen
                cycleName={cycle.name}
                opensAt={form?.opens_at ?? null}
                closesAt={form?.closes_at ?? null}
                isLocked={form?.is_locked ?? false}
              />
            </div>
          ) : (
            /* 4. Active Dynamic Application Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              {/* Admin Testing Mode Banner */}
              {user?.isAdmin && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                          Admin Testing Mode Active
                        </span>
                        {!isFormFillable && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                            Status: {form?.is_locked ? "Locked" : computedStatus === "scheduled" ? "Scheduled" : "Closed"}
                          </span>
                        )}
                        {submission && (
                          <span className="text-[10px] bg-stone-200 text-stone-800 font-semibold px-2 py-0.5 rounded-full">
                            Multi-Submission Enabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {!isFormFillable
                          ? "Applications are closed to regular candidates, but testing bypass is enabled for administrators."
                          : "You can submit as many test applications as needed for testing."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={handleAutofillTestData}
                      className="px-3 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      title="Fill all required fields with realistic candidate test data"
                    >
                      ⚡ Auto-Fill Test Data
                    </button>
                    {!isFormFillable && (
                      <button
                        type="button"
                        onClick={() => setAdminPreviewCandidateView(true)}
                        className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-medium rounded-xl transition-colors"
                      >
                        Preview Candidate View
                      </button>
                    )}
                    {submission && (
                      <button
                        type="button"
                        onClick={() => setAdminTestMode(false)}
                        className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-medium rounded-xl transition-colors"
                      >
                        Back to My Status Screen
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Test Submitted Success Banner */}
              {lastSubmittedTest && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        Test Application #{lastSubmittedTest.id} Submitted Successfully!
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Candidate <strong>{lastSubmittedTest.name}</strong> is now live in the deliberation table. You can prepare and submit another test application below.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setLastSubmittedTest(null);
                        handleAutofillTestData();
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Prepare Another Test
                    </button>
                    <Link
                      to="/admin/apply"
                      className="px-3.5 py-2 bg-white hover:bg-stone-100 text-emerald-900 border border-emerald-200 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink size={14} /> Open Admin Deliberations
                    </Link>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-200/80 p-8 sm:p-12 mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-stone-100">
                  <div>
                    <span className="text-[#F5A623] text-xs font-bold tracking-[0.2em] uppercase block mb-1">
                      Official Application
                    </span>
                    <h2
                      className="text-3xl font-normal text-stone-900"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {cycle.name} Application
                    </h2>
                  </div>
                  {form?.closes_at && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-xs text-amber-900 font-medium">
                      <Clock size={13} className="text-[#7A0C0C]" />
                      <span>
                        Deadline: {new Date(form.closes_at).toLocaleDateString()} at{" "}
                        {new Date(form.closes_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-stone-600 text-sm py-6 leading-relaxed">
                  Please complete all required sections thoroughly. Once submitted, your application is
                  locked and cannot be edited. You can track your interview status on this portal throughout
                  the recruitment cycle.
                </p>

                <form onSubmit={handleSubmit} className="space-y-10">
                  {(form?.questions || []).map((section, sIdx) => (
                    <div key={section.id || sIdx} className="space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#7A0C0C] bg-[#7A0C0C]/5 px-3 py-1 rounded-md">
                          Section {sIdx + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-stone-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {section.label}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        {(section.fields || []).map((field) => {
                          if (field.type === "select") {
                            return (
                              <DynamicSelect
                                key={field.id}
                                field={field}
                                value={getValue(field.id)}
                                onChange={(val) => setValue(field.id, val)}
                              />
                            );
                          }
                          if (field.type === "textarea") {
                            return (
                              <DynamicTextarea
                                key={field.id}
                                field={field}
                                value={getValue(field.id)}
                                onChange={(val) => setValue(field.id, val)}
                              />
                            );
                          }
                          if (field.type === "file") {
                            return (
                              <DynamicFileInput
                                key={field.id}
                                field={field}
                                value={getValue(field.id)}
                                onChange={(val) => setValue(field.id, val)}
                              />
                            );
                          }
                          if (field.type === "photo") {
                            return (
                              <DynamicPhotoUpload
                                key={field.id}
                                field={field}
                                value={getValue(field.id)}
                                onChange={(val) => setValue(field.id, val)}
                              />
                            );
                          }
                          return (
                            <DynamicInput
                              key={field.id}
                              field={field}
                              value={getValue(field.id)}
                              onChange={(val) => setValue(field.id, val)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {submitError && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-stone-400">
                      By submitting, you certify that all information provided is accurate and original.
                    </p>
                    <button
                      type="submit"
                      disabled={submitting || hasWordLimitViolations}
                      className="w-full sm:w-auto px-10 py-3.5 bg-[#7A0C0C] hover:bg-[#5C0A0A] text-white text-xs font-bold tracking-widest uppercase rounded-full shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {submitting ? "Submitting Application…" : "Submit Application"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page Gate ────────────────────────────────────────────────────────────
export default function Apply() {
  return (
    <LoginGate
      badge="Recruitment Application"
      title="Sign in to Apply"
      subtitle="Please sign in with your @umich.edu Google account to access the Phi Gamma Nu recruitment portal."
    >
      <ApplyContent />
    </LoginGate>
  );
}
