import { motion } from "motion/react";
import pgnLogo from "@/imports/pgn_logo_1__1_.png";
import { useContent } from "@/app/hooks/useContent";

export default function Recruitment() {
  const { get } = useContent("recruitment");

  const hideBannerImage = get("recruitment.banner.hide_image", "false") === "true";
  const bannerImageUrl = hideBannerImage ? "" : get("recruitment.banner.image_url", "");

  const hideSideImage = get("recruitment.side_image.hide_image", "false") === "true";
  const sideImageUrl = get("recruitment.side_image.image_url", "");

  const body = get(
    "recruitment.body",
    "Fall 2026 recruitment is coming soon. Sign up to stay in the loop on events and applications.",
  );
  const ctaText = get("recruitment.cta_text", "Join Interest Form");
  const interestFormUrl = get("recruitment.interest_form_url", "#");

  return (
    <div className="min-h-screen bg-[#1a0303] flex flex-col">
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="relative w-full h-[52vh] overflow-hidden">
        {bannerImageUrl ? (
          <img src={bannerImageUrl} alt="Recruitment Banner" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800" />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 25% 60%, #78350f 0%, transparent 55%), radial-gradient(ellipse at 75% 35%, #44403c 0%, transparent 50%)",
              }}
            />
          </>
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 h-full flex items-end px-8 md:px-16 pb-12 pt-20">
          <motion.h1
            className="text-white font-normal leading-none"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            Recruitment
          </motion.h1>
        </div>
      </div>

      {/* ── Recruitment Content Section ─────────────────────────────────── */}
      <section className="relative flex-1 flex items-center justify-center py-20 md:py-28 px-8 overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0 bg-[#1a0303]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, rgba(180,30,10,0.45) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(210,80,10,0.3) 0%, transparent 50%), radial-gradient(ellipse at 55% 80%, rgba(245,166,35,0.15) 0%, transparent 45%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 8px)",
          }}
        />

        <div
          className={`relative z-10 w-full max-w-6xl mx-auto flex flex-col ${
            !hideSideImage
              ? "md:flex-row items-center gap-12 lg:gap-16"
              : "items-center text-center max-w-2xl"
          }`}
        >
          {/* Left Content (Logo, Text, Button) */}
          <div
            className={`flex-1 flex flex-col ${
              !hideSideImage ? "items-start text-left" : "items-center text-center"
            }`}
          >
            <motion.img
              src={pgnLogo}
              alt="Phi Gamma Nu"
              className={`w-full brightness-0 invert object-contain ${
                !hideSideImage ? "max-w-[26rem] lg:max-w-[32rem] mb-10" : "max-w-[36rem] lg:max-w-[48rem] mb-12"
              }`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />

            <motion.p
              className="text-white/70 text-base md:text-lg leading-relaxed mb-10 max-w-xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
            >
              {body}
            </motion.p>

            <motion.a
              href={interestFormUrl}
              target={interestFormUrl !== "#" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full border-2 border-[#F5A623] text-[#F5A623] text-sm font-bold tracking-widest uppercase hover:bg-[#F5A623] hover:text-[#1a0303] transition-all duration-200 inline-block cursor-pointer shadow-md hover:shadow-lg"
              style={{ fontFamily: "'Inter', sans-serif" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            >
              {ctaText}
            </motion.a>
          </div>

          {/* Right Content (Side Image) */}
          {!hideSideImage && (
            <motion.div
              className="w-full md:w-[420px] lg:w-[480px] flex-shrink-0 aspect-[4/3] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              {sideImageUrl ? (
                <img src={sideImageUrl} alt="Recruitment" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-white/50">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 border border-white/10 shadow-inner">
                    <img src={pgnLogo} alt="" className="h-7 w-auto brightness-0 invert opacity-60" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-white/70">Recruitment Photo</span>
                  <p className="text-[11px] text-white/40 mt-1">Add an image URL in the admin portal</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}



