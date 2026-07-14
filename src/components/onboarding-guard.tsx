"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import OnboardingWizard from "@/components/onboarding-wizard";

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const completed = useOnboardingStore((s) => s.completed);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
        <div className="flex flex-col items-center gap-4">
          <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl shadow-2xl ring-1 ring-white/20">
            M
          </div>
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
            <span className="size-2 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
            <span className="size-2 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  if (!completed) {
    return <OnboardingWizard />;
  }

  return <>{children}</>;
}
