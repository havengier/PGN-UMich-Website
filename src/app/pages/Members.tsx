import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Linkedin } from "lucide-react";

// ── Rotating subtitle words ───────────────────────────────────────────────────
const WORDS = ["philanthropists", "professionals", "brothers", "leaders", "innovators"];

// ── Member types ──────────────────────────────────────────────────────────────
type Member = {
  name?: string;
  first?: string;
  last?: string;
  role: string;
  major: string;
  minor?: string;
  pledge_class?: string;
  linkedin_url?: string;
  hue: string;
  photo_url?: string;
  categories?: string[];
};

// ── Hardcoded fallback data ───────────────────────────────────────────────────
const BOARD: Member[] = [
  { first: "Elliott", last: "Nederhood", role: "President", major: "Business Administration", minor: "Minor in Philosophy", pledge_class: "Fall 2023", linkedin_url: "https://www.linkedin.com/", hue: "from-amber-900 via-amber-800 to-stone-700", categories: ["BOARD"] },
  { first: "Jing", last: "Li", role: "VP Professional Development", major: "Business Administration", pledge_class: "Winter 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-slate-700 via-slate-600 to-slate-500", categories: ["BOARD"] },
  { first: "Alden", last: "King", role: "VP Internal", major: "Business Administration", pledge_class: "Fall 2023", linkedin_url: "https://www.linkedin.com/", hue: "from-stone-600 via-stone-500 to-stone-400", categories: ["BOARD"] },
  { first: "Ruth", last: "Dai", role: "VP External", major: "Business Administration", minor: "Minor in Political Science", pledge_class: "Winter 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-rose-900 via-rose-800 to-rose-700", categories: ["BOARD"] },
  { first: "Claire", last: "Guo", role: "VP Membership", major: "Business Administration", minor: "Minor in Sustainability", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-zinc-700 via-zinc-600 to-zinc-500", categories: ["BOARD"] },
  { first: "Marcus", last: "Chen", role: "VP Finance", major: "Economics", minor: "Minor in Statistics", pledge_class: "Winter 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-amber-800 via-amber-700 to-amber-600", categories: ["BOARD"] },
  { first: "Priya", last: "Sharma", role: "VP Marketing", major: "Business Administration", minor: "Minor in Psychology", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-stone-500 via-stone-400 to-stone-300", categories: ["BOARD"] },
  { first: "Daniel", last: "Park", role: "VP Alumni Relations", major: "Economics", pledge_class: "Fall 2023", linkedin_url: "https://www.linkedin.com/", hue: "from-slate-600 via-slate-500 to-slate-400", categories: ["BOARD"] },
  { first: "Sophia", last: "Williams", role: "VP Events", major: "Business Administration", pledge_class: "Winter 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-rose-800 via-rose-700 to-rose-600", categories: ["BOARD"] },
  { first: "James", last: "Liu", role: "Secretary", major: "Business Administration", minor: "Minor in Data Science", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-zinc-800 via-zinc-700 to-zinc-600", categories: ["BOARD"] },
];

const CHAIRS: Member[] = [
  { first: "Amy", last: "Zhang", role: "Director of Recruitment", major: "Business Administration", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-amber-700 via-amber-600 to-amber-500", categories: ["CHAIRS"] },
  { first: "Kevin", last: "Wu", role: "Director of Professional Dev", major: "Computer Science", minor: "Minor in Business", pledge_class: "Winter 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-stone-600 via-stone-500 to-stone-400", categories: ["CHAIRS"] },
  { first: "Nadia", last: "Patel", role: "Director of Philanthropy", major: "Business Administration", minor: "Minor in Sociology", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-rose-700 via-rose-600 to-rose-500", categories: ["CHAIRS"] },
  { first: "Tyler", last: "Johnson", role: "Director of DEI", major: "Economics", pledge_class: "Winter 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-slate-500 via-slate-400 to-slate-300", categories: ["CHAIRS"] },
  { first: "Lily", last: "Wang", role: "Director of Alumni", major: "Business Administration", minor: "Minor in Finance", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-zinc-600 via-zinc-500 to-zinc-400", categories: ["CHAIRS"] },
  { first: "Ryan", last: "Kim", role: "Director of Events", major: "Business Administration", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-amber-800 via-amber-700 to-stone-600", categories: ["CHAIRS"] },
  { first: "Sarah", last: "Martinez", role: "Director of Marketing", major: "Marketing", minor: "Minor in Design", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-stone-700 via-stone-600 to-stone-500", categories: ["CHAIRS"] },
  { first: "David", last: "Lee", role: "Director of Finance", major: "Economics", minor: "Minor in Mathematics", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-rose-800 via-rose-700 to-rose-600", categories: ["CHAIRS"] },
  { first: "Emma", last: "Brown", role: "Director of Membership", major: "Business Administration", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-slate-600 via-slate-500 to-slate-400", categories: ["CHAIRS"] },
  { first: "Chris", last: "Nguyen", role: "Director of External Affairs", major: "International Business", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-zinc-700 via-zinc-600 to-zinc-500", categories: ["CHAIRS"] },
];

const ACTIVES: Member[] = [
  { first: "Alex", last: "Torres", role: "Active Member", major: "Business Administration", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-amber-700 via-amber-600 to-amber-500", categories: ["ACTIVES"] },
  { first: "Jordan", last: "Smith", role: "Active Member", major: "Economics", minor: "Minor in CS", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-stone-500 via-stone-400 to-stone-300", categories: ["ACTIVES"] },
  { first: "Morgan", last: "Davis", role: "Active Member", major: "Business Administration", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-rose-700 via-rose-600 to-rose-500", categories: ["ACTIVES"] },
  { first: "Taylor", last: "Wilson", role: "Active Member", major: "Finance", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-slate-600 via-slate-500 to-slate-400", categories: ["ACTIVES"] },
  { first: "Casey", last: "Anderson", role: "Active Member", major: "Business Administration", minor: "Minor in French", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-zinc-600 via-zinc-500 to-zinc-400", categories: ["ACTIVES"] },
  { first: "Riley", last: "Thomas", role: "Active Member", major: "Economics", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-amber-800 via-amber-700 to-amber-600", categories: ["ACTIVES"] },
  { first: "Drew", last: "Jackson", role: "Active Member", major: "Business Administration", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-stone-600 via-stone-500 to-stone-400", categories: ["ACTIVES"] },
  { first: "Quinn", last: "White", role: "Active Member", major: "Marketing", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-rose-800 via-rose-700 to-rose-600", categories: ["ACTIVES"] },
  { first: "Avery", last: "Harris", role: "Active Member", major: "Business Administration", minor: "Minor in Spanish", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-slate-700 via-slate-600 to-slate-500", categories: ["ACTIVES"] },
  { first: "Reese", last: "Martin", role: "Active Member", major: "Economics", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-zinc-700 via-zinc-600 to-zinc-500", categories: ["ACTIVES"] },
  { first: "Logan", last: "Garcia", role: "Active Member", major: "Business Administration", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-amber-900 via-amber-800 to-amber-700", categories: ["ACTIVES"] },
  { first: "Parker", last: "Rodriguez", role: "Active Member", major: "Finance", minor: "Minor in Data Science", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-stone-700 via-stone-600 to-stone-500", categories: ["ACTIVES"] },
  { first: "Sage", last: "Lewis", role: "Active Member", major: "Business Administration", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-rose-900 via-rose-800 to-rose-700", categories: ["ACTIVES"] },
  { first: "Finley", last: "Lee", role: "Active Member", major: "Economics", pledge_class: "Winter 2025", linkedin_url: "https://www.linkedin.com/", hue: "from-slate-500 via-slate-400 to-slate-300", categories: ["ACTIVES"] },
  { first: "Blake", last: "Walker", role: "Active Member", major: "Business Administration", minor: "Minor in Philosophy", pledge_class: "Fall 2024", linkedin_url: "https://www.linkedin.com/", hue: "from-zinc-500 via-zinc-400 to-zinc-300", categories: ["ACTIVES"] },
];

const FALLBACK_ALL: Member[] = [...BOARD, ...CHAIRS, ...ACTIVES];

const TABS = ["BOARD", "CHAIRS", "ACTIVES"] as const;
type Tab = typeof TABS[number];

// ── Member Card ───────────────────────────────────────────────────────────────
function MemberCard({ member, index }: { member: Member; index: number }) {
  const displayName = member.name || [member.first, member.last].filter(Boolean).join(" ");
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PGN";

  const cardContent = (
    <motion.div
      className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: (index % 5) * 0.08 }}
    >
      {/* Photo */}
      <div className="mb-5">
        <div
          className={`w-24 h-24 rounded-full bg-gradient-to-br ${member.hue} ring-2 ring-[#7A0C0C] ring-offset-2 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105`}
        >
          {member.photo_url ? (
            <img src={member.photo_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/70 text-lg font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <p
        className="text-gray-900 font-bold text-lg leading-tight mb-1 transition-colors duration-200 group-hover:text-[#7A0C0C]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {displayName}
      </p>

      {/* Role */}
      <p
        className="text-[#7A0C0C] font-semibold text-sm leading-snug mb-3"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {member.role}
      </p>

      {/* Major / Minor / Pledge Class */}
      <div className="text-gray-500 text-sm leading-relaxed mt-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
        <p>{member.major}</p>
        {member.minor && <p>{member.minor}</p>}
        {member.pledge_class && (
          <p className="text-xs text-stone-400 font-medium mt-1.5">
            {member.pledge_class}
          </p>
        )}
      </div>

      {/* Hover Overlay: Greying card + semi-transparent LinkedIn icon */}
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[0.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col items-center justify-center rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-white/95 text-[#0077B5] shadow-lg flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
          <Linkedin size={24} className="fill-current" />
        </div>
        {member.linkedin_url ? (
          <span className="text-[10px] font-bold text-white tracking-widest uppercase mt-2 drop-shadow bg-black/40 px-2.5 py-0.5 rounded-full">
            LinkedIn
          </span>
        ) : null}
      </div>
    </motion.div>
  );

  if (member.linkedin_url) {
    return (
      <a
        href={member.linkedin_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0C0C] rounded-2xl"
        title={`View ${displayName}'s LinkedIn`}
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Members() {
  const [wordIndex, setWordIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("BOARD");
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((rows: { id: number; name?: string; first_name?: string; last_name?: string; role: string; major: string; minor: string; pledge_class: string | null; linkedin_url: string | null; photo_url: string | null; hue: string; categories: string[] }[]) => {
        if (rows.length > 0) {
          setAllMembers(
            rows.map((m) => ({
              name: m.name || [m.first_name, m.last_name].filter(Boolean).join(" "),
              first: m.first_name,
              last: m.last_name,
              role: m.role ?? "",
              major: m.major ?? "",
              minor: m.minor || undefined,
              pledge_class: m.pledge_class || undefined,
              linkedin_url: m.linkedin_url || undefined,
              hue: m.hue ?? "from-amber-900 via-amber-800 to-stone-700",
              photo_url: m.photo_url ?? undefined,
              categories: m.categories ?? [],
            }))
          );
          setDbLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  const source = dbLoaded ? allMembers : FALLBACK_ALL;
  const members = source.filter((m) => (m.categories ?? []).includes(activeTab));

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
