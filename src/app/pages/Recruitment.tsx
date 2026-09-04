import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
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

  const showSideImage = !hideSideImage && (sideImageUrl || true);

  return (
    <div className="min-h-screen bg-white pb-24">
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
      <section className="py-16 md:py-24 px-6 md:px-16" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div
          className={`max-w-6xl mx-auto flex flex-col ${
            !hideSideImage ? "md:flex-row items-center gap-12 lg:gap-16" : "items-center text-center max-w-3xl"
          }`}
        >
          {/* Left Content (Logo, Text, Button) */}
          <motion.div
            className={`flex-1 flex flex-col ${!hideSideImage ? "items-start text-left" : "items-center text-center"}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.img
              src={pgnLogo}
              alt="Phi Gamma Nu"
              className="w-full max-w-[280px] sm:max-w-[340px] mb-8 object-contain"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            <motion.p
              className="text-gray-700 text-base md:text-lg leading-relaxed mb-8 max-w-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            >
              {body}
            </motion.p>

            <motion.a
              href={interestFormUrl}
              target={interestFormUrl !== "#" ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#7A0C0C] text-white text-xs sm:text-sm font-bold tracking-widest uppercase hover:bg-[#5C0A0A] hover:shadow-lg transition-all duration-200 group cursor-pointer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <span>{ctaText}</span>
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>
          </motion.div>

          {/* Right Content (Side Image) */}
          {!hideSideImage && (
            <motion.div
              className="w-full md:w-[420px] lg:w-[480px] flex-shrink-0 aspect-[4/3] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400 flex items-center justify-center"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              {sideImageUrl ? (
                <img src={sideImageUrl} alt="Recruitment" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-stone-500">
                  <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-3 shadow-xs">
                    <img src={pgnLogo} alt="" className="h-7 w-auto opacity-70" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase">Recruitment Photo</span>
                  <p className="text-[11px] text-stone-400 mt-1">Add an image URL in the admin portal</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}


