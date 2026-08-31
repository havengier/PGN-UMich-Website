import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
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

function LoginScreen() {
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const login = useGoogleLogin({
    scope: "email profile",
    onSuccess: async ({ access_token }) => {
      setPending(true);
      setError("");
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: access_token }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Login failed."); return; }
        setUser(data.user);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setPending(false);
      }
    },
    onError: (err) => {
      console.error("OAuth error:", err);
      setError("Google login failed. Please try again.");
    },
    onNonOAuthError: (err) => {
      console.error("Non-OAuth error:", err);
      if (err.type === "popup_failed_to_open" || err.type === "popup_closed") {
        setError("Popup was blocked. Click the address bar icon to allow popups for this site, then try again.");
      } else {
        setError(`Login error: ${err.type ?? "unknown"}. Check the browser console.`);
      }
    },
  });

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 bg-[#0e0202]">
      <motion.div
        className="w-full max-w-sm text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={pgnLogo}
          alt="Phi Gamma Nu"
          className="h-10 w-auto mx-auto mb-10 brightness-0 invert"
        />

        <h2
          className="text-white text-2xl font-normal mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Sign in to continue
        </h2>
        <p
          className="text-white/50 text-sm mb-8 leading-relaxed"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Only <span className="text-[#F5A623]">@umich.edu</span> Google accounts are accepted.
        </p>

        <div className="flex justify-center">
          <button
            onClick={() => login()}
            disabled={pending}
            className="flex items-center gap-3 bg-white text-gray-700 text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <GoogleIcon />
            {pending ? "Signing in…" : "Sign in with Google"}
          </button>
        </div>

        {error && (
          <motion.p
            className="mt-5 text-sm text-red-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
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
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#7A0C0C] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  if (requireAdmin && !user.isAdmin) return <AccessDenied />;
  return <>{children}</>;
}
