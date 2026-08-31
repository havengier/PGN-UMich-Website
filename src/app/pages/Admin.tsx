import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Home, Info, Briefcase, Users, Heart, UserPlus, FileText,
  ArrowRight,
} from "lucide-react";
import { LoginGate } from "@/app/components/LoginGate";

const PAGES = [
  {
    label: "Home",
    path: "/",
    icon: Home,
    description: "Hero video, President's Welcome section.",
  },
  {
    label: "About Us",
    path: "/about",
    icon: Info,
    description: "What's PGN, the Four Pillars accordion.",
  },
  {
    label: "Professional",
    path: "/professional",
    icon: Briefcase,
    description: "Internship summary, features, alumni testimonials.",
  },
  {
    label: "Members",
    path: "/members",
    icon: Users,
    description: "Board, Chairs, and Actives tabbed grid.",
  },
  {
    label: "DEI",
    path: "/dei",
    icon: Heart,
    description: "DEI mission statement and photo gallery.",
  },
  {
    label: "Recruitment",
    path: "/recruitment",
    icon: UserPlus,
    description: "Fall 2026 recruitment splash and interest form CTA.",
  },
  {
    label: "Apply",
    path: "/apply",
    icon: FileText,
    description: "Full application form with database submission.",
  },
];

export default function Admin() {
  return (
    <LoginGate requireAdmin>
      <AdminContent />
    </LoginGate>
  );
}

function AdminContent() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-[#1a0303] px-8 md:px-16 py-14 pt-28">
        <motion.p
          className="text-[#F5A623] text-xs font-bold tracking-[0.25em] uppercase mb-3"
          style={{ fontFamily: "'Inter', sans-serif" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Internal
        </motion.p>
        <motion.h1
          className="text-white font-normal leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          Admin Dashboard
        </motion.h1>
        <motion.p
          className="text-white/50 text-sm mt-3 max-w-lg"
          style={{ fontFamily: "'Inter', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Quick navigation to every page of the PGN website.
        </motion.p>
      </div>

      {/* Page grid */}
      <div className="px-8 md:px-16 py-14">
        <p
          className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-8"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Pages
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PAGES.map(({ label, path, icon: Icon, description }, i) => (
            <motion.div
              key={path}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.06 }}
            >
              <Link
                to={path}
                className="group flex flex-col h-full bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#7A0C0C]/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#7A0C0C]/8 flex items-center justify-center">
                    <Icon size={20} strokeWidth={1.8} className="text-[#7A0C0C]" />
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-[#7A0C0C] group-hover:translate-x-1 transition-all duration-200"
                  />
                </div>
                <p
                  className="text-gray-900 font-semibold text-base mb-2 leading-tight"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {label}
                </p>
                <p
                  className="text-gray-500 text-xs leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {description}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <span
                    className="text-[0.7rem] font-mono text-gray-400"
                  >
                    {path === "/" ? "/" : path}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
