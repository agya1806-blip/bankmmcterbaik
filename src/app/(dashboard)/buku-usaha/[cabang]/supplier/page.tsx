"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type UnitId, BRANCH_MAP } from "@/lib/db-v4";
import { showToast } from "@/lib/toast";
import { SupplierHeader } from "@/components/business/supplier/supplier-header";
import { SupplierSummaryCards } from "@/components/business/supplier/supplier-summary-cards";
import { SupplierToolbar } from "@/components/business/supplier/supplier-toolbar";
import { SupplierForm } from "@/components/business/supplier/supplier-form";
import { SupplierTable } from "@/components/business/supplier/supplier-table";
import { SupplierEmptyState } from "@/components/business/supplier/supplier-empty-state";
import { SupplierDetailDrawer } from "@/components/business/supplier/supplier-detail-drawer";
import { Skeleton } from "@/components/ui/skeleton";

export default function SupplierPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  const suppliers = useLiveQuery(
    () => db.suppliers.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  );
  const allPOs = useLiveQuery(
    () => db.purchaseOrders.where("bookOrBranchId").equals(bookOrBranchId).toArray(),
    [bookOrBranchId]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<typeof suppliers extends (infer U)[] ? U : null>(null);
  const [showForm, setShowForm] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<typeof suppliers extends (infer U)[] ? U : null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const isLoaded = suppliers !== undefined && allPOs !== undefined;
  const safeSuppliers = suppliers || [];
  const safePOs = allPOs || [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  /* ─── Derive per-supplier stats ─── */
  const supplierStats = useMemo(() => {
    const poBySupplier: Record<string, typeof safePOs> = {};
    for (const po of safePOs) {
      if (!poBySupplier[po.supplierId]) poBySupplier[po.supplierId] = [];
      poBySupplier[po.supplierId].push(po);
    }

    return safeSuppliers.map((s) => {
      const orders = poBySupplier[s.id] || [];
      const totalPembelian = orders.reduce((sum, o) => sum + o.total, 0);
      const totalHutang = orders.filter((o) => o.status === "diterima").reduce((sum, o) => sum + o.total, 0);
      const productNames = new Set<string>();
      for (const o of orders) {
        for (const item of o.items) productNames.add(item.namaItem);
      }
      const createdAt = new Date(s.createdAt);
      const isNew = createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
      const isActive = orders.length > 0;

      return {
        supplier: s,
        totalPembelian,
        totalHutang,
        jumlahProduk: productNames.size,
        jumlahPO: orders.length,
        status: isNew ? "baru" as const : isActive ? "aktif" as const : "tidak-aktif" as const,
        orders,
      };
    });
  }, [safeSuppliers, safePOs, currentMonth, currentYear]);

  /* ─── Summary cards ─── */
  const summaryData = useMemo(() => {
    const totalSupplier = supplierStats.length;
    const supplierAktif = supplierStats.filter((s) => s.status === "aktif" || s.status === "baru").length;
    const supplierBaru = supplierStats.filter((s) => s.status === "baru").length;
    const totalHutang = supplierStats.reduce((sum, s) => sum + s.totalHutang, 0);
    const sorted = [...supplierStats].sort((a, b) => b.jumlahPO - a.jumlahPO);
    const supplierFavorit = sorted.length > 0 && sorted[0].jumlahPO > 0 ? sorted[0].supplier.nama : "—";
    return { totalSupplier, supplierAktif, supplierBaru, totalHutang, supplierFavorit };
  }, [supplierStats]);

  /* ─── Search ─── */
  const filteredRows = useMemo(() => {
    if (!searchQuery) return supplierStats;
    const q = searchQuery.toLowerCase();
    return supplierStats.filter(
      (s) =>
        s.supplier.nama.toLowerCase().includes(q) ||
        s.supplier.kontak.toLowerCase().includes(q) ||
        s.supplier.alamat.toLowerCase().includes(q)
    );
  }, [supplierStats, searchQuery]);

  /* ─── Detail drawer products ─── */
  const detailProducts = useMemo(() => {
    if (!detailSupplier) return [];
    const orders = supplierStats.find((s) => s.supplier.id === detailSupplier.id)?.orders || [];
    const productMap = new Map<string, { namaItem: string; totalQty: number; totalHarga: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const existing = productMap.get(item.namaItem);
        if (existing) {
          existing.totalQty += item.qty;
          existing.totalHarga += item.subtotal;
        } else {
          productMap.set(item.namaItem, { namaItem: item.namaItem, totalQty: item.qty, totalHarga: item.subtotal });
        }
      }
    }
    return Array.from(productMap.values());
  }, [detailSupplier, supplierStats]);

  /* ─── CRUD ─── */
  const resetForm = () => {
    setEditingSupplier(null);
    setShowForm(false);
  };

  const handleSave = async (data: { nama: string; kontak: string; alamat: string; catatan: string }) => {
    if (!data.nama.trim()) return showToast.error("Nama supplier wajib diisi!");
    try {
      if (editingSupplier) {
        await db.suppliers.update(editingSupplier.id, data);
        showToast.success("Supplier berhasil diperbarui");
      } else {
        await db.suppliers.add({
          id: crypto.randomUUID(),
          bookOrBranchId,
          unitId: bookOrBranchId,
          ...data,
          createdAt: new Date().toISOString(),
        });
        showToast.success("Supplier berhasil ditambahkan");
      }
      resetForm();
    } catch {
      showToast.error("Gagal menyimpan supplier");
    }
  };

  const handleEdit = (s: typeof safeSuppliers[0]) => {
    setEditingSupplier(s);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus supplier ini? Semua data terkait tidak akan terhapus.")) return;
    try {
      await db.suppliers.delete(id);
      showToast.success("Supplier berhasil dihapus");
      if (editingSupplier?.id === id) resetForm();
    } catch {
      showToast.error("Gagal menghapus supplier");
    }
  };

  const handleDetail = (s: typeof safeSuppliers[0]) => {
    setDetailSupplier(s);
    setShowDrawer(true);
  };

  const handleCall = (kontak: string) => {
    const clean = kontak.replace(/[^0-9]/g, "");
    if (clean) window.open(`https://wa.me/${clean}`, "_blank");
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-4 pt-2 pb-4">
        <div className="h-10" />
        <Skeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      <SupplierHeader onBack={() => router.push(`/buku-usaha/${cabangSlug}`)} />

      <SupplierSummaryCards {...summaryData} />

      {showForm && (
        <SupplierForm
          editingSupplier={editingSupplier}
          onSave={handleSave}
          onCancel={resetForm}
        />
      )}

      <SupplierToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAdd={() => { resetForm(); setShowForm(true); }}
      />

      {filteredRows.length === 0 ? (
        <SupplierEmptyState
          isSearching={searchQuery.length > 0}
          onAdd={() => { resetForm(); setShowForm(true); }}
        />
      ) : (
        <SupplierTable
          rows={filteredRows}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDetail={handleDetail}
          onCall={handleCall}
        />
      )}

      <SupplierDetailDrawer
        open={showDrawer}
        supplier={detailSupplier}
        orders={supplierStats.find((s) => s.supplier.id === detailSupplier?.id)?.orders || []}
        products={detailProducts}
        onClose={() => setShowDrawer(false)}
        onCall={handleCall}
        onEdit={(s) => { setShowDrawer(false); handleEdit(s); }}
        onDelete={handleDelete}
      />
    </div>
  );
}
