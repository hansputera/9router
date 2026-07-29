"use client";

import { useEffect, useState } from "react";

/**
 * Clerk UI slot for the header. Renders OrganizationSwitcher + UserButton.
 * Takes an `enabled` prop from the parent (passed down from server component)
 * to avoid needing frozen NEXT_PUBLIC_ env var at build time.
 */
export default function ClerkHeaderSlot({ enabled = false }) {
  const [OrgSwitcher, setOrgSwitcher] = useState(null);
  const [UserBtn, setUserBtn] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    import("@clerk/nextjs").then((mod) => {
      setOrgSwitcher(() => mod.OrganizationSwitcher);
      setUserBtn(() => mod.UserButton);
    }).catch(() => {});
  }, [enabled]);

  if (!OrgSwitcher || !UserBtn) return null;

  return (
    <>
      <OrgSwitcher
        hidePersonal={false}
        appearance={{
          elements: {
            organizationSwitcherTrigger:
              "text-text-main hover:text-primary transition-colors py-1.5 px-3 rounded-lg border border-border bg-surface",
          },
        }}
      />
      <UserBtn
        afterSignOutUrl="/"
        appearance={{
          elements: {
            userButtonAvatarBox: "w-8 h-8 rounded-full border border-border",
          },
        }}
      />
    </>
  );
}