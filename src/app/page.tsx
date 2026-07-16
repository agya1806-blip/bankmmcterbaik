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
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7B61FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
