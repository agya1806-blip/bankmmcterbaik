"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown, ArrowLeft, Plus, X, ChevronDown, ChevronRight,
  Wallet, Clock, CheckCircle2, Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore, Piutang, BizUnit, BIZ_UNIT_LABELS } from "@/store/useBusinessStore";
import { CardSkeleton } from "@/components/ui/skeleton";

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function sisaHari(jatuhTempo: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(jatuhTempo);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type TabFilter = "aktif" | "lunas" | "semua";

export default function PiutangPage() {
  const router = useRouter();
  const store = useBusinessStore();
  const { piutangList, addPiutang, bayarCicilan, getCicilanByPiutang } = store;

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabFilter>("aktif");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTambah, setShowTambah] = useState(false);
  const [showBayar, setShowBayar] = useState<Piutang | null>(null);

  const [formUnit, setFormUnit] = useState<BizUnit>("percetakan");
  const [formNama, setFormNama] = useState("");
  const [formWA, setFormWA] = useState("");
  const [formInvoice, setFormInvoice] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [formJatuhTempo, setFormJatuhTempo] = useState("");
  const [formCatatan, setFormCatatan] = useState("");

  const [bayarJumlah, setBayarJumlah] = useState("");
  const [bayarMetode, setBayarMetode] = useState("Tunai");
  const [bayarCatatan, setBayarCatatan] = useState("");

  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    if (tab === "aktif") return piutangList.filter((p) => p.status === "aktif");
    if (tab === "lunas") return piutangList.filter((p) => p.status === "lunas");
    return piutangList;
  }, [piutangList, tab]);

  const totalPiutangAktif = useMemo(
    () => piutangList.filter((p) => p.status === "aktif").reduce((s, p) => s + p.sisaPiutang, 0),
    [piutangList]
  );

  const cicilanForExpanded = useMemo(
    () => (expandedId ? getCicilanByPiutang(expandedId) : []),
    [expandedId, getCicilanByPiutang]
  );

  const resetFormTambah = useCallback(() => {
    setFormUnit("percetakan");
    setFormNama("");
    setFormWA("");
    setFormInvoice("");
    setFormTotal("");
    setFormJatuhTempo("");
    setFormCatatan("");
  }, []);

  const handleTambahPiutang = useCallback(() => {
    if (!formNama.trim()) { toast.error("Nama pelanggan wajib diisi"); return; }
    if (!formTotal || parseInt(formTotal) <= 0) { toast.error("Total piutang harus lebih dari 0"); return; }
    if (!formJatuhTempo) { toast.error("Jatuh tempo wajib diisi"); return; }
    const total = parseInt(formTotal);
    addPiutang({
      unit: formUnit,
      customerNama: formNama.trim(),
      customerWA: formWA.trim(),
      invoiceId: formInvoice.trim() || `INV-${Date.now()}`,
      totalPiutang: total,
      sisaPiutang: total,
      jatuhTempo: formJatuhTempo,
      status: "aktif",
      catatan: formCatatan.trim() || undefined,
    });
    toast.success(`Piutang ${formNama.trim()} dicatat`);
    resetFormTambah();
    setShowTambah(false);
  }, [formUnit, formNama, formWA, formInvoice, formTotal, formJatuhTempo, formCatatan, addPiutang, resetFormTambah]);

  const handleBayarCicilan = useCallback(() => {
    if (!showBayar) return;
    if (!bayarJumlah || parseInt(bayarJumlah) <= 0) { toast.error("Jumlah harus lebih dari 0"); return; }
    const jumlah = parseInt(bayarJumlah);
    if (jumlah > showBayar.sisaPiutang) { toast.error(`Sisa piutang hanya ${formatRupiah(showBayar.sisaPiutang)}`); return; }
    bayarCicilan(showBayar.id, jumlah, bayarMetode, bayarCatatan.trim() || undefined);
    toast.success(`Pembayaran ${formatRupiah(jumlah)} dicatat`);
    setShowBayar(null);
    setBayarJumlah("");
    setBayarCatatan("");
  }, [showBayar, bayarJumlah, bayarMetode, bayarCatatan, bayarCicilan]);

  const statusBadge = (status: Piutang["status"], sisaHariVal: number) => {
    if (status === "lunas")
      return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold">Lunas</span>;
    if (status === "dihapus")
      return <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[9px] font-bold">Dihapus</span>;
    if (sisaHariVal < 0)
      return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-bold">Terlambat</span>;
    if (sisaHariVal <= 3)
      return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-bold">Mendesak</span>;
    return <span className="px-2 py-0.5 rounded-full bg-[#7B61FF]/10 text-[#7B61FF] text-[9px] font-bold">Aktif</span>;
  };

  const cardBorder = (status: Piutang["status"], sisaHariVal: number) => {
    if (status === "lunas") return "border-l-emerald-500";
    if (sisaHariVal < 0) return "border-l-rose-500";
    if (sisaHariVal <= 3) return "border-l-amber-500";
    return "border-l-[#7B61FF]";
  };

  const sisaHariLabel = (val: number) => {
    if (val < 0) return `Terlambat ${Math.abs(val)} hari`;
    if (val === 0) return "Jatuh tempo hari ini";
    return `${val} hari lagi`;
  };

  if (!mounted) return <div className="grid grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div>;

  const tabBtn = (key: TabFilter, label: string) => (
    <button key={key} onClick={() => setTab(key)}
      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${
        tab === key
          ? "bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white shadow-lg shadow-[#7B61FF]/20"
          : "bg-white/90 dark:bg-[#131527]/90 text-muted-foreground/60 hover:bg-white/70 dark:hover:bg-[#131527]/70 border border-slate-200/60 dark:border-slate-800/60"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/buku-usaha")}
            className="size-9 rounded-xl bg-white/90 dark:bg-[#131527]/90 flex items-center justify-center hover:bg-white/70 dark:hover:bg-[#131527]/70 transition-colors border border-slate-200/60 dark:border-slate-800/60"
          >
            <ArrowLeft className="size-4 text-muted-foreground" />
          </button>
          <div className="size-11 rounded-2xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-lg shadow-[#7B61FF]/20">
            <ArrowUpDown className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-heading">Piutang & Cicilan</h2>
            <p className="text-[10px] text-muted-foreground/60">Catat dan kelola piutang pelanggan</p>
          </div>
        </div>
        <button onClick={() => { resetFormTambah(); setShowTambah(true); }}
          className="btn-gradient px-3 py-2 text-[10px] font-bold flex items-center gap-1"
        >
          <Plus className="size-3.5" /> Catat Piutang Baru
        </button>
      </div>

      {/* ─── Summary ─── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="premium-stat p-3 text-center">
          <p className="premium-stat-value text-lg font-bold font-heading tabular-nums">{piutangList.filter((p) => p.status === "aktif").length}</p>
          <p className="premium-stat-label text-[9px]">Piutang Aktif</p>
        </div>
        <div className="premium-stat p-3 text-center">
          <p className="premium-stat-value text-lg font-bold font-heading tabular-nums">{formatRupiah(totalPiutangAktif)}</p>
          <p className="premium-stat-label text-[9px]">Total Sisa</p>
        </div>
        <div className="premium-stat p-3 text-center">
          <p className="premium-stat-value text-lg font-bold font-heading tabular-nums">{piutangList.filter((p) => p.status === "lunas").length}</p>
          <p className="premium-stat-label text-[9px]">Lunas</p>
        </div>
      </div>

      {/* ─── Tab Nav ─── */}
      <div className="flex gap-2">
        {tabBtn("aktif", `Aktif (${piutangList.filter((p) => p.status === "aktif").length})`)}
        {tabBtn("lunas", `Lunas (${piutangList.filter((p) => p.status === "lunas").length})`)}
        {tabBtn("semua", `Semua (${piutangList.length})`)}
      </div>

      {/* ─── Piutang List ─── */}
      {filtered.length === 0 ? (
        <div className="premium-card p-6 text-center border border-slate-200/60 dark:border-slate-800/60">
          <ArrowUpDown className="size-10 mx-auto text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground/40 mt-2">
            {piutangList.length === 0 ? "Belum ada piutang" : "Tidak ada piutang"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const sisa = sisaHari(p.jatuhTempo);
            const expanded = expandedId === p.id;
            return (
              <div key={p.id}
                className={`premium-card p-4 space-y-3 border-l-4 border border-slate-200/60 dark:border-slate-800/60 ${cardBorder(p.status, sisa)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{p.customerNama}</p>
                      {statusBadge(p.status, sisa)}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50 mt-0.5 flex-wrap">
                      {p.customerWA && <span>{p.customerWA}</span>}
                      <span>|</span>
                      <span>Invoice: {p.invoiceId}</span>
                      <span>|</span>
                      <span>{BIZ_UNIT_LABELS[p.unit]}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold tabular-nums">{formatRupiah(p.sisaPiutang)}</p>
                    <p className="text-[9px] text-muted-foreground/40">dari {formatRupiah(p.totalPiutang)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3 text-muted-foreground/40" />
                    <span className={sisa < 0 ? "text-rose-500 font-semibold" : sisa <= 3 ? "text-amber-500 font-semibold" : "text-muted-foreground/50"}>
                      {new Date(p.jatuhTempo).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} — {sisaHariLabel(sisa)}
                    </span>
                  </div>
                  {p.catatan && (
                    <span className="text-muted-foreground/30 italic truncate ml-2">{p.catatan}</span>
                  )}
                </div>

                {p.status === "aktif" && (
                  <div className="flex gap-1">
                    <button onClick={() => setShowBayar(p)}
                      className="flex-1 py-1.5 rounded-lg bg-[#7B61FF]/10 text-[#7B61FF] text-[9px] font-bold hover:bg-[#7B61FF]/20 transition-all flex items-center justify-center gap-1"
                    >
                      <Wallet className="size-3" /> Bayar Cicilan
                    </button>
                    <button onClick={() => setExpandedId(expanded ? null : p.id)}
                      className="py-1.5 px-2 rounded-lg bg-white/90 dark:bg-[#131527]/90 text-muted-foreground/50 hover:bg-white/70 dark:hover:bg-[#131527]/70 transition-all border border-slate-200/60 dark:border-slate-800/60"
                    >
                      {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </button>
                  </div>
                )}

                {/* Expanded: Cicilan History */}
                {expanded && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                    <p className="text-[9px] font-semibold text-muted-foreground/60 flex items-center gap-1">
                      <Clock className="size-3" /> Riwayat Pembayaran ({cicilanForExpanded.length})
                    </p>
                    {cicilanForExpanded.length === 0 ? (
                      <p className="text-[9px] text-muted-foreground/30 py-1 text-center">Belum ada pembayaran</p>
                    ) : (
                      <div className="space-y-1">
                        {cicilanForExpanded.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/90 dark:bg-[#131527]/90 text-[9px] border border-slate-200/60 dark:border-slate-800/60">
                            <div className="size-6 rounded-lg bg-[#7B61FF]/10 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="size-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{formatRupiah(c.jumlah)}</p>
                              <p className="text-muted-foreground/50">
                                {new Date(c.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                {c.metode ? ` — ${c.metode}` : ""}
                              </p>
                            </div>
                            {c.catatan && (
                              <span className="text-muted-foreground/30 italic max-w-[120px] truncate">{c.catatan}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: TAMBAH PIUTANG
          ══════════════════════════════════════════════════ */}
      {showTambah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowTambah(false)}
        >
          <div className="premium-card p-5 space-y-4 w-full max-w-sm border border-slate-200/60 dark:border-slate-800/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold flex items-center gap-1.5">
                <Plus className="size-3.5" /> Catat Piutang Baru
              </p>
              <button onClick={() => setShowTambah(false)}
                className="size-7 rounded-lg bg-white/90 dark:bg-[#131527]/90 flex items-center justify-center hover:bg-white/70 dark:hover:bg-[#131527]/70 border border-slate-200/60 dark:border-slate-800/60"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Nama Pelanggan *</label>
              <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)}
                placeholder="cth: Ahmad Fauzi" className="input-premium w-full text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">No. WA</label>
                <input type="text" value={formWA} onChange={(e) => setFormWA(e.target.value)}
                  placeholder="08xxx" className="input-premium w-full text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Unit Bisnis</label>
                <select value={formUnit} onChange={(e) => setFormUnit(e.target.value as BizUnit)}
                  className="input-premium w-full text-[10px]">
                  {(Object.entries(BIZ_UNIT_LABELS) as [BizUnit, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Invoice ID</label>
              <input type="text" value={formInvoice} onChange={(e) => setFormInvoice(e.target.value)}
                placeholder="Otomatis jika dikosongkan" className="input-premium w-full text-[10px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Total Piutang *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
                  <input type="text" inputMode="numeric" value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value.replace(/\D/g, ""))}
                    placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground/50">Jatuh Tempo *</label>
                <input type="date" value={formJatuhTempo} onChange={(e) => setFormJatuhTempo(e.target.value)}
                  className="input-premium w-full text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Catatan (opsional)</label>
              <input type="text" value={formCatatan} onChange={(e) => setFormCatatan(e.target.value)}
                placeholder="cth: Pembayaran pertama 50% di muka" className="input-premium w-full text-[10px]" />
            </div>

            <button onClick={handleTambahPiutang}
              disabled={!formNama.trim() || !formTotal || parseInt(formTotal) <= 0 || !formJatuhTempo}
              className="btn-gradient w-full py-2.5 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="size-4" /> Catat Piutang
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MODAL: BAYAR CICILAN
          ══════════════════════════════════════════════════ */}
      {showBayar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowBayar(null)}
        >
          <div className="premium-card p-5 space-y-4 w-full max-w-sm border border-slate-200/60 dark:border-slate-800/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold flex items-center gap-1.5">
                <Wallet className="size-3.5" /> Bayar Cicilan
              </p>
              <button onClick={() => setShowBayar(null)}
                className="size-7 rounded-lg bg-white/90 dark:bg-[#131527]/90 flex items-center justify-center hover:bg-white/70 dark:hover:bg-[#131527]/70 border border-slate-200/60 dark:border-slate-800/60"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-[#131527]/90 p-3 text-[10px] space-y-1 border border-slate-200/60 dark:border-slate-800/60">
              <p className="font-medium">{showBayar.customerNama}</p>
              <p className="text-muted-foreground/50">Invoice: {showBayar.invoiceId}</p>
              <p className="text-muted-foreground/50">
                Sisa: <span className="font-semibold text-rose-500">{formatRupiah(showBayar.sisaPiutang)}</span>
                {" "}dari {formatRupiah(showBayar.totalPiutang)}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Jumlah Pembayaran *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">Rp</span>
                <input type="text" inputMode="numeric" value={bayarJumlah}
                  onChange={(e) => setBayarJumlah(e.target.value.replace(/\D/g, ""))}
                  placeholder="0" className="input-premium w-full text-xs pl-10 tabular-nums" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Metode Pembayaran</label>
              <select value={bayarMetode} onChange={(e) => setBayarMetode(e.target.value)}
                className="input-premium w-full text-[10px]"
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="EWallet">E-Wallet</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground/50">Catatan (opsional)</label>
              <input type="text" value={bayarCatatan} onChange={(e) => setBayarCatatan(e.target.value)}
                placeholder="cth: Pembayaran ke-2" className="input-premium w-full text-[10px]" />
            </div>

            <button onClick={handleBayarCicilan}
              disabled={!bayarJumlah || parseInt(bayarJumlah) <= 0}
              className="btn-gradient w-full py-2.5 text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Wallet className="size-4" /> Catat Pembayaran
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
