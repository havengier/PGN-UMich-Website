import { motion } from "motion/react";
import pgnVideo from "@/imports/PGN_Michigan__1_.mp4";

function Hero() {
  return (
    <div className="relative h-dvh overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={pgnVideo} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55" />

      <div className="relative z-10 flex flex-col items-center h-dvh pt-20">
        <div className="flex-1" />

        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-24 mb-10">
          {["W26 Application", "Interest Form"].map((label) => (
            <a
              key={label}
              href="#"
              className="text-white text-xl font-light border-b-2 border-white pb-1.5 tracking-wide hover:text-[#F5A623] hover:border-[#F5A623] transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="pb-10" />
      </div>
    </div>
  );
}

function PresidentWelcome() {
  return (
    <section
      className="py-16 md:py-24 px-6 md:px-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10 md:gap-16 items-start">
        <motion.div
          className="w-full md:w-72 md:flex-shrink-0 rounded-2xl overflow-hidden shadow-xl aspect-[3/4] bg-gradient-to-br from-amber-950 via-stone-800 to-stone-900"
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="w-full h-full flex items-end justify-center pb-8">
            <span className="text-amber-200/40 text-xs tracking-widest uppercase">President</span>
          </div>
        </motion.div>

        <motion.div
          className="pt-0 md:pt-2"
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        >
          <h2
            className="text-[2.6rem] font-normal text-gray-900 mb-7 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            President's Welcome
          </h2>
          <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug">
            Welcome to PGN at the University of Michigan!
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4 text-[0.95rem]">
            On behalf of the brotherhood, it is my pleasure to welcome you to
            Phi Gamma Nu at the University of Michigan. Thank you for taking the
            time to learn more about our organization, our values, and our people.
          </p>
          <p className="text-gray-700 leading-relaxed text-[0.95rem]">
            PGN is one of the largest professional business fraternities in the
            United States, with a rich history dating back to 1927. Our Delta
            Phi chapter here at Michigan is proud to uphold these traditions
            while forging new paths as future business leaders.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <PresidentWelcome />
    </>
  );
}
