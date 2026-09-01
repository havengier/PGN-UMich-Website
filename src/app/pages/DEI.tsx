import { motion } from "motion/react";
import { useContent } from "@/app/hooks/useContent";

export default function DEI() {
  const { get } = useContent("dei");

  const intro1 = get(
    "dei.intro_1",
    "In Phi Gamma Nu, as one of our four pillars, diversity, equity, and inclusion (DEI) is crucial because it enriches our community, fosters innovation, and promotes equality. When people from different backgrounds, cultures, and perspectives come together, it creates a tapestry of experiences and ideas that drive social progress. DEI enhances our community by celebrating the uniqueness of individuals. It recognizes that each person has a distinct set of qualities shaped by their race, ethnicity, gender, sexual orientation, religion, abilities, and more.",
  );
  const intro2 = get(
    "dei.intro_2",
    "DEI ensures that everyone has a voice, their perspectives are heard, and their contributions are valued, regardless of their background, which is why PGN hosts biweekly DEI roundtables in which our own members share information and facilitate discussions about important DEI topics. PGN also hosts celebrations of different cultural holidays throughout the school year that are for members to learn about different cultures, their histories, values, and unique practices.",
  );

  const photos = [
    { label: get("dei.photo_0.label", "Lunar New Year Celebration"), imageUrl: get("dei.photo_0.image_url", ""), from: "from-amber-900", via: "via-stone-700", to: "to-stone-600" },
    { label: get("dei.photo_1.label", "Holi Celebration"), imageUrl: get("dei.photo_1.image_url", ""), from: "from-rose-700", via: "via-purple-600", to: "to-sky-500" },
  ];

  return (
    <>
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="relative w-full h-[52vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 60%, #78350f 0%, transparent 50%), radial-gradient(ellipse at 65% 30%, #292524 0%, transparent 55%)",
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex items-end px-16 pb-12 pt-20">
          <motion.h1
            className="text-white font-normal leading-tight max-w-2xl"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.8rem, 6.5vw, 5rem)" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            DEI & Outreach
            <br />
            Initiatives
          </motion.h1>
        </div>
      </div>

      {/* ── What's DEI to PGN ────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 px-6 md:px-16" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-gray-500 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
          >
            DEI Efforts
          </motion.p>

          <motion.h2
            className="text-[2.2rem] font-normal text-gray-900 mb-10 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            What's DEI to PGN?
          </motion.h2>

          <motion.div
            className="space-y-6 text-gray-700 leading-relaxed text-[0.95rem]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p>{intro1}</p>
            <p>{intro2}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Photo Grid ───────────────────────────────────────────────────── */}
      <section className="px-6 md:px-16 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {photos.map(({ label, imageUrl, from, via, to }, i) => (
            <motion.div
              key={label}
              className="relative rounded-xl overflow-hidden aspect-[4/3]"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.12 }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${from} ${via} ${to}`} />
                  <div className="absolute inset-0 bg-black/10" />
                </>
              )}
              <div className="absolute bottom-5 left-5 bg-white px-4 py-2 rounded-sm shadow-sm">
                <p className="text-gray-900 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
