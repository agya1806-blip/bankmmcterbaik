"use client";

import { useTranslation } from "@/lib/i18n";

export default function Loading() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1">
          <span className="size-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
          <span className="size-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
          <span className="size-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">{t("loading")}</p>
      </div>
    </div>
  );
}
