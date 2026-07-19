"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId, type MataUang, type DbWalletMutation, BRANCH_MAP } from "@/lib/db-v4";
import { formatCurrency, CURRENCY_NAMES, CURRENCY_SYMBOLS } from "@/lib/currency";
import { SkeletonCard } from "@/components/ui/skeleton";
import { ArrowLeft, Wallet, Save, Pencil, Trash2, DollarSign, Landmark, Smartphone } from "lucide-react";
import { showToast } from "@/lib/toast";
import { RoleGuard } from "@/components/layout/role-guard";

export default function DompetPage() {
  return <RoleGuard requiredRole="kasir"><DompetPageContent /></RoleGuard>;
}

function DompetPageContent() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const _wallets = useLiveQuery(() => db.wallets.where("bookOrBranchId").equals(bookOrBranchId).toArray(), [bookOrBranchId]);
  const wallets = _wallets || [];

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [walletName, setWalletName] = useState("");
  const [walletTipe, setWalletTipe] = useState<"KasTunai" | "Bank" | "EWallet">("KasTunai");
  const [walletSaldo, setWalletSaldo] = useState(0);
  const [walletCatatan, setWalletCatatan] = useState("");
  const [walletNomorRekening, setWalletNomorRekening] = useState("");
  const [walletAtasNama, setWalletAtasNama] = useState("");
  const [walletNamaBank, setWalletNamaBank] = useState("");
  const [walletMataUang, setWalletMataUang] = useState<MataUang>("IDR");
  const [topupWallet, setTopupWallet] = useState<string | null>(null);
  const [tarikWallet, setTarikWallet] = useState<string | null>(null);
  const [adjustNominal, setAdjustNominal] = useState(0);
  const [adjustAlasan, setAdjustAlasan] = useState("");
  const [showMutations, setShowMutations] = useState<string | null>(null);

  const walletMap = new Map(wallets.map((w) => [w.id, w]));

  const walletMutations = useLiveQuery<DbWalletMutation>(
    () => showMutations ? db.walletMutations.where("dariWalletId").equals(showMutations).or("keWalletId").equals(showMutations).reverse().toArray() : Promise.resolve<DbWalletMutation[]>([]),
    [showMutations]
  ) || [];

  const resetForm = () => {
    setEditingWallet(null); setWalletName(""); setWalletSaldo(0); setWalletCatatan(""); setWalletTipe("KasTunai");
    setWalletNomorRekening(""); setWalletAtasNama(""); setWalletNamaBank(""); setWalletMataUang("IDR");
  };

  const handleSave = async () => {
    if (!walletName.trim()) return showToast.error("Nama dompet wajib diisi!");
    const bankData = walletTipe === "Bank" ? { nomorRekening: walletNomorRekening.trim() || undefined, atasNama: walletAtasNama.trim() || undefined, namaBank: walletNamaBank.trim() || undefined } : {};
    if (editingWallet) {
      await db.wallets.update(editingWallet, { namaDompet: walletName.trim(), tipe: walletTipe, mataUang: walletMataUang, saldo: walletSaldo, catatan: walletCatatan, ...bankData });
    } else {
      await db.wallets.add({
        id: crypto.randomUUID(), bookOrBranchId, unitId: bookOrBranchId,
        namaDompet: walletName.trim(), saldo: walletSaldo, tipe: walletTipe, mataUang: walletMataUang,
        catatan: walletCatatan, isActive: true, createdAt: new Date().toISOString(), ...bankData,
      });
    }
    resetForm();
  };

  const handleEdit = (w: typeof wallets[0]) => {
    setEditingWallet(w.id); setWalletName(w.namaDompet); setWalletTipe(w.tipe); setWalletSaldo(w.saldo); setWalletCatatan(w.catatan);
    setWalletNomorRekening(w.nomorRekening || ""); setWalletAtasNama(w.atasNama || ""); setWalletNamaBank(w.namaBank || ""); setWalletMataUang(w.mataUang || "IDR");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus dompet ini?")) return;
    await db.wallets.delete(id);
    if (editingWallet === id) resetForm();
  };

  const tipeIcons: Record<string, React.ReactNode> = {
    Bank: <Landmark className="w-4 h-4" />,
    EWallet: <Smartphone className="w-4 h-4" />,
    KasTunai: <DollarSign className="w-4 h-4" />,
  };

  const totalSaldo = wallets.reduce((s, w) => s + w.saldo, 0);
  const isEditing = !!editingWallet;

  const handleTopup = async () => {
    if (!topupWallet || adjustNominal <= 0) return showToast.error("Nominal harus lebih dari 0!");
    const wallet = wallets.find((w) => w.id === topupWallet);
    if (!wallet) return;
    if (!confirm(`Topup ${CURRENCY_SYMBOLS[wallet.mataUang || "IDR"]}${adjustNominal.toLocaleString()} ke ${wallet.namaDompet}?${adjustAlasan ? `\nAlasan: ${adjustAlasan}` : ""}`)) return;
    await db.transaction("rw", db.wallets, db.walletMutations, async () => {
      const w = await db.wallets.get(topupWallet);
      if (!w) throw new Error("Dompet tidak ditemukan");
      await db.wallets.update(topupWallet, { saldo: w.saldo + adjustNominal });
      await db.walletMutations.add({
        id: crypto.randomUUID(), bookOrBranchId,
        dariWalletId: "topup", keWalletId: topupWallet,
        nominal: adjustNominal, alasan: adjustAlasan.trim() || "Top Up",
        createdAt: new Date().toISOString(),
      });
    });
    showToast.success("TopUp berhasil!");
    setTopupWallet(null); setAdjustNominal(0); setAdjustAlasan("");
  };

  const handleTarik = async () => {
    if (!tarikWallet || adjustNominal <= 0) return showToast.error("Nominal harus lebih dari 0!");
    const wallet = wallets.find((w) => w.id === tarikWallet);
    if (!wallet) return;
    if (adjustNominal > wallet.saldo) return showToast.error("Saldo tidak mencukupi!");
    if (!confirm(`Tarik Tunai ${CURRENCY_SYMBOLS[wallet.mataUang || "IDR"]}${adjustNominal.toLocaleString()} dari ${wallet.namaDompet}?${adjustAlasan ? `\nAlasan: ${adjustAlasan}` : ""}`)) return;
    await db.transaction("rw", db.wallets, db.walletMutations, async () => {
      const w = await db.wallets.get(tarikWallet);
      if (!w) throw new Error("Dompet tidak ditemukan");
      if (w.saldo < adjustNominal) throw new Error("Saldo tidak mencukupi");
      await db.wallets.update(tarikWallet, { saldo: w.saldo - adjustNominal });
      await db.walletMutations.add({
        id: crypto.randomUUID(), bookOrBranchId,
        dariWalletId: tarikWallet, keWalletId: "tarik",
        nominal: adjustNominal, alasan: adjustAlasan.trim() || "Tarik Tunai",
        createdAt: new Date().toISOString(),
      });
    });
    showToast.success("Tarik Tunai berhasil!");
    setTarikWallet(null); setAdjustNominal(0); setAdjustAlasan("");
  };

  if (_wallets === undefined) return <SkeletonCard count={5} />;
  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-bisnis/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
            <Wallet className="w-5 h-5 text-[#008CEB]" />
            Dompet
          </h1>
        </div>
        <div className="w-10 h-10" />
      </div>

      {/* Total Saldo Card */}
      <div className="premium-card p-4 bg-gradient-to-br from-[#008CEB]/10 to-[#00C9A7]/10 dark:from-[#008CEB]/5 dark:to-[#00C9A7]/5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-[#008CEB]" />
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Saldo</span>
        </div>
        <p className="text-xl font-heading font-extrabold text-[#008CEB] dark:text-[#4DA3E0] tracking-tight">{formatCurrency(totalSaldo)}</p>
        <p className="text-[9px] text-slate-400 mt-1">{wallets.length} dompet aktif</p>
      </div>

      {/* Form Inline — selalu terlihat */}
      <div className="premium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#008CEB]" />
          </div>
          <span className="text-xs font-heading font-extrabold">{isEditing ? "Edit Dompet" : "Tambah Dompet"}</span>
          {isEditing && (
            <button onClick={resetForm} className="ml-auto text-[10px] text-slate-400 font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800">Batal</button>
          )}
        </div>
        <div className="space-y-3 text-xs">
          <input type="text" placeholder="Nama dompet (contoh: Kas, BCA, Dana)" value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
          <div className="grid grid-cols-3 gap-2">
            {(["KasTunai", "Bank", "EWallet"] as const).map((t) => (
              <button key={t} onClick={() => setWalletTipe(t)}
                className={`py-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${walletTipe === t ? "bg-[#008CEB] text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"}`}>
                {t === "KasTunai" ? <DollarSign className="w-4 h-4" /> : t === "Bank" ? <Landmark className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                {t === "KasTunai" ? "Kas" : t === "Bank" ? "Bank" : "E-Wallet"}
              </button>
            ))}
          </div>
          <select value={walletMataUang} onChange={(e) => setWalletMataUang(e.target.value as MataUang)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-sm outline-none font-bold">
            <option value="IDR">Rp - Rupiah</option>
            <option value="USD">$ - US Dollar</option>
          </select>
          {walletTipe === "Bank" && <>
            <input type="text" placeholder="Nama Bank (contoh: BCA, Mandiri)" value={walletNamaBank}
              onChange={(e) => setWalletNamaBank(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
            <input type="text" placeholder="Atas Nama" value={walletAtasNama}
              onChange={(e) => setWalletAtasNama(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
            <input type="text" placeholder="Nomor Rekening" value={walletNomorRekening}
              onChange={(e) => setWalletNomorRekening(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
          </>}
          <input type="number" placeholder="Saldo awal (Rp)" value={walletSaldo || ""}
            onChange={(e) => setWalletSaldo(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
          <input type="text" placeholder="Catatan (opsional)" value={walletCatatan}
            onChange={(e) => setWalletCatatan(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
          <button onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5">
            <Save className="w-4 h-4" /> {isEditing ? "Update Dompet" : "Simpan Dompet"}
          </button>
        </div>
      </div>

      {/* Daftar Dompet */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-[#008CEB]" />
          <span className="text-xs font-heading font-extrabold">Daftar Dompet</span>
          <span className="text-[10px] text-slate-400 ml-auto">({wallets.length})</span>
        </div>
          {wallets.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs animate-fade-in"><Wallet className="w-6 h-6 mx-auto mb-2 opacity-40" />Belum ada dompet. Isi form di atas untuk menambah.</div>
        ) : (
          wallets.map((w) => (
            <div key={w.id}>
              <div className="premium-card p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#008CEB]/10 flex items-center justify-center text-[#008CEB]">
                    {tipeIcons[w.tipe] || <Wallet className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading font-bold truncate">{w.namaDompet}</p>
                    {w.tipe === "Bank" && w.namaBank ? (
                      <p className="text-[9px] text-slate-400">{w.namaBank}{w.atasNama ? ` · ${w.atasNama}` : ""}{w.nomorRekening ? ` · ${w.nomorRekening}` : ""}</p>
                    ) : (
                      <p className="text-[9px] text-slate-400">{w.tipe}{w.catatan ? ` · ${w.catatan}` : ""}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-heading font-extrabold text-[#008CEB]">{formatCurrency(w.saldo, w.mataUang || "IDR")}</p>
                    <div className="flex gap-1 mt-0.5 justify-end">
                      <button onClick={() => handleEdit(w)} className="p-0.5 text-slate-400 hover:text-[#008CEB]">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(w.id)} className="p-0.5 text-slate-400 hover:text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => { setTopupWallet(w.id); setAdjustNominal(0); setAdjustAlasan(""); }}
                    className="text-[9px] text-emerald-600 font-bold px-2 py-1 rounded-lg bg-emerald-500/10 active:scale-95 transition-transform">
                    Top Up
                  </button>
                  <button onClick={() => { setTarikWallet(w.id); setAdjustNominal(0); setAdjustAlasan(""); }}
                    className="text-[9px] text-rose-600 font-bold px-2 py-1 rounded-lg bg-rose-500/10 active:scale-95 transition-transform">
                    Tarik Tunai
                  </button>
                  <button onClick={() => setShowMutations(showMutations === w.id ? null : w.id)}
                    className="text-[9px] text-[#008CEB] font-bold px-2 py-1 rounded-lg bg-[#008CEB]/10 active:scale-95 transition-transform">
                    {showMutations === w.id ? "Tutup" : "Riwayat"}
                  </button>
                </div>
              </div>
              {showMutations === w.id && (
                <div className="mt-1 space-y-1">
                  {walletMutations.length === 0 ? (
                    <p className="text-[9px] text-slate-400 text-center py-2">Belum ada mutasi.</p>
                  ) : (
                    walletMutations.map((m) => {
                      const isTopup = m.dariWalletId === "topup";
                      const isTarik = m.keWalletId === "tarik";
                      return (
                        <div key={m.id} className="premium-card p-2.5 flex items-center gap-2 ml-4">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isTopup ? "bg-emerald-500/10 text-emerald-600" : isTarik ? "bg-rose-500/10 text-rose-600" : "bg-[#008CEB]/10 text-[#008CEB]"}`}>
                            {isTopup ? "+" : isTarik ? "-" : "↔"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-heading font-bold">
                              {isTopup ? "Top Up" : isTarik ? "Tarik Tunai" : `Transfer ${walletMap.get(m.keWalletId)?.namaDompet || ""}`}
                            </p>
                            <p className="text-[8px] text-slate-400">
                              {m.alasan}
                              <span className="mx-1">·</span>
                              {new Date(m.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <p className={`text-[10px] font-heading font-extrabold shrink-0 ${isTopup ? "text-emerald-600" : "text-rose-600"}`}>
                            {isTopup ? "+" : "-"}{formatCurrency(m.nominal)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Topup */}
      {topupWallet && (() => {
        const w = walletMap.get(topupWallet);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => { setTopupWallet(null); setAdjustNominal(0); setAdjustAlasan(""); }}>
            <div className="bg-white dark:bg-[#131527] rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-heading font-extrabold mb-3">Top Up {w?.namaDompet}</p>
              <div className="space-y-3 text-xs">
                <input type="number" placeholder="Jumlah" value={adjustNominal || ""}
                  onChange={(e) => setAdjustNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
                <input type="text" placeholder="Alasan / Deskripsi (opsional)" value={adjustAlasan}
                  onChange={(e) => setAdjustAlasan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={() => { setTopupWallet(null); setAdjustNominal(0); setAdjustAlasan(""); }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 font-bold text-xs active:scale-[0.98] transition-transform">
                    Batal
                  </button>
                  <button onClick={handleTopup}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold text-xs active:scale-[0.98] transition-transform">
                    Top Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Tarik Tunai */}
      {tarikWallet && (() => {
        const w = walletMap.get(tarikWallet);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => { setTarikWallet(null); setAdjustNominal(0); setAdjustAlasan(""); }}>
            <div className="bg-white dark:bg-[#131527] rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-heading font-extrabold mb-3">Tarik Tunai {w?.namaDompet}</p>
              <p className="text-[10px] text-slate-400 mb-3">Saldo tersedia: {formatCurrency(w?.saldo || 0, w?.mataUang || "IDR")}</p>
              <div className="space-y-3 text-xs">
                <input type="number" placeholder="Jumlah" value={adjustNominal || ""}
                  onChange={(e) => setAdjustNominal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none font-bold" />
                <input type="text" placeholder="Alasan / Deskripsi (opsional)" value={adjustAlasan}
                  onChange={(e) => setAdjustAlasan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={() => { setTarikWallet(null); setAdjustNominal(0); setAdjustAlasan(""); }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 font-bold text-xs active:scale-[0.98] transition-transform">
                    Batal
                  </button>
                  <button onClick={handleTarik}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 text-white font-bold text-xs active:scale-[0.98] transition-transform">
                    Tarik Tunai
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
