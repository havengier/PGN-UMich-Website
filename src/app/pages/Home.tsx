import { motion } from "motion/react";
import pgnVideo from "@/imports/PGN_Michigan__1_.mp4";
import { useContent } from "@/app/hooks/useContent";

function Hero() {
  const { get } = useContent("home");
  const button1Text = get("home.hero.button_1_text", "W26 Application");
  const button1Url = get("home.hero.button_1_url", "/apply");
  const button2Text = get("home.hero.button_2_text", "Interest Form");
  const button2Url = get("home.hero.button_2_url", "#");

  const isButton1External = button1Url.startsWith("http://") || button1Url.startsWith("https://");
  const isButton2External = button2Url.startsWith("http://") || button2Url.startsWith("https://");

  return (
    <div className="relative h-dvh overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-bottom"
      >
        <source src={pgnVideo} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/45 pointer-events-none" />

      <div className="absolute bottom-20 left-0 right-0 z-10 flex justify-center">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-24">
          {button1Text && (
            <a
              href={button1Url || "#"}
              target={isButton1External ? "_blank" : undefined}
              rel={isButton1External ? "noopener noreferrer" : undefined}
              className="text-white text-xl font-light border-b-2 border-white pb-1.5 tracking-wide hover:text-[#F5A623] hover:border-[#F5A623] transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {button1Text}
            </a>
          )}
          {button2Text && (
            <a
              href={button2Url || "#"}
              target={isButton2External ? "_blank" : undefined}
              rel={isButton2External ? "noopener noreferrer" : undefined}
              className="text-white text-xl font-light border-b-2 border-white pb-1.5 tracking-wide hover:text-[#F5A623] hover:border-[#F5A623] transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {button2Text}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PresidentWelcome() {
  const { get } = useContent("home");

  const hideImage = get("home.president.hide_image", "false") === "true";
  const imageUrl = get("home.president.image_url", "");
  const imageWidth = Number(get("home.president.image_width", "288")) || 288;
  const yellowText = get("home.president.yellow_text", "Welcome to PGN at the University of Michigan!");
  const heading = get("home.president.heading", "President's Welcome");
  const headingFontSize = Number(get("home.president.heading_font_size", "42")) || 42;
  const bodyFontSize = Number(get("home.president.body_font_size", "15")) || 15;

  const DEFAULT_BODY =
    "On behalf of the brotherhood, it is my pleasure to welcome you to Phi Gamma Nu at the University of Michigan. Thank you for taking the time to learn more about our organization, our values, and our people.\n\nPGN is one of the largest professional business fraternities in the United States, with a rich history dating back to 1927. Our Delta Phi chapter here at Michigan is proud to uphold these traditions while forging new paths as future business leaders.";

  const rawBody =
    get("home.president.body", "") ||
    [get("home.president.body_1", ""), get("home.president.body_2", "")].filter(Boolean).join("\n\n") ||
    DEFAULT_BODY;

  const paragraphs = rawBody
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section
      className="py-20 md:py-28 px-6 sm:px-12 md:px-16 lg:px-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className={`max-w-7xl mx-auto flex flex-col md:flex-row ${hideImage ? "items-center justify-center" : "gap-12 md:gap-16 lg:gap-20 items-start"}`}>
        {!hideImage && (
          <motion.div
            className="w-full md:flex-shrink-0 rounded-2xl overflow-hidden shadow-xl aspect-[3/4] bg-gradient-to-br from-amber-950 via-stone-800 to-stone-900"
            style={{ width: "100%", maxWidth: `${imageWidth}px` }}
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
        )}

        <motion.div
          className={`pt-0 md:pt-2 flex-1 min-w-0 ${hideImage ? "max-w-4xl w-full" : ""}`}
          initial={{ opacity: 0, x: hideImage ? 0 : 60, y: hideImage ? 30 : 0 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        >
          <h2
            className="font-normal text-gray-900 mb-7 leading-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: `${headingFontSize}px`,
            }}
          >
            {heading}
          </h2>
          <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug">
            {yellowText}
          </h3>
          <div className="space-y-4">
            {paragraphs.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-black leading-relaxed whitespace-pre-line"
                style={{ fontSize: `${bodyFontSize}px` }}
              >
                {paragraph}
              </p>
            ))}
          </div>
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
