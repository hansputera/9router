"use client";

import { useEffect, useState } from "react";

const hasClerkKey = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function ClerkHeaderSlot() {
  const [OrgSwitcher, setOrgSwitcher] = useState(null);
  const [UserBtn, setUserBtn] = useState(null);

  useEffect(() => {
    if (!hasClerkKey) return;
    import("@clerk/nextjs").then((mod) => {
      setOrgSwitcher(() => mod.OrganizationSwitcher);
      setUserBtn(() => mod.UserButton);
    }).catch(() => {});
  }, []);

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