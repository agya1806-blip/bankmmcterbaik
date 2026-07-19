"use client";
import React from "react";
import { ArrowLeft, Download, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CustomerHeaderProps {
  cabangSlug: string;
  onImport: () => void;
  onAdd: () => void;
}

export function CustomerHeader({ cabangSlug, onImport, onAdd }: CustomerHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="icon-sm" onClick={() => router.push(`/buku-bisnis/${cabangSlug}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-extrabold tracking-tight">CRM Pelanggan</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={onImport} title="Impor dari file">
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="primary" size="icon-sm" onClick={onAdd} title="Tambah pelanggan">
          <UserPlus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}