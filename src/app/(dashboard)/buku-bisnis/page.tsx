"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type BookOrBranch } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";
import { showToast } from "@/lib/toast";
import { Printer, Smartphone, Monitor, Coffee, Shirt, ArrowLeft, Building, ShoppingCart, Settings, Plus } from "lucide-react";

function getUnitIcon(nama: string) {
  const lower = nama.toLowerCase();
  if (lower.includes("cetak") || lower.includes("print")) return <Printer className="w-5 h-5" />;
  if (lower.includes("gadget") || lower.includes("hp") || lower.includes("konter")) return <Smartphone className="w-5 h-5" />;
  if (lower.includes("laptop") || lower.includes("komputer") || lower.includes("pc")) return <Monitor className="w-5 h-5" />;
  if (lower.includes("kopi") || lower.includes("cafe") || lower.includes("warkop")) return <Coffee className="w-5 h-5" />;
  if (lower.includes("konveksi") || lower.includes("fashion") || lower.includes("jahit")) return <Shirt className="w-5 h-5" />;
  if (lower.includes("kelontong") || lower.includes("sembako")) return <ShoppingCart className="w-5 h-5" />;
  if (lower.includes("pakaian") || lower.includes("baju")) return <Shirt className="w-5 h-5" />;
  return <Building className="w-5 h-5" />;
}

const COLORS = ["from-blue-500 to-blue-600","from-indigo-500 to-indigo-600","from-violet-500 to-purple-600","from-orange-400 to-orange-500","from-pink-400 to-pink-500","from-emerald-400 to-emerald-500","from-rose-400 to-rose-500","from-cyan-400 to-cyan-500","from-amber-400 to-amber-500"];

function getUnitColor(slug: string) { let h=0; for(let i=0;i<slug.length;i++) h=(h*31+slug.charCodeAt(i))%COLORS.length; return COLORS[h]; }

