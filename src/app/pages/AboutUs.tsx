import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";
import { useContent } from "@/app/hooks/useContent";

const PILLAR_KEYS = ["professionalism", "philanthropy", "dei", "brotherhood"] as const;

const PILLAR_DEFAULTS: Record<string, { title: string; content: string }> = {
  professionalism: {
    title: "Professionalism",
    content:
      "Many students are drawn to PGN for our emphasis on business and professionalism. We help students realize their full potential through ongoing career exploration and self-reflection, a mentorship program for professional development and guidance, academic support, and opportunities such as company visits, networking, workshops, and other learning experiences. Many brothers serve in leadership positions in other organizations on campus, and all of our brothers move onto impressive and fulfilling pursuits following graduation.",
  },
  philanthropy: {
    title: "Philanthropy",
    content:
      "PGN seeks to cultivate a spirit of compassion in the professional and personal lives of brothers. Our chapter participates in a variety of philanthropic events and activities throughout the year, giving back to the local Ann Arbor community and beyond. Brothers are encouraged to lead service initiatives and make a tangible difference in the lives of others.",
  },
  dei: {
    title: "DEI",
    content:
      "Through our DEI efforts, PGN seeks to create a diverse and welcoming community. We believe that diversity of background, thought, and experience strengthens our brotherhood and better prepares us to lead in an increasingly interconnected and global world. Our chapter actively works to foster an inclusive environment where every member can thrive.",
  },
  brotherhood: {
    title: "Brotherhood",
    content:
      "PGN seeks to nurture a sense of community among our members. Brotherhood is at the heart of everything we do â€” from social events and retreats to mentorship and mutual support throughout our time at Michigan. The bonds formed here last well beyond graduation.",
  },
};

function PillarAccordion() {
  const { get } = useContent("about");
  const [open, setOpen] = useState<string>("Professionalism");

  const pillars = PILLAR_KEYS.map((key) => ({
    title: get(`about.pillar.${key}.title`, PILLAR_DEFAULTS[key].title),
    content: get(`about.pillar.${key}.content`, PILLAR_DEFAULTS[key].content),
  }));

  return (
    <div className="w-full">
      {pillars.map(({ title, content }) => {
        const isOpen = open === title;
        return (
          <div key={title} className="border-t border-gray-200 last:border-b">
            <button
              onClick={() => setOpen(isOpen ? "" : title)}
              className="w-full flex items-center justify-between py-5 text-left group"
            >
              <span
                className={`text-[1.9rem] font-normal transition-colors ${
                  isOpen ? "text-[#7A0C0C]" : "text-gray-900"
                }`}
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {title}
              </span>
              {isOpen ? (
                <Minus size={20} className="text-gray-400 flex-shrink-0" />
              ) : (
                <Plus size={20} className="text-gray-400 flex-shrink-0" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p
                    className="text-gray-700 leading-relaxed text-[0.95rem] pb-6"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function AboutUs() {
  const { get } = useContent("about");

  const hideBannerImage = get("about.banner.hide_image", "false") === "true";
  const hidePgnImage = get("about.pgn.hide_image", "false") === "true";

  const bannerImageUrl = hideBannerImage ? "" : get("about.banner.image_url", "");
  const pgn = {
    imageUrl: get("about.pgn.image_url", ""),
    overline: get("about.pgn.overline", "About Us"),
    heading: get("about.pgn.heading", "What's PGN?"),
    body: get(
      "about.pgn.body",
      "PGN is a professional development organization that was founded in 1924. Since then, the organization has grown immensely, expanding to 20+ active chapters and drawing driven individuals from all majors and backgrounds to grow their professional and personal skills to better succeed in today's workplace and serve as tomorrow's leaders.",
    ),
  };
  const pillarsIntro = get(
    "about.pillars.intro",
    "Phi Gamma Nu proudly upholds four National Pillars which represent the underlying ideals of the organization: Professionalism, Philanthropy, DEI, and Brotherhood.",
  );

  return (
    <>
      {/* Hero Banner */}
      <div className="relative w-full h-[52vh] overflow-hidden">
        {bannerImageUrl ? (
          <img src={bannerImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 30% 50%, #78350f 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, #44403c 0%, transparent 50%)",
              }}
            />
          </>
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 h-full flex items-end px-16 pb-12 pt-20">
          <motion.h1
            className="text-white font-normal leading-none"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            About Us
          </motion.h1>
        </div>
      </div>

      {/* What's PGN */}
      <section className="py-20 px-16" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className={`max-w-6xl mx-auto flex ${hidePgnImage ? "justify-center" : "gap-16 items-start"}`}>
          <motion.div
            className={hidePgnImage ? "max-w-3xl w-full text-center" : "flex-1"}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-gray-500 mb-6">
              {pgn.overline}
            </p>
            <h2
              className="text-4xl font-normal text-gray-900 mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {pgn.heading}
            </h2>
            <p className="text-gray-700 leading-relaxed text-[0.95rem]">{pgn.body}</p>
          </motion.div>

          {!hidePgnImage && (
            <motion.div
              className="w-[420px] flex-shrink-0 rounded-xl overflow-hidden shadow-lg aspect-[4/5] bg-gradient-to-br from-stone-300 via-stone-400 to-stone-500 flex items-end justify-center pb-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            >
              {pgn.imageUrl ? (
                <img src={pgn.imageUrl} alt="Chapter" className="w-full h-full object-cover" />
              ) : (
                <span className="text-stone-600/60 text-xs tracking-widest uppercase">Chapter Photo</span>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Our Four Pillars */}
      <section className="py-20 px-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex gap-24 items-start">
          {/* Left */}
          <motion.div
            className="w-72 flex-shrink-0"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2
              className="text-4xl font-normal text-gray-900 mb-8 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Our Four Pillars
            </h2>
            <p className="text-gray-700 leading-relaxed text-[0.95rem]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {pillarsIntro}
            </p>
          </motion.div>

          {/* Right â€” Accordion */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          >
            <PillarAccordion />
          </motion.div>
        </div>
      </section>
    </>
  );
}
