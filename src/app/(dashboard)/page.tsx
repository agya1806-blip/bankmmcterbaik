"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useFinancialStore } from "@/engines/financial/financial-store";
import { useBusinessStore } from "@/store/useBusinessStore";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet, TrendingUp, TrendingDown, Plus, BookUser, Briefcase,
  HeartHandshake, BookOpen, ArrowRight, CheckCircle2, AlertCircle,
  LayoutDashboard, Store,
} from "lucide-react";
import toast from "react-hot-toast";

interface BookCard {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
  route: string;
  statusKey: "pribadi" | "usaha" | "sedekah" | "catatan";
}

const BOOKS: BookCard[] = [
  {
    id: "buku-pribadi",
    label: "Buku Pribadi",
    desc: "Personal Wealth & Savings Goal",
    icon: BookUser,
    gradient: "from-emerald-500 to-emerald-600",
    glow: "shadow-emerald-500/25",
    route: "/transactions",
    statusKey: "pribadi",
  },
  {
    id: "buku-usaha",
    label: "Buku Usaha",
    desc: "5 Lini Bisnis: Percetakan, Gadget, Laptop, Kopi, Konveksi",
    icon: Briefcase,
    gradient: "from-violet-500 to-violet-600",
    glow: "shadow-violet-500/25",
    route: "/buku-usaha",
    statusKey: "usaha",
  },
  {
    id: "buku-sedekah",
    label: "Buku Sedekah",
    desc: "Social & Religious Fund Tracker",
    icon: HeartHandshake,
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/25",
    route: "",
    statusKey: "sedekah",
  },
  {
    id: "buku-catatan",
    label: "Buku Catatan Lainnya",
    desc: "General Ledger, Hutang/Piutang, Digital Memo",
    icon: BookOpen,
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/25",
    route: "",
    statusKey: "catatan",
  },
];

const MOCK_TOTALS = {
  totalSaldo: 157_850_000,
  arusMasuk: 42_300_000,
  arusKeluar: 28_750_000,
};

