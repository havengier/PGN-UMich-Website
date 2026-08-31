import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// ── Rotating subtitle words ───────────────────────────────────────────────────
const WORDS = ["philanthropists", "professionals", "brothers", "leaders", "innovators"];

// ── Member data ───────────────────────────────────────────────────────────────
type Member = {
  first: string;
  last: string;
  role: string;
  major: string;
  minor?: string;
  hue: string;
};

const BOARD: Member[] = [
  { first: "Elliott", last: "Nederhood", role: "President", major: "Business Administration", minor: "Minor in Philosophy", hue: "from-amber-900 via-amber-800 to-stone-700" },
  { first: "Jing", last: "Li", role: "VP Professional Development", major: "Business Administration", hue: "from-slate-700 via-slate-600 to-slate-500" },
  { first: "Alden", last: "King", role: "VP Internal", major: "Business Administration", hue: "from-stone-600 via-stone-500 to-stone-400" },
  { first: "Ruth", last: "Dai", role: "VP External", major: "Business Administration", minor: "Minor in Political Science", hue: "from-rose-900 via-rose-800 to-rose-700" },
  { first: "Claire", last: "Guo", role: "VP Membership", major: "Business Administration", minor: "Minor in Sustainability", hue: "from-zinc-700 via-zinc-600 to-zinc-500" },
  { first: "Marcus", last: "Chen", role: "VP Finance", major: "Economics", minor: "Minor in Statistics", hue: "from-amber-800 via-amber-700 to-amber-600" },
  { first: "Priya", last: "Sharma", role: "VP Marketing", major: "Business Administration", minor: "Minor in Psychology", hue: "from-stone-500 via-stone-400 to-stone-300" },
  { first: "Daniel", last: "Park", role: "VP Alumni Relations", major: "Economics", hue: "from-slate-600 via-slate-500 to-slate-400" },
  { first: "Sophia", last: "Williams", role: "VP Events", major: "Business Administration", hue: "from-rose-800 via-rose-700 to-rose-600" },
  { first: "James", last: "Liu", role: "Secretary", major: "Business Administration", minor: "Minor in Data Science", hue: "from-zinc-800 via-zinc-700 to-zinc-600" },
];

const CHAIRS: Member[] = [
  { first: "Amy", last: "Zhang", role: "Director of Recruitment", major: "Business Administration", hue: "from-amber-700 via-amber-600 to-amber-500" },
  { first: "Kevin", last: "Wu", role: "Director of Professional Dev", major: "Computer Science", minor: "Minor in Business", hue: "from-stone-600 via-stone-500 to-stone-400" },
  { first: "Nadia", last: "Patel", role: "Director of Philanthropy", major: "Business Administration", minor: "Minor in Sociology", hue: "from-rose-700 via-rose-600 to-rose-500" },
  { first: "Tyler", last: "Johnson", role: "Director of DEI", major: "Economics", hue: "from-slate-500 via-slate-400 to-slate-300" },
  { first: "Lily", last: "Wang", role: "Director of Alumni", major: "Business Administration", minor: "Minor in Finance", hue: "from-zinc-600 via-zinc-500 to-zinc-400" },
  { first: "Ryan", last: "Kim", role: "Director of Events", major: "Business Administration", hue: "from-amber-800 via-amber-700 to-stone-600" },
  { first: "Sarah", last: "Martinez", role: "Director of Marketing", major: "Marketing", minor: "Minor in Design", hue: "from-stone-700 via-stone-600 to-stone-500" },
  { first: "David", last: "Lee", role: "Director of Finance", major: "Economics", minor: "Minor in Mathematics", hue: "from-rose-800 via-rose-700 to-rose-600" },
  { first: "Emma", last: "Brown", role: "Director of Membership", major: "Business Administration", hue: "from-slate-600 via-slate-500 to-slate-400" },
  { first: "Chris", last: "Nguyen", role: "Director of External Affairs", major: "International Business", hue: "from-zinc-700 via-zinc-600 to-zinc-500" },
];

