"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type BookOrBranch, type Customer } from '@/lib/db-v4';
import { ArrowLeft, UserPlus, Phone, MessageSquare, Search, DollarSign } from 'lucide-react';

const BRANCH_MAP: Record<string, BookOrBranch> = {
  percetakan: 'usaha-percetakan',
  laptop: 'usaha-laptop',
  gadget: 'usaha-gadget',
  warkop: 'usaha-warkop',
  konveksi: 'usaha-konveksi',
};

export default function PelangganCRMPage() {
  const params = useParams();
  const router = useRouter();
  const cabangSlug = (params?.cabang as string) || '';
  const bookOrBranchId = BRANCH_MAP[cabangSlug] || 'usaha-percetakan';

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [promoMessage, setPromoMessage] = useState(
    'Halo [Nama], dapatkan penawaran spesial minggu ini hanya di toko kami!'
  );

  const customers =
    useLiveQuery(
      () => db.customers.where('bookOrBranchId').equals(bookOrBranchId).toArray(),
      [bookOrBranchId]
    ) || [];

  const filteredCustomers = customers.filter(
    (c) =>
      c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.noWA.includes(searchQuery)
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return alert('Nama dan nomor HP wajib diisi!');

    const formattedPhone = phone.replace(/[^0-9+]/g, '');

    await db.customers.add({
      id: crypto.randomUUID(),
      bookOrBranchId,
      nama: name,
      noWA: formattedPhone,
      totalTransaksi: 0,
      totalBelanja: 0,
      poin: 0,
      terakhirTransaksi: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    setName('');
    setPhone('');
    setShowAddModal(false);
  };

  const handleBroadcast = (customer: Customer) => {
    const personalizedMessage = promoMessage.replace('[Nama]', customer.nama);
    const phoneClean = customer.noWA.replace(/[^0-9]/g, '');
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(personalizedMessage)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/buku-usaha/${cabangSlug}`)}
          className="p-2 bg-white dark:bg-[#131527] rounded-full shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight capitalize">CRM Pelanggan</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-[#7B61FF] text-white rounded-full shadow-md hover:scale-105 transition-transform"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama atau nomor HP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#7B61FF]"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-1">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">Belum ada data pelanggan.</div>
        ) : (
          filteredCustomers.map((c, i) => (
            <div
              key={c.id}
              onClick={() => setSelectedCustomer(selectedCustomer?.id === c.id ? null : c)}
              className={`premium-card premium-card-glow p-4 cursor-pointer transition-all duration-200 animate-slide-up ${
                selectedCustomer?.id === c.id ? 'border-[#7B61FF] ring-1 ring-[#7B61FF]/30' : ''
              }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#FF5C00] flex items-center justify-center text-white text-xs font-extrabold shadow-md">
                    {c.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-heading font-extrabold">{c.nama}</h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {c.noWA}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Total Belanja</span>
                  <p className="text-xs font-heading font-extrabold text-[#FF5C00] flex items-center gap-1 justify-end">
                    <DollarSign className="w-3 h-3" /> Rp{c.totalBelanja.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedCustomer?.id === c.id && (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBroadcast(c);
                    }}
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-[10px] hover:bg-emerald-600 active:scale-[0.97] transition-all duration-200"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Kirim WA Promosi
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedCustomer && (
        <div className="premium-card p-4 space-y-3 border-[#7B61FF]/40">
          <h3 className="text-xs font-extrabold text-indigo-500">
            Kirim Promosi ke: {selectedCustomer.nama}
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoMessage}
              onChange={(e) => setPromoMessage(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-100 dark:bg-zinc-900 rounded-xl outline-none"
            />
            <button
              onClick={() => handleBroadcast(selectedCustomer)}
              className="px-3 py-1.5 bg-[#7B61FF] text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Kirim
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCustomer}
            className="bg-white dark:bg-[#131527] w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-xl"
          >
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
              Daftarkan Pelanggan Baru
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  No. HP / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 62812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-zinc-900 rounded-xl border-none outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl"
              >
                Batal
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-[#7B61FF] text-white rounded-xl">
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
