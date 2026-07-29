"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/shared/components";

const hasClerk = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function LoginPage() {
  const router = useRouter();

  // If Clerk is configured, redirect to Clerk sign-in
  useEffect(() => {
    if (hasClerk) {
      router.replace("/sign-in");
    }
  }, [router]);

  if (hasClerk) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-text-muted mt-4 ml-3">Redirecting to sign-in...</p>
      </div>
    );
  }

  return <PasswordLogin />;
}

function PasswordLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetHint, setResetHint] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState("password");
  const [oidcConfigured, setOidcConfigured] = useState(false);
  const [oidcLoginLabel, setOidcLoginLabel] = useState("Sign in with OIDC");

  useEffect(() => {
    if (retryAfter <= 0) return;
    const id = setInterval(() => setRetryAfter((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  useEffect(() => {
    async function checkAuth() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      try {
        const res = await fetch(`${baseUrl}/api/auth/status`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.requireLogin === false) { window.location.assign("/dashboard"); return; }
          setAuthMode(data.authMode || "password");
          setOidcConfigured(data.oidcConfigured === true);
          setOidcLoginLabel(data.oidcLoginLabel || "Sign in with OIDC");
        }
      } catch { /* use defaults */ }
    }
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetHint("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mustChangePassword) { /* redirect handled server-side */ }
        window.location.assign("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid password");
        if (data.resetHint) setResetHint(data.resetHint);
        if (data.retryAfter) setRetryAfter(Number(data.retryAfter));
      }
    } catch { setError("An error occurred. Please try again."); }
    finally { setLoading(false); }
  };

  const handleOidcLogin = () => { window.location.href = "/api/auth/oidc/start"; };

  const oidcAvailable = oidcConfigured && ["oidc", "both"].includes(authMode);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="landing-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">9Router</h1>
          <p className="text-text-muted">Enter your password to access the dashboard</p>
        </div>
        <Card>
          <div className="flex flex-col gap-4">
            {oidcAvailable && (
              <Button type="button" variant="primary" className="w-full" onClick={handleOidcLogin}>
                {oidcLoginLabel}
              </Button>
            )}
            {oidcAvailable && <div className="h-px bg-border/60" />}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" placeholder="Enter password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoFocus />
                {error && <p className="text-xs text-red-500">{error}</p>}
                {retryAfter > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Locked. Retry in <span className="font-mono">{retryAfter}s</span>.
                  </p>
                )}
              </div>
              <Button type="submit" variant="primary" className="w-full" loading={loading} disabled={retryAfter > 0}>
                {retryAfter > 0 ? `Wait ${retryAfter}s` : "Login"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
