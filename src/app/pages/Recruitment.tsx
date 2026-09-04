import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, MapPin, Clock, Sparkles } from "lucide-react";
import pgnLogo from "@/imports/pgn_logo_1__1_.png";
import { useContent } from "@/app/hooks/useContent";

export type RecruitmentEvent = {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  imageUrl?: string;
};

const DEFAULT_EVENTS: RecruitmentEvent[] = [
  {
    id: "1",
    title: "Mass Meeting 1",
    date: "2026-09-08T18:00",
    description: "Introduction to Phi Gamma Nu, our four pillars, culture, and what sets our brotherhood apart. Open to all majors and years.",
    location: "Ross School of Business, R0220",
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    title: "Mass Meeting 2",
    date: "2026-09-10T19:00",
    description: "Learn more about the recruitment process, speed networking with brothers, and an interactive Q&A session.",
    location: "Michigan Union, Rogel Ballroom",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    title: "Meet the Chapter",
    date: "2026-09-12T17:30",
    description: "Casual mixer to connect with brothers one-on-one and discover how PGN has shaped their college career.",
    location: "Ross Winter Garden",
    imageUrl: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "4",
    title: "DEI & Professional Workshop",
    date: "2026-09-15T18:30",
    description: "Interactive resume and case workshop demonstrating our commitment to professional growth and inclusion.",
    location: "Ross School of Business, R1240",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  },
];

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function EventCountdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  useEffect(() => {
    function update() {
      const target = new Date(targetDate).getTime();
      if (isNaN(target)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isPast) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-semibold tracking-wider uppercase border border-white/10">
        <Sparkles size={12} className="text-[#F5A623]" />
        <span>Event Concluded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#F5A623] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#F5A623]/30 shadow-inner">
      <Clock size={13} className="text-[#F5A623] animate-pulse" />
      <span>
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </div>
  );
}

function EventCard({ event, index }: { event: RecruitmentEvent; index: number }) {
  const formattedDate = formatEventDate(event.date);

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#160202] shadow-xl hover:shadow-2xl hover:border-[#F5A623]/40 transition-all duration-300 flex flex-col group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
    >
      {/* Faded Background Image Layer */}
      {event.imageUrl ? (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={event.imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140202] via-[#1a0303]/85 to-[#1a0303]/75" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-[#1a0303]/90 to-[#140202]" />
      )}

      {/* Decorative Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F5A623]/40 to-transparent group-hover:via-[#F5A623] transition-all duration-300" />

      {/* Card Content */}
      <div className="relative z-10 p-6 md:p-8 flex flex-col h-full">
        {/* Top Header: Date badge + Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 text-white/90 text-xs font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
            <Calendar size={13} className="text-[#F5A623]" />
            <span>{formattedDate}</span>
          </div>

          <EventCountdown targetDate={event.date} />
        </div>

        {/* Title */}
        <h3
          className="text-2xl md:text-3xl font-normal text-white mb-3 leading-snug group-hover:text-[#F5A623] transition-colors duration-200"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {event.title}
        </h3>

        {/* Description */}
        <p
          className="text-white/70 text-sm md:text-base leading-relaxed mb-6 flex-1"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {event.description}
        </p>

        {/* Location Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs md:text-sm text-[#F5A623] font-medium">
          <MapPin size={15} className="flex-shrink-0 text-[#F5A623]" />
          <span className="truncate">{event.location || "TBA"}</span>
        </div>
      </div>
    </motion.div>
  );
}

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

  const eventsSubtitle = get("recruitment.events.subtitle", "Recruitment Schedule");
  const eventsHeading = get("recruitment.events.heading", "Upcoming Events");

  // Parse events from site_content or fallback to DEFAULT_EVENTS
  let eventsList: RecruitmentEvent[] = DEFAULT_EVENTS;
  const rawEvents = get("recruitment.events", "");
  if (rawEvents) {
    try {
      const parsed = JSON.parse(rawEvents);
      if (Array.isArray(parsed) && parsed.length > 0) {
        eventsList = parsed;
      }
    } catch {
      eventsList = DEFAULT_EVENTS;
    }
  }

  // Sort events chronologically by date
  const sortedEvents = [...eventsList].sort((a, b) => {
    const timeA = new Date(a.date).getTime() || 0;
    const timeB = new Date(b.date).getTime() || 0;
    return timeA - timeB;
  });

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

      {/* ── Upcoming Events Section ─────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-6 md:px-16 border-t border-white/10 bg-gradient-to-b from-[#140202] to-[#100101]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.p
              className="text-[#F5A623] text-xs font-bold tracking-[0.25em] uppercase mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              {eventsSubtitle}
            </motion.p>
            <motion.h2
              className="text-3xl md:text-5xl font-normal text-white mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {eventsHeading}
            </motion.h2>
            <motion.p
              className="text-white/60 text-sm md:text-base leading-relaxed"
              style={{ fontFamily: "'Inter', sans-serif" }}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              Join us at our upcoming recruitment events to connect with brothers, discover our four pillars, and learn about the application process.
            </motion.p>
          </div>

          {/* Chronologically Sorted Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sortedEvents.map((event, index) => (
              <EventCard key={event.id || index} event={event} index={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}




