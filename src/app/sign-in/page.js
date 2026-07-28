"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const hasClerk = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignInPage() {
  const router = useRouter();
  const [SignIn, setSignIn] = useState(null);

  useEffect(() => {
    if (!hasClerk) {
      router.replace("/login");
      return;
    }
    import("@clerk/nextjs")
      .then((mod) => setSignIn(() => mod.SignIn))
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!hasClerk || !SignIn) {
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