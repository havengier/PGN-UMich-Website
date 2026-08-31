import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";

const PILLARS = [
  {
    title: "Professionalism",
    content:
      "Many students are drawn to PGN for our emphasis on business and professionalism. We help students realize their full potential through ongoing career exploration and self-reflection, a mentorship program for professional development and guidance, academic support, and opportunities such as company visits, networking, workshops, and other learning experiences. Many brothers serve in leadership positions in other organizations on campus, and all of our brothers move onto impressive and fulfilling pursuits following graduation.",
  },
  {
    title: "Philanthropy",
    content:
      "PGN seeks to cultivate a spirit of compassion in the professional and personal lives of brothers. Our chapter participates in a variety of philanthropic events and activities throughout the year, giving back to the local Ann Arbor community and beyond. Brothers are encouraged to lead service initiatives and make a tangible difference in the lives of others.",
  },
  {
    title: "DEI",
    content:
      "Through our DEI efforts, PGN seeks to create a diverse and welcoming community. We believe that diversity of background, thought, and experience strengthens our brotherhood and better prepares us to lead in an increasingly interconnected and global world. Our chapter actively works to foster an inclusive environment where every member can thrive.",
  },
  {
    title: "Brotherhood",
    content:
      "PGN seeks to nurture a sense of community among our members. Brotherhood is at the heart of everything we do — from social events and retreats to mentorship and mutual support throughout our time at Michigan. The bonds formed here last well beyond graduation.",
  },
];

function PillarAccordion() {
  const [open, setOpen] = useState<string>("Professionalism");

  return (
    <div className="w-full">
      {PILLARS.map(({ title, content }) => {
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
  return (
    <>
      {/* Hero Banner */}
      <div className="relative w-full h-[52vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800" />
        {/* Simulated photo texture */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(ellipse at 30% 50%, #78350f 0%, transparent 60%), radial-gradient(ellipse at 70% 40%, #44403c 0%, transparent 50%)",
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
            About Us
          </motion.h1>
        </div>
      </div>

      {/* What's PGN */}
      <section className="py-20 px-16" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-6xl mx-auto flex gap-16 items-start">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-gray-500 mb-6">
              About Us
            </p>
            <h2
              className="text-4xl font-normal text-gray-900 mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              What's PGN?
            </h2>
            <p className="text-gray-700 leading-relaxed text-[0.95rem]">
              PGN is a professional development organization that was founded in 1924.
              Since then, the organization has grown immensely, expanding to 20+ active
              chapters and drawing driven individuals from all majors and backgrounds to
              grow their professional and personal skills to better succeed in today's
              workplace and serve as tomorrow's leaders. Members dedicate themselves to
              PGN's three pillars: professionalism, philanthropy, and brotherhood. At
              the University of Michigan, PGN is an excellent way to meet other strongly
              motivated business-inclined students on campus. Members specialize in a
              variety of fields by combining their business interests with their areas of
              expertise such as finance, marketing, entrepreneurship, music performance,
              engineering, law and more.
            </p>
          </motion.div>

          <motion.div
            className="w-[420px] flex-shrink-0 rounded-xl overflow-hidden shadow-lg aspect-[4/5] bg-gradient-to-br from-stone-300 via-stone-400 to-stone-500 flex items-end justify-center pb-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          >
            <span className="text-stone-600/60 text-xs tracking-widest uppercase">Chapter Photo</span>
          </motion.div>
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
              Phi Gamma Nu proudly upholds four National Pillars which represent
              the underlying ideals of the organization: Professionalism,
              Philanthropy, DEI, and Brotherhood. Through Professionalism, PGN
              seeks to develop responsible, capable, well-rounded, and qualified
              professionals. Through Philanthropy, PGN seeks to cultivate a
              spirit of compassion in the professional and personal lives of
              brothers. Through our DEI efforts, PGN seeks to create a diverse
              and welcoming community. Through Brotherhood, PGN seeks to nurture
              a sense of community among our members. These pillars are central
              to the events and activities organized by our chapter.
            </p>
          </motion.div>

          {/* Right — Accordion */}
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
