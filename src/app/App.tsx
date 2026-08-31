import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then(({ clientId }) => setClientId(clientId ?? ""))
      .catch(() => {});
  }, []);

  // Wait for client ID before initialising the Google provider
  if (!clientId) return null;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