const ACTIVES: Member[] = [
  { first: "Alex", last: "Torres", role: "Active Member", major: "Business Administration", hue: "from-amber-700 via-amber-600 to-amber-500" },
  { first: "Jordan", last: "Smith", role: "Active Member", major: "Economics", minor: "Minor in CS", hue: "from-stone-500 via-stone-400 to-stone-300" },
  { first: "Morgan", last: "Davis", role: "Active Member", major: "Business Administration", hue: "from-rose-700 via-rose-600 to-rose-500" },
  { first: "Taylor", last: "Wilson", role: "Active Member", major: "Finance", hue: "from-slate-600 via-slate-500 to-slate-400" },
  { first: "Casey", last: "Anderson", role: "Active Member", major: "Business Administration", minor: "Minor in French", hue: "from-zinc-600 via-zinc-500 to-zinc-400" },
  { first: "Riley", last: "Thomas", role: "Active Member", major: "Economics", hue: "from-amber-800 via-amber-700 to-amber-600" },
  { first: "Drew", last: "Jackson", role: "Active Member", major: "Business Administration", hue: "from-stone-600 via-stone-500 to-stone-400" },
  { first: "Quinn", last: "White", role: "Active Member", major: "Marketing", hue: "from-rose-800 via-rose-700 to-rose-600" },
  { first: "Avery", last: "Harris", role: "Active Member", major: "Business Administration", minor: "Minor in Spanish", hue: "from-slate-700 via-slate-600 to-slate-500" },
  { first: "Reese", last: "Martin", role: "Active Member", major: "Economics", hue: "from-zinc-700 via-zinc-600 to-zinc-500" },
  { first: "Logan", last: "Garcia", role: "Active Member", major: "Business Administration", hue: "from-amber-900 via-amber-800 to-amber-700" },
  { first: "Parker", last: "Rodriguez", role: "Active Member", major: "Finance", minor: "Minor in Data Science", hue: "from-stone-700 via-stone-600 to-stone-500" },
  { first: "Sage", last: "Lewis", role: "Active Member", major: "Business Administration", hue: "from-rose-900 via-rose-800 to-rose-700" },
  { first: "Finley", last: "Lee", role: "Active Member", major: "Economics", hue: "from-slate-500 via-slate-400 to-slate-300" },
  { first: "Blake", last: "Walker", role: "Active Member", major: "Business Administration", minor: "Minor in Philosophy", hue: "from-zinc-500 via-zinc-400 to-zinc-300" },
];

const TABS = ["BOARD", "CHAIRS", "ACTIVES"] as const;
type Tab = typeof TABS[number];

const TAB_DATA: Record<Tab, Member[]> = {
  BOARD: BOARD,
  CHAIRS: CHAIRS,
  ACTIVES: ACTIVES,
};

// ── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({ member, index }: { member: Member; index: number }) {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: (index % 5) * 0.08 }}
    >
      {/* Photo */}
      <div className="mb-5">
        <div
          className={`w-24 h-24 rounded-full bg-gradient-to-br ${member.hue} ring-2 ring-[#7A0C0C] ring-offset-2 flex items-center justify-center`}
        >
          <span className="text-white/70 text-lg font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
            {member.first[0]}{member.last[0]}
          </span>
        </div>
      </div>

      {/* Name */}
      <p
        className="text-gray-900 font-bold text-lg leading-tight mb-1"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {member.first}
        <br />
        {member.last}
      </p>

      {/* Role */}
      <p
        className="text-[#7A0C0C] font-semibold text-sm leading-snug mb-3"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {member.role}
      </p>

      {/* Major / Minor */}
      <div className="text-gray-500 text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
        <p>{member.major}</p>
        {member.minor && <p>{member.minor}</p>}
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Members() {
  const [wordIndex, setWordIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("BOARD");

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const members = TAB_DATA[activeTab];

  return (
    <div className="min-h-screen bg-white pb-24">

      {/* Hero Banner — matches About Us */}
      <div className="relative w-full h-[52vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 25% 60%, #78350f 0%, transparent 55%), radial-gradient(ellipse at 75% 35%, #44403c 0%, transparent 50%)",
          }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 h-full flex items-end px-16 pb-12 pt-20">
          <motion.h1
            className="text-white font-normal leading-none"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            Our Members
          </motion.h1>
        </div>
      </div>

      {/* Content below hero */}
      <div className="pt-12 px-10">

        {/* Tab bar */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 text-sm font-bold tracking-widest uppercase border-2 transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[#7A0C0C] border-[#7A0C0C] text-white"
                    : "bg-white border-gray-300 text-gray-600 hover:border-[#7A0C0C] hover:text-[#7A0C0C]"
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Member grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {members.map((m, i) => (
              <MemberCard key={`${m.first}-${m.last}`} member={m} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
