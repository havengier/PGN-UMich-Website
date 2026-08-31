import { motion } from "motion/react";
import pgnLogo from "@/imports/pgn_logo_1__1_.png";

export default function Recruitment() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-8 overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-[#1a0303]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 50%, rgba(180,30,10,0.45) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(210,80,10,0.3) 0%, transparent 50%), radial-gradient(ellipse at 55% 80%, rgba(245,166,35,0.15) 0%, transparent 45%)",
        }}
      />
      {/* Subtle noise texture via repeating gradient */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 8px)",
        }}
      />

      <div className="relative flex flex-col items-center text-center max-w-xl">

        {/* PGN Logo — inverted white */}
        <motion.img
          src={pgnLogo}
          alt="Phi Gamma Nu"
          className="w-full max-w-[54rem] mb-12 brightness-0 invert"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        {/* Body copy */}
        <motion.p
          className="text-white/70 text-base leading-relaxed mb-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
        >
          Fall 2026 recruitment is coming soon. Sign up to stay in the loop on events and applications.
        </motion.p>

        {/* CTA button */}
        <motion.a
          href="#"
          className="px-8 py-3 rounded-full border-2 border-[#F5A623] text-[#F5A623] text-sm font-bold tracking-widest uppercase hover:bg-[#F5A623] hover:text-[#1a0303] transition-all duration-200"
          style={{ fontFamily: "'Inter', sans-serif" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          Join Interest Form
        </motion.a>

      </div>
    </div>
  );
}

