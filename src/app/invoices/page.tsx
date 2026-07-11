"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/engines/identity/auth-store";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { useOrderStore } from "@/engines/business/order-store";
import { Button } from "@/components/ui/button";
import { Search, Plus, FileText } from "lucide-react";

const TYPE_ICONS: Record<string, string> = {
  print: "📚", laptop: "💻", handphone: "📱", tiktok: "🎵", umum: "📄",
};

const TYPE_LABELS: Record<string, string> = {
  print: "Percetakan", laptop: "Laptop", handphone: "Handphone", tiktok: "TikTok", umum: "Umum",
};

const PAYMENT_STYLES: Record<string, string> = {
  "Belum Lunas": "bg-red-100/80 dark:bg-red-900/30 text-red-600",
  DP: "bg-amber-100/80 dark:bg-amber-900/30 text-amber-600",
  Lunas: "bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600",
  Batal: "bg-gray-100/80 dark:bg-gray-900/30 text-gray-600",
};

export default function InvoicesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { activeWorkspace, loadWorkspaces } = useWorkspaceStore();
  const { orders, isLoading: ordersLoading, loadOrders } = useOrderStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "Belum Lunas" | "DP" | "Lunas">("all");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadWorkspaces(user.id);
  }, [user, loadWorkspaces]);

  useEffect(() => {
    if (activeWorkspace) loadOrders(activeWorkspace.id);
  }, [activeWorkspace, loadOrders]);

  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== "all") list = list.filter((o) => o.paymentStatus === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          (o.customerName || "").toLowerCase().includes(q) ||
          (o.customerPhone || "").includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, filter, search]);

  const counts = useMemo(() => ({
    all: orders.length,
    "Belum Lunas": orders.filter((o) => o.paymentStatus === "Belum Lunas").length,
    DP: orders.filter((o) => o.paymentStatus === "DP").length,
    Lunas: orders.filter((o) => o.paymentStatus === "Lunas").length,
  }), [orders]);

  const filters = [
    { key: "all" as const, label: `Semua (${counts.all})` },
    { key: "Belum Lunas" as const, label: `Belum Lunas (${counts["Belum Lunas"]})` },
    { key: "DP" as const, label: `DP (${counts.DP})` },
    { key: "Lunas" as const, label: `Lunas (${counts.Lunas})` },
  ];

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Memuat...</p></div>;
  if (!user || !activeWorkspace) return null;

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Faktur</h1>
          <p className="text-sm text-muted-foreground/60">{orders.length} total faktur</p>
        </div>
        <Button onClick={() => router.push("/orders")}>
          <Plus className="size-4" /> Baru
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
        <input
          type="text"
          placeholder="Cari faktur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/50 border border-border/30 text-sm focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === f.key ? "bg-emerald-500 text-white shadow-sm" : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {ordersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
            <FileText className="size-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground/80 mb-1">
            {search ? "Tidak ditemukan" : "Belum ada faktur"}
          </p>
          <p className="text-xs text-muted-foreground/60 mb-4">
            {search ? "Coba kata kunci lain" : "Buat faktur pertama dari menu Pesanan"}
          </p>
          {!search && (
            <Button variant="outline" onClick={() => router.push("/orders")}>
              <Plus className="size-3.5" /> Buat Pesanan
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="floating-card p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
              onClick={() => router.push(`/invoices/${order.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{TYPE_ICONS[order.type] || "📄"}</span>
                  <div>
                    <p className="text-sm font-semibold">{order.number}</p>
                    <p className="text-[10px] text-muted-foreground/60">{TYPE_LABELS[order.type] || order.type}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${PAYMENT_STYLES[order.paymentStatus] || ""}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{order.customerName || order.customerId}</p>
                  <p className="text-[10px] text-muted-foreground/60">{new Date(order.date).toLocaleDateString("id-ID")}</p>
                </div>
                <p className="text-sm font-bold whitespace-nowrap ml-2">{activeWorkspace.currency} {order.total.toLocaleString()}</p>
              </div>
              {order.dp > 0 && order.paymentStatus !== "Lunas" && order.paymentStatus !== "Batal" && (
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className="text-muted-foreground/60">DP: {activeWorkspace.currency} {order.dp.toLocaleString()}</span>
                  <span className="text-red-500">Sisa: {activeWorkspace.currency} {order.remaining.toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
