"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User, Smartphone } from "lucide-react";

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { nama: string; noWA: string; alamat?: string }) => Promise<void> | void;
  title: string;
  initialData?: { nama: string; noWA: string; alamat?: string };
}

export function CustomerForm({ open, onClose, onSubmit, title, initialData }: CustomerFormProps) {
  const [nama, setNama] = useState("");
  const [noWA, setNoWA] = useState("");
  const [alamat, setAlamat] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNama(initialData?.nama || "");
      setNoWA(initialData?.noWA || "");
      setAlamat(initialData?.alamat || "");
      setLoading(false);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !noWA.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ nama: nama.trim(), noWA: noWA.trim(), alamat: alamat.trim() || undefined });
      onClose();
    } catch {
      // error handled by caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={loading}>
            Simpan
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Nama Pelanggan"
          placeholder="Contoh: Budi"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          icon={<User className="w-4 h-4" />}
          required
        />
        <Input
          label="No. HP / WhatsApp"
          placeholder="Contoh: 62812345678"
          value={noWA}
          onChange={(e) => setNoWA(e.target.value)}
          icon={<Smartphone className="w-4 h-4" />}
          required
        />
        {initialData && (
          <Textarea
            label="Alamat"
            placeholder="Alamat pelanggan (opsional)"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            rows={2}
          />
        )}
      </form>
    </Modal>
  );
}