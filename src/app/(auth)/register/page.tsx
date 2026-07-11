"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading, error, register, clearError } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");
    if (password !== confirmPassword) {
      setLocalError(t("auth.passwordsNotMatch"));
      return;
    }
    if (password.length < 6) {
      setLocalError(t("auth.passwordTooShort"));
      return;
    }
    await register(email, password, name);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 size-96 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-bold text-xl shadow-xl shadow-emerald-500/20 mb-4">
            {t("brand.short")}
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">{t("brand.name")}</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">{t("brand.tagline")}</p>
        </div>

        {/* Form */}
        <div className="floating-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold font-heading mb-1">{t("auth.createAccount")}</h2>
          <p className="text-sm text-muted-foreground/70 mb-6">{t("auth.createAccountDesc")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || localError) && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30 px-4 py-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error || localError}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">{t("auth.fullName")}</label>
              <Input
                placeholder={t("auth.fullNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">{t("auth.email")}</label>
              <Input
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) clearError(); }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">{t("auth.password")}</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.minChars")}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">{t("auth.confirmPassword")}</label>
              <Input
                type="password"
                placeholder={t("auth.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{t("auth.passwordsNotMatch")}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading || !name || !email || !password || password !== confirmPassword} className="w-full h-11">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {t("auth.creating")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t("auth.registerBtn")} <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground/60">
              {t("auth.haveAccount")}{" "}
              <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                {t("auth.signInLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
