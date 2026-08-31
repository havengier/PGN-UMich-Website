import { Link } from "react-router";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <motion.p
        className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-[#7A0C0C] mb-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        404
      </motion.p>

      <motion.h1
        className="font-normal text-gray-900 mb-5 leading-tight"
        style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08 }}
      >
        Page Not Found
      </motion.h1>

      <motion.p
        className="text-gray-500 text-base max-w-sm leading-relaxed mb-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.18 }}
      >
        The page you're looking for doesn't exist or has been moved.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28 }}
      >
        <Link
          to="/"
          className="px-7 py-3 bg-[#7A0C0C] text-white text-sm font-semibold tracking-wide hover:bg-[#5C0A0A] transition-colors"
        >
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
