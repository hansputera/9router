"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function AuthHeaderSlot() {
  const { data: session, status } = useSession();
  const [orgs, setOrgs] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => { if (d.teams) setOrgs(d.teams); })
        .catch(() => {});
    }
  }, [session]);

  if (status === "loading") return <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />;
  if (!session) return null;

  return (
    <div className="relative flex items-center gap-2">
      {/* Org switcher */}
      {orgs.length > 0 && (
        <select
          value={session.user?.orgId || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              // Store active org preference
              fetch("/api/auth/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activeOrgId: val }),
              }).then(() => window.location.reload());
            }
          }}
          className="text-xs rounded-lg border border-border bg-surface px-2 py-1 text-text-main focus:outline-none"
        >
          <option value="">Personal</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      )}

      {/* User button */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1 hover:bg-surface-2 transition-colors"
        >
          {session.user?.image ? (
            <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
              {(session.user?.name || "U")[0]}
            </div>
          )}
          <span className="text-xs text-text-muted max-w-[80px] truncate hidden sm:inline">
            {session.user?.name || session.user?.email || ""}
          </span>
          <span className="material-symbols-outlined text-[14px] text-text-muted">expand_more</span>
        </button>

        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-surface shadow-lg py-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">{session.user?.name || "User"}</p>
                <p className="text-xs text-text-muted truncate">{session.user?.email || ""}</p>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                Settings
              </Link>
              <button
                onClick={() => { setUserMenuOpen(false); signOut(); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-surface-2 transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
