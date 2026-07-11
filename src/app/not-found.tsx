"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Home } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="size-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-emerald-500/20 animate-float">
        404
      </div>
      <div className="text-center">
        <h1 className="text-lg font-semibold font-heading mb-1">{t("notFound.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("notFound.message")}</p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white px-5 py-2.5 text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 transition-all active:scale-95"
      >
        <Home className="size-4" />
        {t("notFound.back")}
      </Link>
    </div>
  );
}
