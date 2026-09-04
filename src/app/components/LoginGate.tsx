import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import pgnLogo from "@/imports/pgn_logo_1__1_.png";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/>
    </svg>
  );
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed: "Only @umich.edu accounts are allowed.",
  access_denied: "Access was denied. Please try again.",
  auth_failed: "Sign-in failed. Please try again.",
};

function LoginScreen({
  title = "Sign in to continue",
  subtitle = "Only @umich.edu Google accounts are accepted.",
  badge,
}: {
  title?: string;
  subtitle?: string;
  badge?: string;
}) {
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("auth_error");
    if (code) setError(AUTH_ERROR_MESSAGES[code] ?? "Sign-in failed. Please try again.");
  }, []);

  function handleSignIn() {
    const redirectTo = window.location.pathname;
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 bg-[#0e0202]">
      <motion.div
        className="w-full max-w-md text-center py-12"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={pgnLogo}
          alt="Phi Gamma Nu"
          className="h-11 w-auto mx-auto mb-8 brightness-0 invert"
        />

        {badge && (
          <p
            className="text-[#F5A623] text-xs font-bold tracking-[0.25em] uppercase mb-3"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {badge}
          </p>
        )}

        <h2
          className="text-white text-3xl font-normal mb-3 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h2>
        <p
          className="text-white/65 text-sm mb-8 max-w-sm mx-auto leading-relaxed"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {subtitle.includes("@umich.edu") ? (
            <>
              {subtitle.split("@umich.edu")[0]}
              <span className="text-[#F5A623] font-semibold">@umich.edu</span>
              {subtitle.split("@umich.edu")[1]}
            </>
          ) : (
            subtitle
          )}
        </p>

        <div className="flex justify-center">
          <button
            onClick={handleSignIn}
            className="flex items-center gap-3 bg-white hover:bg-stone-100 text-gray-800 text-sm font-medium px-7 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
          </button>
        </div>

        {error && (
          <motion.div
            className="mt-6 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-medium max-w-sm mx-auto"
            style={{ fontFamily: "'Inter', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 text-center">
      <ShieldX size={52} className="text-[#7A0C0C] mb-5" strokeWidth={1.5} />
      <h2
        className="text-3xl font-normal text-gray-900 mb-3"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Access Denied
      </h2>
      <p
        className="text-gray-500 text-sm max-w-xs leading-relaxed"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Your account does not have permission to view this page.
      </p>
    </div>
  );
}

export function LoginGate({
  children,
  requireAdmin = false,
  title,
  subtitle,
  badge,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  title?: string;
  subtitle?: string;
  badge?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen title={title} subtitle={subtitle} badge={badge} />;
  }
  if (requireAdmin && !user.isAdmin) return <AccessDenied />;
  return <>{children}</>;
}

