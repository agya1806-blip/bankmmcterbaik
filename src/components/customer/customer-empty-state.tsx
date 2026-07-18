"use client";
import React from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

interface CustomerEmptyStateProps {
  onAdd: () => void;
  hasFilter?: boolean;
}

export function CustomerEmptyState({ onAdd, hasFilter }: CustomerEmptyStateProps) {
  if (hasFilter) {
    return (
      <EmptyState
        icon={<Users className="w-7 h-7" />}
        title="Tidak ada hasil"
        description="Coba ubah kata kunci atau filter pencarian"
      />
    );
  }
  return (
    <EmptyState
      icon={<Users className="w-7 h-7" />}
      title="Belum ada data pelanggan"
      description="Tambahkan pelanggan pertama Anda"
      action={<Button variant="primary" size="sm" onClick={onAdd}>Tambah Pelanggan</Button>}
    />
  );
}