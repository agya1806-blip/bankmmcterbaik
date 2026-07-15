"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Plus, Trash2, Save, Zap, X } from "lucide-react";
import toast from "react-hot-toast";
import { useBusinessStore, type BizUnit } from "@/store/useBusinessStore";

const UNITS: { id: BizUnit; label: string }[] = [
  { id: "percetakan", label: "Percetakan" },
  { id: "gadget", label: "Gadget" },
  { id: "laptop", label: "Laptop" },
  { id: "kedai_kopi", label: "Warkop" },
  { id: "konveksi", label: "Konveksi" },
];

export default function TemplateCepatPage() {
  const router = useRouter();
  const quickOrders = useBusinessStore((s) => s.quickOrders);
  const addQuickOrder = useBusinessStore((s) => s.addQuickOrder);
  const deleteQuickOrder = useBusinessStore((s) => s.deleteQuickOrder);
  const [activeUnit, setActiveUnit] = useState<BizUnit>("percetakan");
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [items, setItems] = useState<{ desc: string; price: number }[]>([{ desc: "", price: 0 }]);

  const filtered = quickOrders.filter((q) => q.unit === activeUnit);

  const addItemField = () => setItems((prev) => [...prev, { desc: "", price: 0 }]);
  const removeItemField = (i: number) => setItems((prev) => prev.filter((_, j) => j !== i));
  const updateItem = (i: number, field: "desc" | "price", value: string) => {
    setItems((prev) => prev.map((item, j) =>
      j === i ? { ...item, [field]: field === "price" ? parseInt(value.replace(/\D/g, ""), 10) || 0 : value } : item
    ));
  };

  const handleSave = () => {
    if (!label.trim()) { toast.error("Nama template harus diisi"); return; }
    const validItems = items.filter((i) => i.desc.trim() && i.price > 0);
    if (validItems.length === 0) { toast.error("Minimal 1 item dengan harga"); return; }
    addQuickOrder({ unit: activeUnit, label: label.trim(), items: validItems });
    toast.success(`Template "${label}" tersimpan`);
    setLabel("");
    setItems([{ desc: "", price: 0 }]);
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16]">
      <div className="max-w-2xl mx-auto pb-24 space-y-4 px-3 sm:px-0 pt-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/buku-usaha")} className="size-9 rounded-xl bg-white dark:bg-slate-800/80 flex items-center justify-center border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700">
              <ArrowLeft className="size-4 text-slate-500 dark:text-slate-300" />
            </button>
            <div className="size-10 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center shadow-lg shadow-[#7B61FF]/20">
              <Zap className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold font-heading text-slate-900 dark:text-white">Template Cepat</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Pesanan sering dalam 1 klik</p>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-gradient size-10 rounded-xl">
            <Plus className="size-4" />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {UNITS.map((u) => (
            <button key={u.id} onClick={() => { setActiveUnit(u.id); setShowAdd(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeUnit === u.id
                  ? "bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white"
                  : "bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400"
              }`}>
              {u.label}
            </button>
          ))}
        </div>

        {showAdd && (
          <div className="premium-card p-4 space-y-3 bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Tambah Template Baru</p>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Nama template, e.g. Fotoropia A4 50 lbr" className="w-full h-10 px-3 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30" />
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={item.desc} onChange={(e) => updateItem(i, "desc", e.target.value)}
                    placeholder="Nama item" className="flex-1 h-9 px-2.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30" />
                  <input type="text" inputMode="numeric" value={item.price || ""} onChange={(e) => updateItem(i, "price", e.target.value)}
                    placeholder="Harga" className="w-24 h-9 px-2.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/30 tabular-nums" />
                  {items.length > 1 && (
                    <button onClick={() => removeItemField(i)} className="size-7 rounded-lg bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20 shrink-0">
                      <X className="size-3 text-rose-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={addItemField} className="flex-1 h-9 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                + Tambah Item
              </button>
              <button onClick={handleSave} className="btn-gradient h-9 px-4 rounded-xl text-xs gap-1">
                <Save className="size-3.5" /> Simpan
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="premium-card p-12 text-center bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
            <Package className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Belum ada template</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Simpan pesanan sering sebagai template cepat</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((q) => (
              <div key={q.id} className="premium-card p-4 bg-white/90 backdrop-blur-md dark:bg-[#131527]/90 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{q.label}</p>
                  <button onClick={() => { deleteQuickOrder(q.id); toast.success("Template dihapus"); }}
                    className="size-7 rounded-lg bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20">
                    <Trash2 className="size-3 text-rose-500" />
                  </button>
                </div>
                <div className="space-y-1">
                  {q.items.map((item: { desc: string; price: number }, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">{item.desc}</span>
                      <span className="font-medium text-slate-900 dark:text-white tabular-nums">Rp {item.price.toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-bold border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-2">
                  <span className="text-slate-500 dark:text-slate-400">Total</span>
                  <span className="text-[#FF5C00] tabular-nums">Rp {q.items.reduce((s: number, i: { price: number }) => s + i.price, 0).toLocaleString("id-ID")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
