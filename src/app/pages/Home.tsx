import { motion } from "motion/react";
import pgnVideo from "@/imports/PGN_Michigan__1_.mp4";
import { useContent } from "@/app/hooks/useContent";

function Hero() {
  const { get } = useContent("recruitment");
  const interestFormUrl = get("recruitment.interest_form_url", "#");
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

      <div className="absolute bottom-20 left-0 right-0 z-10 flex justify-center">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-24">
          <a
            href="/apply"
            className="text-white text-xl font-light border-b-2 border-white pb-1.5 tracking-wide hover:text-[#F5A623] hover:border-[#F5A623] transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            W26 Application
          </a>
          <a
            href={interestFormUrl}
            target={interestFormUrl !== "#" ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="text-white text-xl font-light border-b-2 border-white pb-1.5 tracking-wide hover:text-[#F5A623] hover:border-[#F5A623] transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Interest Form
          </a>
        </div>
      </div>
    </div>
  );
}

function PresidentWelcome() {
  const { get } = useContent("home");

  const imageUrl = get("home.president.image_url", "");
  const yellowText = get("home.president.yellow_text", "Welcome to PGN at the University of Michigan!");
  const heading = get("home.president.heading", "President's Welcome");
  const body1 = get(
    "home.president.body_1",
    "On behalf of the brotherhood, it is my pleasure to welcome you to Phi Gamma Nu at the University of Michigan. Thank you for taking the time to learn more about our organization, our values, and our people.",
  );
  const body2 = get(
    "home.president.body_2",
    "PGN is one of the largest professional business fraternities in the United States, with a rich history dating back to 1927. Our Delta Phi chapter here at Michigan is proud to uphold these traditions while forging new paths as future business leaders.",
  );

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
          {imageUrl ? (
            <img src={imageUrl} alt="President" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-end justify-center pb-8">
              <span className="text-amber-200/40 text-xs tracking-widest uppercase">President</span>
            </div>
          )}
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
            {heading}
          </h2>
          <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug">
            {yellowText}
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4 text-[0.95rem]">{body1}</p>
          <p className="text-gray-700 leading-relaxed text-[0.95rem]">{body2}</p>
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
