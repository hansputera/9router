"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [SignIn, setSignIn] = useState(null);
  const [hasClerk, setHasClerk] = useState(null);

  useEffect(() => {
    const hasKey = !!(window.__CLERK_ENABLED__ || window.__PUBLISHABLE_KEY__);
    setHasClerk(hasKey);
    if (!hasKey) {
      router.replace("/login");
      return;
    }
    import("@clerk/nextjs")
      .then((mod) => setSignIn(() => mod.SignIn))
      .catch(() => router.replace("/login"));
  }, [router]);

  if (hasClerk === null || (!hasClerk && !SignIn) || (hasClerk && !SignIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignIn routing="hash" />
    </div>
  );
}