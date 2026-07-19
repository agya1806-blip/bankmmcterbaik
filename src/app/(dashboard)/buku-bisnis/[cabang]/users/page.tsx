"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "@/hooks/useLiveQuery";
import { db, type UnitId, type UserRole, BRANCH_MAP, BRANCH_LABELS } from "@/lib/db-v4";
import { useSessionStore } from "@/store/useSessionStore";
import { hashPin } from "@/lib/crypto";
import { showToast } from "@/lib/toast";
import {
  ArrowLeft, Users, Plus, Pencil, Trash2, X, Shield,
  UserCog, UserPlus, Calendar, AlertTriangle,
  ShieldCheck, ShieldHalf, Eye,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: "Admin", color: "text-[#008CEB] bg-[#008CEB]/10", icon: <ShieldCheck className="w-3 h-3" /> },
  kasir: { label: "Kasir", color: "text-emerald-500 bg-emerald-500/10", icon: <ShieldHalf className="w-3 h-3" /> },
  viewer: { label: "Viewer", color: "text-amber-500 bg-amber-500/10", icon: <Eye className="w-3 h-3" /> },
};

export default function UsersPage() {
  return <RoleGuard requiredRole="admin"><UsersPageContent /></RoleGuard>;
}

function UsersPageContent() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useSessionStore();
  const cabangSlug = (params?.cabang as string) || "";
  const bookOrBranchId: UnitId = BRANCH_MAP[cabangSlug] || "usaha-warkop";

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      showToast.error("Hanya admin yang bisa mengakses halaman ini");
      router.back();
    }
  }, [currentUser, router]);

  const allUsers = useLiveQuery(() => db.users.toArray(), []) || [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<UserRole>("kasir");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = () => {
    setNama("");
    setRole("kasir");
    setPin("");
    setPinConfirm("");
    setShowForm(false);
  };

  const handleAdd = async () => {
    const trimmedNama = nama.trim();
    if (!trimmedNama) { showToast.error("Nama harus diisi"); return; }
    if (trimmedNama.length < 2) { showToast.error("Nama minimal 2 karakter"); return; }
    if (pin.length < 4) { showToast.error("PIN minimal 4 digit"); return; }
    if (pin !== pinConfirm) { showToast.error("PIN tidak cocok"); return; }
    setSaving(true);
    try {
      const existing = await db.users.where("nama").equals(trimmedNama).first();
      if (existing) { showToast.error("Nama pengguna sudah ada"); setSaving(false); return; }
      const pinHash = await hashPin(pin);
      await db.users.add({
        id: crypto.randomUUID(),
        bookOrBranchId,
        nama: trimmedNama,
        pinHash,
        fotoUrl: "",
        role,
        allowedUnits: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      showToast.success("Pengguna berhasil ditambahkan");
      resetForm();
    } catch {
      showToast.error("Gagal menambah pengguna");
    } finally {
      setSaving(false);
    }
  };

  const handleEditRole = async (userId: string, newRole: UserRole) => {
    try {
      await db.users.update(userId, { role: newRole });
      showToast.success("Role berhasil diperbarui");
      setEditingId(null);
    } catch {
      showToast.error("Gagal memperbarui role");
    }
  };

  const handleDelete = async (userId: string) => {
    if (currentUser && userId === currentUser.id) return;
    try {
      await db.users.delete(userId);
      showToast.success("Pengguna berhasil dihapus");
      setDeleteConfirm(null);
    } catch {
      showToast.error("Gagal menghapus pengguna");
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/buku-bisnis/${cabangSlug}`)} className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 justify-center">
            <Users className="w-5 h-5 text-[#008CEB]" />
            Pengguna
          </h1>
          <p className="text-[9px] text-slate-400 capitalize">{BRANCH_LABELS[cabangSlug] || cabangSlug}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="p-2 bg-[#008CEB] rounded-full shadow-md active:scale-95 transition-transform text-white">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Add Form ─── */}
      {showForm && (
        <div className="premium-card p-4 border-[#008CEB]/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#008CEB]/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#008CEB]" />
            </div>
            <span className="text-xs font-heading font-extrabold">Tambah Pengguna</span>
            <button onClick={resetForm} className="ml-auto p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1"><UserCog className="w-3 h-3" /> Nama</label>
              <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama pengguna" className="w-full input-premium" />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1"><Shield className="w-3 h-3" /> Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full input-premium">
                <option value="admin">Admin</option>
                <option value="kasir">Kasir</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1">PIN</label>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Masukkan PIN" maxLength={6} className="w-full input-premium" />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1">Konfirmasi PIN</label>
              <input type="password" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)} placeholder="Ulangi PIN" maxLength={6} className="w-full input-premium" />
            </div>
            <button onClick={handleAdd} disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#008CEB] to-[#00C9A7] text-white font-bold text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50">
              <UserPlus className="w-4 h-4" /> {saving ? "Menyimpan..." : "Tambah Pengguna"}
            </button>
          </div>
        </div>
      )}

      {/* ─── User List ─── */}
      <div className="space-y-2">
        {allUsers.length === 0 ? (
          <div className="premium-card p-8 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">Belum ada pengguna</p>
            <p className="text-[9px] text-slate-400 mt-1">Tambahkan pengguna pertama</p>
          </div>
        ) : (
          allUsers.map((user) => {
            const cfg = ROLE_CONFIG[user.role];
            const isSelf = currentUser?.id === user.id;
            const isEditing = editingId === user.id;
            return (
              <div key={user.id} className="premium-card p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008CEB] to-[#00C9A7] flex items-center justify-center text-white font-heading font-extrabold text-sm shrink-0">
                    {user.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-heading font-bold truncate">{user.nama}</p>
                      {isSelf && <span className="text-[8px] text-[#008CEB] bg-[#008CEB]/10 px-1.5 py-0.5 rounded-full font-bold">ANDA</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="text-[8px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  {!isSelf && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingId(isEditing ? null : user.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => setDeleteConfirm(user.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ─── Inline Edit Role ─── */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <label className="text-[9px] text-slate-400 font-bold uppercase shrink-0">Role:</label>
                      <select
                        value={user.role}
                        onChange={(e) => handleEditRole(user.id, e.target.value as UserRole)}
                        className="input-premium text-xs py-1.5 flex-1"
                      >
                        <option value="admin">Admin</option>
                        <option value="kasir">Kasir</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button onClick={() => setEditingId(null)}
                        className="text-[10px] text-slate-400 font-bold px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── Delete Confirmation ─── */}
                {deleteConfirm === user.id && (
                  <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-900/40">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Hapus pengguna &ldquo;{user.nama}&rdquo;?</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold">Batal</button>
                      <button onClick={() => handleDelete(user.id)}
                        className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer Info ─── */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 mb-1">
          <Shield className="w-3 h-3" />
          {allUsers.length} pengguna terdaftar
        </div>
        <p className="text-[8px] text-slate-300">MMCBANK v4 • {cabangSlug}</p>
      </div>
    </div>
  );
}
