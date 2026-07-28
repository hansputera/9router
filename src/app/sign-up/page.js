"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const hasClerk = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function SignUpPage() {
  const router = useRouter();
  const [SignUp, setSignUp] = useState(null);

  useEffect(() => {
    if (!hasClerk) {
      router.replace("/login");
      return;
    }
    import("@clerk/nextjs")
      .then((mod) => setSignUp(() => mod.SignUp))
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!hasClerk || !SignUp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SignUp routing="hash" />
    </div>
  );
}