"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, initializing } = useAuth();

  useEffect(() => {
    if (initializing) return;
    router.replace(isAuthenticated ? "/tasks" : "/login");
  }, [initializing, isAuthenticated, router]);

  return <div className="flex flex-1 items-center justify-center text-slate-400">Loading…</div>;
}