export default function BukuKeuanganGlobal() {
  const router = useRouter();
  const { workspaces, createWorkspace } = useWorkspaceStore();
  const { accounts, transactions, loadAccounts, loadTransactions } = useFinancialStore();
  const { sedekahBalance, ledgerDebts } = useBusinessStore();
  const [mounted, setMounted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("pribadi");
  const [aggLoading, setAggLoading] = useState(true);

  useEffect(() => setMounted(true), []);

  const hasWorkspaceType = useMemo(() => {
    const types = new Set(workspaces.map((w) => w.type));
    return {
      pribadi: types.has("pribadi"),
      usaha: types.has("usaha"),
      sedekah: sedekahBalance.zakatMal > 0 || sedekahBalance.zakatFitrah > 0 || sedekahBalance.infakTerikat > 0 || sedekahBalance.sedekahSubuh > 0,
      catatan: ledgerDebts.length > 0,
    };
  }, [workspaces, sedekahBalance, ledgerDebts]);

  useEffect(() => {
    const loadAll = async () => {
      setAggLoading(true);
      try {
        const { getAllWorkspaces, getTransactionsByWorkspace } = await import("@/lib/db");
        const all = await getAllWorkspaces();
        for (const ws of all) {
          await loadAccounts(ws.id);
          await loadTransactions(ws.id);
        }
      } catch {
        /* mock mode — data default */
      } finally {
        setAggLoading(false);
      }
    };
    if (mounted) loadAll();
  }, [mounted, loadAccounts, loadTransactions]);

  const aggregate = useMemo(() => {
    const totalSaldo = accounts.reduce((s, a) => s + a.balance, 0);
    const bulanIni = new Date().toISOString().slice(0, 7);
    const arusMasuk = transactions
      .filter((t) => t.type === "income" && t.date.startsWith(bulanIni))
      .reduce((s, t) => s + t.amount, 0);
    const arusKeluar = transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(bulanIni))
      .reduce((s, t) => s + t.amount, 0);

    return {
      totalSaldo: totalSaldo > 0 ? totalSaldo : MOCK_TOTALS.totalSaldo,
      arusMasuk: arusMasuk > 0 ? arusMasuk : MOCK_TOTALS.arusMasuk,
      arusKeluar: arusKeluar > 0 ? arusKeluar : MOCK_TOTALS.arusKeluar,
      isMock: totalSaldo === 0,
    };
  }, [accounts, transactions]);

  const bukuCount = useMemo(
    () => [hasWorkspaceType.pribadi, hasWorkspaceType.usaha, hasWorkspaceType.sedekah, hasWorkspaceType.catatan].filter(Boolean).length,
    [hasWorkspaceType]
  );

  const buatWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      const { user } = useAuthStore.getState();
      const userId = user?.id || "mock-user";
      await createWorkspace({ name: newName, description: "", currency: "IDR", icon: "Book", type: newType as any }, userId);
      setAdding(false);
      setNewName("");
      toast.success(`Buku ${newName} berhasil dibuat`);
    } catch {
      toast.success(`🚧 Buku "${newName}" ditambahkan (mock)`);
      setAdding(false);
      setNewName("");
    }
  };

  if (!mounted) return <div className="min-h-[60vh]" />;

  return (
    <div className="space-y-7 animate-fade-in max-w-2xl mx-auto pb-24">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <LayoutDashboard className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading">Buku Keuangan Global</h1>
            <p className="text-xs text-muted-foreground/60">
              {bukuCount} buku aktif{bukuCount > 0 && ` dari ${BOOKS.length}`} &middot;{" "}
              {aggLoading ? "Memuat..." : aggregate.isMock ? "Data contoh" : "Data langsung"}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-3.5" /> Tambah Buku
        </Button>
      </div>

      {/* ─── 3 Glow Widgets ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5">
              <Wallet className="size-3.5" /> Total Saldo / Aset
            </p>
            <p className="text-2xl font-bold font-heading text-white tabular-nums">
              IDR {aggregate.totalSaldo.toLocaleString()}
            </p>
            <p className="text-white/50 text-[10px]">Gabungan seluruh buku</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="size-3.5" /> Arus Kas Masuk
            </p>
            <p className="text-2xl font-bold font-heading text-white tabular-nums">
              IDR {aggregate.arusMasuk.toLocaleString()}
            </p>
            <p className="text-white/50 text-[10px]">Bulan {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative z-10 space-y-1">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5">
              <TrendingDown className="size-3.5" /> Arus Kas Keluar
            </p>
            <p className="text-2xl font-bold font-heading text-white tabular-nums">
              IDR {aggregate.arusKeluar.toLocaleString()}
            </p>
            <p className="text-white/50 text-[10px]">Bulan {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </div>

      {/* ─── Ringkasan Laba ─── */}
      <div className="floating-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center ${
            aggregate.arusMasuk - aggregate.arusKeluar >= 0
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-red-500/10 text-red-500"
          }`}>
            {aggregate.arusMasuk - aggregate.arusKeluar >= 0
              ? <TrendingUp className="size-5" />
              : <TrendingDown className="size-5" />
            }
          </div>
          <div>
            <p className="text-xs text-muted-foreground/60 font-medium">Laba Bersih Bulan Ini</p>
            <p className={`text-lg font-bold font-heading tabular-nums ${
              aggregate.arusMasuk - aggregate.arusKeluar >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500"
            }`}>
              {aggregate.arusMasuk - aggregate.arusKeluar >= 0 ? "+" : ""}
              IDR {(aggregate.arusMasuk - aggregate.arusKeluar).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center">
          <Store className="size-5 text-muted-foreground/40" />
        </div>
      </div>

      {/* ─── Grid Buku ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Pilih Buku</h2>
          <span className="text-[10px] text-muted-foreground/50">{bukuCount} aktif</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BOOKS.map((book) => {
            const aktif = hasWorkspaceType[book.statusKey];
            const Icon = book.icon;
            return (
              <button
                key={book.id}
                onClick={() => {
                  if (!aktif) {
                    toast.error(`Buku ${book.label} belum aktif. Buat baru?`);
                    return;
                  }
                  if (book.route) router.push(book.route);
                }}
                className="group relative text-left floating-card p-4 sm:p-5 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className={`size-12 rounded-2xl bg-gradient-to-br ${book.gradient} flex items-center justify-center shrink-0 shadow-lg ${book.glow} group-hover:scale-105 transition-transform`}>
                    <Icon className="size-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{book.label}</p>
                      {aktif ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="size-4 text-muted-foreground/40 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-2">{book.desc}</p>
                    <div className="mt-3">
                      {aktif ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-1.5 transition-all">
                          Buka <ArrowRight className="size-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium text-muted-foreground/50">
                          Belum Aktif
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Dialog Tambah Buku ─── */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Buku / Workspace Baru</DialogTitle>
            <DialogDescription>
              Pilih jenis buku yang ingin Anda buat
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={buatWorkspace} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nama Buku</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="cth: Keuangan Pribadi 2026"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Jenis Buku</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "pribadi", label: "Buku Pribadi", icon: BookUser, grad: "from-emerald-500 to-emerald-600" },
                  { value: "usaha", label: "Buku Usaha", icon: Briefcase, grad: "from-violet-500 to-violet-600" },
                  { value: "modal", label: "Buku Modal", icon: Wallet, grad: "from-blue-500 to-blue-600" },
                  { value: "toko", label: "Toko Online", icon: Store, grad: "from-cyan-500 to-cyan-600" },
                ].map((opt) => {
                  const Ico = opt.icon;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        newType === opt.value
                          ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                          : "border-border/50 hover:border-muted-foreground/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="bookType"
                        value={opt.value}
                        checked={newType === opt.value}
                        onChange={(e) => setNewType(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`size-9 rounded-xl bg-gradient-to-br ${opt.grad} flex items-center justify-center shrink-0`}>
                        <Ico className="size-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!newName}>Buat Buku</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