const unitSlug = (nama: string) => nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function BukuBisnisListPage() {
  const router = useRouter();
  const { setBranch } = useSessionStore();

  const allProfiles = useLiveQuery(() => db.profiles.where("bookOrBranchId").notEqual("pribadi").and(p => p.bookOrBranchId !== "keluarga").toArray(), []) || [];
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const allCashflows = useLiveQuery(() => db.cashflows.toArray()) || [];
  const allInventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const allWallets = useLiveQuery(() => db.wallets.toArray()) || [];

  const unitList = useMemo(() => {
    return allProfiles.map(p => {
      const slug = unitSlug(p.namaUsaha || "unit");
      const bookId = p.bookOrBranchId;
      const txs = allTransactions.filter(tx => tx.bookOrBranchId === bookId);
      const cf = allCashflows.filter(c => c.bookOrBranchId === bookId);
      const inv = allInventory.filter(i => i.bookOrBranchId === bookId);
      const wallets = allWallets.filter(w => w.bookOrBranchId === bookId);

      return {
        slug,
        label: p.namaUsaha || "Unit Usaha",
        bookId,
        icon: getUnitIcon(p.namaUsaha || ""),
        color: getUnitColor(slug),
        jumlahTx: txs.length,
        masuk: cf.filter(c => c.tipe === "masuk").reduce((s, c) => s + c.nominal, 0),
        keluar: cf.filter(c => c.tipe === "keluar").reduce((s, c) => s + c.nominal, 0),
        saldo: wallets.reduce((s, w) => s + w.saldo, 0),
        stokMenipis: inv.filter(i => i.stok <= i.stokMin).length,
        piutang: txs.filter(tx => tx.sisaTagihan > 0).reduce((s, tx) => s + tx.sisaTagihan, 0),
      };
    });
  }, [allProfiles, allTransactions, allCashflows, allInventory, allWallets]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return showToast.error("Nama unit harus diisi");
    const slug = unitSlug(newUnitName.trim());
    const bookId = `usaha-${slug}`;
    const exists = await db.profiles.where("bookOrBranchId").equals(bookId).first();
    if (exists) return showToast.error("Unit dengan nama tersebut sudah ada");
    await db.profiles.add({
      id: crypto.randomUUID(),
      bookOrBranchId: bookId as any,
      namaUsaha: newUnitName.trim(),
      logoUrl: "", alamat: "", noWhatsapp: "", slogan: "", subLayanan: [],
      updatedAt: new Date().toISOString(),
    });
    await db.wallets.add({
      id: crypto.randomUUID(),
      bookOrBranchId: bookId as any,
      unitId: bookId as any,
      namaDompet: "Kas Utama",
      saldo: 0, tipe: "KasTunai", mataUang: "IDR", isActive: true,
      nomorRekening: "", atasNama: "", namaBank: "", catatan: "",
      createdAt: new Date().toISOString(),
    });
    showToast.success("Unit usaha berhasil ditambahkan");
    setShowAddForm(false); setNewUnitName("");
  };

  const handleSelectUnit = (slug: string, bookId: BookOrBranch) => {
    setBranch(slug);
    router.push(`/buku-bisnis/${slug}`);
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/buku")}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
            <Building className="w-5 h-5 text-[#008CEB]" />
            Buku Bisnis
          </h1>
          <p className="text-[9px] text-slate-400">{unitList.length} unit usaha</p>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Stats Global Usaha */}
      <div className="premium-card p-4 bg-gradient-to-br from-amber-400/10 to-orange-500/10 dark:from-amber-400/5 dark:to-orange-500/5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Total Masuk</p>
            <p className="text-xs font-extrabold text-emerald-500">
              Rp{unitList.reduce((s, u) => s + u.masuk, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Total Keluar</p>
            <p className="text-xs font-extrabold text-rose-500">
              Rp{unitList.reduce((s, u) => s + u.keluar, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Total Saldo</p>
            <p className="text-xs font-extrabold text-[#008CEB]">
              Rp{unitList.reduce((s, u) => s + u.saldo, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Unit Usaha Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {unitList.map((u, i) => (
          <div
            key={u.slug}
            className="premium-card premium-card-glow p-3 text-left animate-slide-up relative"
            style={{ animationDelay: `${100 + i * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white shadow-md`}>
                {u.icon}
              </div>
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleSelectUnit(u.slug, u.bookId)}>
                <p className="text-[11px] font-heading font-bold line-clamp-1">{u.label}</p>
                <p className="text-[9px] text-slate-400">{u.jumlahTx} transaksi</p>
              </div>
              <button onClick={() => router.push(`/buku-bisnis/${u.slug}/pengaturan`)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all shrink-0"
                title="Pengaturan">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <div onClick={() => handleSelectUnit(u.slug, u.bookId)} className="cursor-pointer">
              <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg px-2 py-1">
                <p className="text-[8px] text-emerald-600 font-bold">Masuk</p>
                <p className="text-[10px] font-heading font-extrabold text-emerald-600 dark:text-emerald-400">Rp{(u.masuk / 1000).toFixed(0)}rb</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg px-2 py-1">
                <p className="text-[8px] text-rose-600 font-bold">Keluar</p>
                <p className="text-[10px] font-heading font-extrabold text-rose-600 dark:text-rose-400">Rp{(u.keluar / 1000).toFixed(0)}rb</p>
              </div>
            </div>
            {(u.stokMenipis > 0 || u.piutang > 0) && (
              <div className="flex gap-1.5 mt-1.5">
                {u.stokMenipis > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold">{u.stokMenipis} stok tipis</span>}
                {u.piutang > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">piutang</span>}
              </div>
            )}
            </div>
          </div>
        ))}
        {/* Add unit button */}
        <button onClick={() => setShowAddForm(true)}
          className="premium-card p-4 border-2 border-dashed border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
          <Plus className="w-5 h-5 text-[#008CEB]" />
          <span className="text-xs font-heading font-bold text-[#008CEB]">Tambah Unit Usaha</span>
        </button>
      </div>

      {/* Add Unit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="premium-card p-5 w-full max-w-sm">
            <h3 className="text-sm font-heading font-extrabold mb-1">Tambah Unit Usaha</h3>
            <p className="text-[10px] text-slate-400 mb-4">Buat unit usaha baru untuk memisahkan pembukuan</p>
            <input type="text" value={newUnitName} onChange={e => setNewUnitName(e.target.value)}
              placeholder="Nama unit usaha (contoh: Cafe Kopi)" className="w-full input-premium text-xs mb-3" />
            <div className="flex gap-2">
              <button onClick={() => { setShowAddForm(false); setNewUnitName(""); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold">Batal</button>
              <button onClick={handleAddUnit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white text-xs font-bold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
