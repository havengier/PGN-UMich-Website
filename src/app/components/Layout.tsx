import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Instagram, Linkedin, Facebook, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import pgnLogo from "@/imports/pgn_logo_1__1_.png";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Professional", path: "/professional" },
  { label: "Members", path: "/members" },
  { label: "DEI", path: "/dei" },
  { label: "Recruitment F26", path: "/recruitment" },
  { label: "Apply", path: "/apply" },
  { label: "Admin", path: "/admin", yellow: true },
];

function Nav({ scrolled }: { scrolled: boolean }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-3 transition-all duration-300 ${
          scrolled || open
            ? "bg-white shadow-sm"
            : "bg-white/75 backdrop-blur-sm"
        }`}
      >
        <Link to="/" onClick={() => setOpen(false)}>
          <img src={pgnLogo} alt="PGN — Creating Leaders of Tomorrow" className="h-9 w-auto" />
        </Link>

        {/* Desktop links */}
        <div
          className="hidden lg:flex items-center gap-7 text-sm text-gray-800"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {NAV_LINKS.map(({ label, path, yellow }) => {
            const active = pathname === path || (path !== "/" && pathname.startsWith(path));
            return (
              <Link
                key={label}
                to={path}
                className={`transition-colors whitespace-nowrap ${
                  yellow
                    ? "bg-[#1a0303] text-[#F5A623] font-semibold text-xs px-3 py-1.5 rounded-full hover:bg-[#2d0505] tracking-wide"
                    : `hover:text-[#C03810] ${active ? "underline underline-offset-2 font-medium" : "font-normal"}`
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Hamburger button */}
        <button
          className="lg:hidden p-2 text-gray-800 hover:text-[#7A0C0C] transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-white pt-[60px]"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <nav className="flex flex-col px-8 py-8 gap-0" style={{ fontFamily: "'Inter', sans-serif" }}>
              {NAV_LINKS.map(({ label, path, yellow }, i) => {
                const active = pathname === path || (path !== "/" && pathname.startsWith(path));
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.045 }}
                  >
                    <Link
                      to={path}
                      className={`block py-4 border-b border-gray-100 transition-colors ${
                        yellow
                          ? "text-gray-800 font-normal hover:text-gray-800"
                          : `text-xl hover:text-[#7A0C0C] ${active ? "text-[#7A0C0C] font-semibold" : "text-gray-800 font-normal"}`
                      }`}
                    >
                      {yellow ? (
                        <span className="inline-block bg-[#1a0303] text-[#F5A623] text-sm font-semibold px-3 py-1 rounded-full tracking-wide">
                          {label}
                        </span>
                      ) : label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="mt-auto px-8 pb-10 flex gap-5">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/pgnuofm/" },
                { Icon: Linkedin, href: "https://www.linkedin.com/company/phi-gamma-nu-delta-phi/" },
                { Icon: Facebook, href: "https://www.facebook.com/PGNMichigan/" },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#7A0C0C] transition-colors">
                  <Icon size={22} />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-[#5C0A0A] px-6 md:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <img src={pgnLogo} alt="PGN" className="h-10 w-auto brightness-0 invert" />
        <p className="text-white/60 text-xs mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
          © 2026 Brothers of Phi Gamma Nu — Delta Phi Chapter
        </p>
      </div>

      <div className="flex flex-col items-start sm:items-end gap-2">
        <div className="flex items-center gap-4 mb-1">
          {[
            { Icon: Instagram, href: "https://www.instagram.com/pgnuofm/" },
            { Icon: Linkedin, href: "https://www.linkedin.com/company/phi-gamma-nu-delta-phi/" },
            { Icon: Facebook, href: "https://www.facebook.com/PGNMichigan/" },
          ].map(({ Icon, href }, i) => (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
              <Icon size={20} />
            </a>
          ))}
        </div>
        <p className="text-white/60 text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
          pgnmichigan@gmail.com
        </p>
      </div>
    </footer>
  );
}

export default function Layout() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav scrolled={scrolled} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
