import { motion } from "motion/react";
import { Plane, GraduationCap, Briefcase } from "lucide-react";
import defaultInternshipSummary from "@/imports/image-8.png";
import { useContent } from "@/app/hooks/useContent";

const FEATURE_ICONS = [
  <Plane size={54} strokeWidth={1.5} className="text-gray-900" key="0" />,
  <div key="1" className="w-20 h-20 rounded-full bg-black flex items-center justify-center">
    <Briefcase size={36} strokeWidth={1.5} className="text-white" />
  </div>,
  <GraduationCap size={54} strokeWidth={1.5} className="text-gray-900" key="2" />,
];

const FEATURE_DEFAULTS = [
  "Every year, PGN organizes exclusive trips to major business hubs like Chicago and New York. These trips offer our members unparalleled opportunities to network with professionals across a wide array of industries. During these visits, we tour prestigious companies, gain insights into various business operations, and connect with alumni and industry leaders who share their experiences and offer guidance. These trips are pivotal in expanding our members' professional networks and preparing them for future careers.",
  "At PGN, we are committed to the continuous professional growth of our members. Our weekly professional development sessions are designed to equip our members with the essential skills needed in today's business world. From mastering LinkedIn to perfecting excel skills, these sessions cover a broad spectrum of business-related topics. Members engage in hands-on projects, learn best practices, and receive mentorship from seasoned brothers, ensuring they are always one step ahead in their career journey.",
  "Our alumni network is one of PGN's greatest assets, with members successfully placed in a variety of fields and locations across the globe. Whether it's finance, consulting, tech, or entrepreneurship, our alumni have made their mark in nearly every industry. This extensive network not only serves as a valuable resource for current members seeking advice and mentorship but also demonstrates the long-lasting impact of PGN's commitment to professional excellence.",
];

const TESTIMONIAL_DEFAULTS = [
  { quote: "\u201cI always appreciate getting the opportunity to give back to the organization that gave me my family on campus. It\u2019s also great to stay connected with PGN brothers as we all find ourselves in new cities.\u201d", name: "Kelvin Chang", classYear: "Lambda Class", photoCls: "from-blue-900 via-blue-800 to-slate-700" },
  { quote: "\u201cI am consistently impressed by the ambition and professionalism of younger members and I love being part of the organization that empowers them to take the first few steps in their career.\u201d", name: "Priyanka Tomar", classYear: "Xi Class", photoCls: "from-amber-700 via-amber-600 to-amber-500" },
  { quote: "\u201cLeveraging connections from PGN to explore career paths and opportunities is what led me to where I am today. I express my gratitude for those who helped me by paying it forward to new members.\u201d", name: "Josh Fontaine", classYear: "Xi Class", photoCls: "from-stone-400 via-stone-500 to-stone-600" },
];

export default function Professional() {
  const { get } = useContent("professional");

  const hideInternshipImage = get("professional.internship.hide_image", "false") === "true";
  const internshipImageUrl = get("professional.internship_image_url", "");
  const features = [0, 1, 2].map((i) => get(`professional.feature_${i}.body`, FEATURE_DEFAULTS[i]));
  const testimonials = [0, 1, 2].map((i) => ({
    quote: get(`professional.testimonial_${i}.quote`, TESTIMONIAL_DEFAULTS[i].quote),
    name: get(`professional.testimonial_${i}.name`, TESTIMONIAL_DEFAULTS[i].name),
    classYear: get(`professional.testimonial_${i}.classYear`, TESTIMONIAL_DEFAULTS[i].classYear),
    photoUrl: get(`professional.testimonial_${i}.photo_url`, ""),
    hidePhoto: get(`professional.testimonial_${i}.hide_photo`, "false") === "true",
    photoCls: TESTIMONIAL_DEFAULTS[i].photoCls,
  }));

  return (
    <>
      {/* ── Section 1: Internship Summary ──────────────────────────── */}
      {!hideInternshipImage && (
        <section className="bg-black pt-20 pb-12 flex items-center justify-center">
          <motion.img
            src={internshipImageUrl || defaultInternshipSummary}
            alt="Internship Summary — company logos"
            className="w-full max-w-[121rem] object-contain"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </section>
      )}

      {/* ── Section 2: Three Features ────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24 px-6 md:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {features.map((body, i) => (
            <div key={i} style={{ fontFamily: "'Inter', sans-serif" }}>
              <motion.div
                className="h-20 flex items-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.15 }}
              >
                {FEATURE_ICONS[i]}
              </motion.div>
              <motion.p
                className="text-gray-800 leading-relaxed text-[0.92rem]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.15 + 0.15 }}
              >
                {body}
              </motion.p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Testimonials ────────────────────────────────────────── */}
      <section className="bg-white py-16 px-6 md:px-16 pb-20 md:pb-28">
        <div className="max-w-2xl mx-auto flex flex-col gap-12 md:gap-16">
          {testimonials.map((t, i) => (
            <div key={t.name} className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
              {!t.hidePhoto && (
                <motion.div
                  className={`w-28 h-28 rounded-full bg-gradient-to-br ${t.photoCls} flex-shrink-0 overflow-hidden flex items-end justify-center pb-2`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.05 }}
                >
                  {t.photoUrl ? (
                    <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/30 text-[0.6rem] tracking-widest uppercase">photo</span>
                  )}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: t.hidePhoto ? 0 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 + 0.15 }}
              >
                <blockquote
                  className="text-[1.3rem] md:text-[1.65rem] font-normal text-gray-900 leading-snug mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {t.quote}
                </blockquote>
                <p className="text-sm text-gray-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t.name} &middot; <strong>{t.classYear}</strong>
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
