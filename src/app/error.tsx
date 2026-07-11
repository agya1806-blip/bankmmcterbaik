"use client";

import { useTranslation } from "@/lib/i18n";
import { RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="size-16 rounded-3xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-red-500/20">
        !
      </div>
      <div className="text-center max-w-md">
        <h1 className="text-lg font-semibold font-heading mb-1">{t("error.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {error.message || t("error.somethingWrong")}
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white px-5 py-2.5 text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 transition-all active:scale-95"
      >
        <RefreshCw className="size-4" />
        {t("error.tryAgain")}
      </button>
    </div>
  );
}
