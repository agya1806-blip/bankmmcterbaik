"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/useSessionStore";

export default function RootPage() {
  const router = useRouter();
  const { currentUser } = useSessionStore();

  useEffect(() => {
    if (currentUser) {
      router.replace("/buku-usaha");
    } else {
      router.replace("/login");
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen bg-[#F5F9FC] dark:bg-[#0A1628] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#008CEB] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
