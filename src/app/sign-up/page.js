"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SignUpPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
