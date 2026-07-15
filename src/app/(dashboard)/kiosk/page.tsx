"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone, Coffee, Printer, Monitor, Store, Shirt, Tags, Fingerprint,
  ArrowLeft, Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSessionStore, checkKioskOverride } from "@/store/useSessionStore";
import { db } from "@/lib/db-v4";

interface KioskOption {
  slug: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  kasirPath: string;
}

const BRANCHES: KioskOption[] = [
  { slug: "percetakan", label: "Percetakan", icon: Printer, color: "text-violet-400", bg: "bg-violet-500/10", kasirPath: "/buku-usaha/percetakan/kasir" },
  { slug: "laptop", label: "Laptop / PC", icon: Monitor, color: "text-cyan-400", bg: "bg-cyan-500/10", kasirPath: "/buku-usaha/laptop/kasir" },
  { slug: "gadget", label: "Gadget", icon: Smartphone, color: "text-sky-400", bg: "bg-sky-500/10", kasirPath: "/buku-usaha/gadget/kasir" },
  { slug: "warkop", label: "Warkop", icon: Coffee, color: "text-emerald-400", bg: "bg-emerald-500/10", kasirPath: "/buku-usaha/warkop/kasir" },
  { slug: "kelontong", label: "Kelontong", icon: Store, color: "text-amber-400", bg: "bg-amber-500/10", kasirPath: "/buku-usaha/kelontong/kasir" },
  { slug: "konveksi", label: "Konveksi", icon: Tags, color: "text-rose-400", bg: "bg-rose-500/10", kasirPath: "/buku-usaha/konveksi/kasir" },
  { slug: "toko-pakaian", label: "Toko Pakaian", icon: Shirt, color: "text-pink-400", bg: "bg-pink-500/10", kasirPath: "/buku-usaha/toko-pakaian/kasir" },
];

export default function KioskPage() {
  const router = useRouter();
  const { currentUser, enterKioskMode } = useSessionStore();
  const [mounted, setMounted] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSelect = useCallback((slug: string) => {
    setSelectedBranch(slug);
    setPinInput("");
    setPinError(false);
  }, []);

  const handleUnlock = useCallback(async () => {
    if (pinInput.length < 4) { toast.error("PIN minimal 4 digit"); return; }

    // Check admin override first
    if (checkKioskOverride(pinInput)) {
      const branch = BRANCHES.find((b) => b.slug === selectedBranch);
      if (!branch) return;
      enterKioskMode({ unitSlug: selectedBranch!, kasirPath: branch.kasirPath });
      router.push(branch.kasirPath);
      toast.success("Mode Kios aktif (Override PIN Admin)");
      return;
    }

    // Check PIN from DB
    try {
      const users = await db.users.toArray();
      const match = users.find(
        (u) => u.role === "kasir" && u.pinHash === pinInput && u.allowedUnits.includes(selectedBranch!)
      );
      if (match && match.id !== currentUser?.id) {
        setPinError(true);
        toast.error("Staf hanya bisa login dengan PIN sendiri");
        return;
      }
      if (match) {
        const branch = BRANCHES.find((b) => b.slug === selectedBranch);
        if (!branch) return;
        enterKioskMode({ unitSlug: selectedBranch!, kasirPath: branch.kasirPath });
        router.push(branch.kasirPath);
        toast.success("Mode Kios aktif");
      } else {
        setPinError(true);
        toast.error("PIN salah atau staf tidak punya akses ke cabang ini");
      }
    } catch {
      // Dev fallback: direct entry
      const branch = BRANCHES.find((b) => b.slug === selectedBranch);
      if (!branch) return;
      enterKioskMode({ unitSlug: selectedBranch!, kasirPath: branch.kasirPath });
      router.push(branch.kasirPath);
      toast.success("Mode Kios aktif (dev mode)");
    }
  }, [pinInput, selectedBranch, router, enterKioskMode, currentUser]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto pt-8 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/")}
          className="size-9 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </button>
        <div className="size-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
          <Lock className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold">Mode Kios Kasir</h1>
          <p className="text-[10px] text-muted-foreground">Kunci layar ke POS Kasir tertentu</p>
        </div>
      </div>

      {!selectedBranch ? (
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Pilih Cabang</p>
          <div className="grid grid-cols-2 gap-3">
            {BRANCHES.map((b) => {
              const Icon = b.icon;
              return (
                <button key={b.slug} onClick={() => handleSelect(b.slug)}
                  className={`flex items-center gap-3 p-4 rounded-2xl ${b.bg} border border-slate-200/60 dark:border-slate-800/60 active:scale-[0.97] transition-all text-left`}
                >
                  <div className={`size-10 rounded-xl ${b.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`size-5 ${b.color}`} />
                  </div>
                  <span className={`text-sm font-medium ${b.color}`}>{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="premium-card p-4 text-center space-y-3">
            <p className="text-xs text-muted-foreground">Masukkan PIN untuk membuka kunci</p>
            <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto">
              <Fingerprint className="size-8 text-rose-400" />
            </div>
            <p className="text-sm font-bold">{BRANCHES.find((b) => b.slug === selectedBranch)?.label}</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "")); setPinError(false); }}
              placeholder="PIN Kasir / Admin (6 digit)"
              className={`input-premium w-full text-center text-sm tabular-nums ${pinError ? "border-rose-500" : ""}`}
              autoFocus
            />
            {pinError && (
              <p className="text-[10px] text-rose-400">PIN salah. Coba lagi.</p>
            )}
            <button onClick={handleUnlock} disabled={pinInput.length < 4}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold shadow-lg disabled:opacity-50"
            >
              <Lock className="size-4 inline mr-1" /> Buka Kunci Mode Kios
            </button>
            <button onClick={() => setSelectedBranch(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Pilih cabang lain
            </button>
          </div>
          <div className="premium-card p-4 space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground">Tentang Mode Kios</p>
            <ul className="text-[9px] text-muted-foreground space-y-1 list-disc list-inside">
              <li>Navigasi bawah disembunyikan</li>
              <li>Akses terbatas ke POS Kasir cabang ini saja</li>
              <li>Mode hanya bisa dilepas dengan PIN Admin 6-digit</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
