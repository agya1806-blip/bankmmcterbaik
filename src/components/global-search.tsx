"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db-v4";
import { Search, SearchX, User, Receipt, Package, ArrowRight } from "lucide-react";

const BRANCH_ROUTE_MAP: Record<string, string> = {
  "usaha-percetakan": "percetakan",
  "usaha-laptop": "laptop",
  "usaha-gadget": "gadget",
  "usaha-warkop": "warkop",
  "usaha-kelontong": "kelontong",
  "usaha-konveksi": "konveksi",
  "usaha-toko-pakaian": "toko-pakaian",
};

function branchRoute(id: string): string {
  return BRANCH_ROUTE_MAP[id] ?? id.replace("usaha-", "");
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ResultGroup = {
  type: "Pelanggan" | "Transaksi" | "Produk";
  icon: React.ElementType;
  items: {
    id: string;
    label: string;
    subtitle: string;
    branchId?: string;
    onClick: () => void;
  }[];
};

export default function GlobalSearch({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const lower = trimmed.toLowerCase();

    const [allCustomers, allTransactions, allProducts] = await Promise.all([
      db.customers.toArray(),
      db.transactions.toArray(),
      db.inventory.toArray(),
    ]);

    const matchedCustomers = allCustomers
      .filter(
        (c) =>
          c.nama.toLowerCase().includes(lower) ||
          (c.noWA && c.noWA.includes(trimmed))
      )
      .slice(0, 5);

    const matchedTransactions = allTransactions
      .filter(
        (t) =>
          t.invoiceNumber.toLowerCase().includes(lower) ||
          t.customerNama.toLowerCase().includes(lower)
      )
      .slice(0, 5);

    const matchedProducts = allProducts
      .filter(
        (p) =>
          p.nama.toLowerCase().includes(lower) ||
          p.sku.toLowerCase().includes(lower) ||
          p.kategori.toLowerCase().includes(lower)
      )
      .slice(0, 5);

    const groups: ResultGroup[] = [];

    if (matchedCustomers.length > 0) {
      groups.push({
        type: "Pelanggan",
        icon: User,
        items: matchedCustomers.map((c) => ({
          id: c.id,
          label: c.nama,
          subtitle: c.noWA ? `WA: ${c.noWA}` : `${c.totalTransaksi} transaksi`,
          onClick: () => {
            onClose();
            router.push("/buku-usaha/pelanggan");
          },
        })),
      });
    }

    if (matchedTransactions.length > 0) {
      groups.push({
        type: "Transaksi",
        icon: Receipt,
        items: matchedTransactions.map((t) => {
          const branch = branchRoute(t.bookOrBranchId);
          return {
            id: t.id,
            label: `${t.invoiceNumber} — ${t.customerNama}`,
            subtitle: `Rp ${t.totalBruto.toLocaleString("id-ID")} • ${t.status}`,
            onClick: () => {
              onClose();
              router.push(`/buku-usaha/${branch}/kasir`);
            },
          };
        }),
      });
    }

    if (matchedProducts.length > 0) {
      groups.push({
        type: "Produk",
        icon: Package,
        items: matchedProducts.map((p) => ({
          id: p.id,
          label: p.nama,
          subtitle: `Stok: ${p.stok} ${p.satuan} • Rp ${p.hargaJual.toLocaleString("id-ID")}`,
          onClick: () => {
            onClose();
            router.push("/buku-usaha/inventory");
          },
        })),
      });
    }

    setResults(groups);
    setLoading(false);
  }, [router, onClose]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isOpen) return;
    timerRef.current = setTimeout(() => performSearch(query), 300);
  }, [query, isOpen, performSearch]);

  const hasResults = results.some((g) => g.items.length > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--card)]/95 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-2xl max-h-[70vh] flex flex-col overflow-hidden">
        <div className="p-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari pelanggan, transaksi, atau produk..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="size-5 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60 animate-spin" />
            </div>
          ) : !hasResults && query.trim() ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground/60">
              <SearchX className="size-8" />
              <p className="text-sm">Tidak ada hasil</p>
            </div>
          ) : !query.trim() ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground/40">
              <Search className="size-8" />
              <p className="text-sm">Ketik untuk mencari</p>
            </div>
          ) : (
            results.map((group) => (
              <div key={group.type}>
                <div className="flex items-center gap-2 mb-2">
                  <group.icon className="size-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-semibold text-muted-foreground/50 tracking-wider uppercase">
                    {group.type}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left active:scale-[0.98]"
                    >
                      <div className="size-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        <group.icon className="size-4 text-muted-foreground/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground/30 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
