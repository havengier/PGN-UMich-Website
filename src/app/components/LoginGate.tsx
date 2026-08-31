import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "motion/react";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import pgnLogo from "@/imports/pgn_logo_1__1_.png";

function LoginScreen() {
  const { setUser } = useAuth();
  const [error, setError] = useState("");

  async function handleCredential(credential: string) {
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credential }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed."); return; }
      setUser(data.user);
    } catch {
      setError("Network error. Please try again.");
    }
  }

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
          <GoogleLogin
            onSuccess={({ credential }) => {
              if (credential) handleCredential(credential);
            }}
            onError={() => setError("Google login failed. Please try again.")}
            theme="filled_black"
            shape="pill"
            size="large"
            text="signin_with"
          />
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
