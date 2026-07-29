"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@/shared/components";

const hasClerk = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function TeamPage() {
  const [OrgProfile, setOrgProfile] = useState(null);
  const [CreateOrg, setCreateOrg] = useState(null);
  const [hasOrg, setHasOrg] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasClerk) {
      setLoading(false);
      return;
    }
    import("@clerk/nextjs").then((mod) => {
      setOrgProfile(() => mod.OrganizationProfile);
      setCreateOrg(() => mod.CreateOrganization);
    });
    import("@clerk/nextjs").then((mod) => {
      const { useOrganizationList } = mod;
      // Can't use hooks outside of component, so we load the page content conditionally
    });
  }, []);

  if (!hasClerk) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <Card>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="size-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">group</span>
            </div>
            <h2 className="text-xl font-semibold">Team Management</h2>
            <p className="text-text-muted max-w-md">
              Team features require Clerk authentication. Set <code className="bg-sidebar px-1 rounded">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code className="bg-sidebar px-1 rounded">CLERK_SECRET_KEY</code> in your <code className="bg-sidebar px-1 rounded">.env</code> to enable.
            </p>
            <p className="text-sm text-text-muted">
              Sign up at <a href="https://dashboard.clerk.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">dashboard.clerk.com</a> — free tier available.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <TeamContent OrgProfile={OrgProfile} CreateOrg={CreateOrg} />;
}

function TeamContent({ OrgProfile, CreateOrg }) {
  const [showCreate, setShowCreate] = useState(false);
  const [orgList, setOrgList] = useState([]);

  useEffect(() => {
    if (!OrgProfile) return;
    import("@clerk/nextjs").then((mod) => {
      try {
        const list = mod.useOrganizationList();
        // We can't call hooks conditionally, so we use a different approach
      } catch {}
    });
  }, [OrgProfile]);

  if (!OrgProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0 flex justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-text-muted text-sm mt-1">Manage your organization members and settings</p>
        </div>
        {CreateOrg && (
          <Button variant="primary" icon="add" onClick={() => setShowCreate(true)}>
            Create Team
          </Button>
        )}
      </div>

      <Card padding="none">
        <OrgProfile
          appearance={{
            elements: {
              rootBox: "w-full border-0 shadow-none",
              card: "border-0 shadow-none",
              navbar: "hidden",
              pageScrollBox: "p-0",
            },
          }}
        />
      </Card>

      {showCreate && CreateOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-surface rounded-xl p-6 w-full max-w-md">
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-3 right-3 text-text-muted hover:text-text-main"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <CreateOrg />
          </div>
        </div>
      )}
    </div>
  );
}
