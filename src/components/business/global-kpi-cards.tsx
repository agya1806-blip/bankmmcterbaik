"use client";

import React from "react";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CreditCard } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

interface Props {
  dashData: {
    totalPendapatan: number;
    labaBersih: number;
    cashflowMasuk: number;
    cashflowKeluar: number;
    totalPiutang: number;
    piutangAktifCount: number;
    stokMenipisCount: number;
    stokHabisCount: number;
    totalTransaksi: number;
    totalPelanggan: number;
    totalProduk: number;
    totalCabang: number;
    perBranch: Array<{
      branch: string;
      label: string;
      pendapatan: number;
      labaBersih: number;
      cashMasuk: number;
      cashKeluar: number;
      piutang: number;
      jumlahProduk: number;
      stokMenipis: number;
      jumlahTransaksi: number;
    }>;
  };
  last7Days: Array<{ date: string; pemasukan: number; pengeluaran: number }>;
  branchRevenue: Array<{ name: string; revenue: number }>;
}

export default function GlobalKpiCards({ dashData, last7Days, branchRevenue }: Props) {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid grid-cols-2 gap-2">
        <div className="premium-card p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span className="text-sm text-emerald-500"><DollarSign className="w-5 h-5" /></span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase">Pendapatan</span>
          </div>
          <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">Rp{dashData.totalPendapatan.toLocaleString()}</p>
        </div>
        <div className="premium-card p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dashData.labaBersih >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"}`}>
              {dashData.labaBersih >= 0 ? <span className="text-sm text-emerald-500"><TrendingUp className="w-5 h-5" /></span> : <span className="text-sm text-rose-500"><TrendingDown className="w-5 h-5" /></span>}
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase">Laba Bersih</span>
          </div>
          <p className={`text-sm font-extrabold ${dashData.labaBersih >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            Rp{dashData.labaBersih.toLocaleString()}
          </p>
        </div>
        <div className="premium-card p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-sm text-amber-500"><CreditCard className="w-5 h-5" /></span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase">Piutang</span>
          </div>
          <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">Rp{dashData.totalPiutang.toLocaleString()}</p>
          <p className="text-[9px] text-slate-400">{dashData.piutangAktifCount} aktif</p>
        </div>
        <div className="premium-card p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <span className="text-sm text-rose-500"><AlertTriangle className="w-5 h-5" /></span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase">Stok Alert</span>
          </div>
          <p className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{dashData.stokMenipisCount + dashData.stokHabisCount}</p>
          <p className="text-[9px] text-slate-400">{dashData.stokMenipisCount} tipis, {dashData.stokHabisCount} habis</p>
        </div>
      </div>

      <div className="premium-card p-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cashflow Global</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-slate-400">Masuk</span>
            </div>
            <p className="text-xs font-extrabold text-emerald-500">Rp{dashData.cashflowMasuk.toLocaleString()}</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[9px] text-slate-400">Keluar</span>
            </div>
            <p className="text-xs font-extrabold text-rose-500">Rp{dashData.cashflowKeluar.toLocaleString()}</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#008CEB]" />
              <span className="text-[9px] text-slate-400">Saldo</span>
            </div>
            <p className={`text-xs font-extrabold ${dashData.cashflowMasuk - dashData.cashflowKeluar >= 0 ? "text-[#008CEB]" : "text-rose-500"}`}>
              Rp{(dashData.cashflowMasuk - dashData.cashflowKeluar).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="premium-card p-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Total</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-sm font-extrabold text-[#008CEB]">{dashData.totalTransaksi}</p>
            <span className="text-[8px] text-slate-400">Transaksi</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-emerald-500">{dashData.totalPelanggan}</p>
            <span className="text-[8px] text-slate-400">Pelanggan</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-amber-500">{dashData.totalProduk}</p>
            <span className="text-[8px] text-slate-400">Produk</span>
          </div>
          <div>
            <p className="text-sm font-extrabold text-orange-500">{dashData.totalCabang}</p>
            <span className="text-[8px] text-slate-400">Cabang</span>
          </div>
        </div>
      </div>

      <div className="premium-card p-3 space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase">Per Cabang</h3>
        <div className="space-y-2">
          {dashData.perBranch.map((b) => (
            <div key={b.branch} className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/50 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold">{b.label}</span>
                <span className="text-[9px] font-bold text-[#008CEB]">Rp{b.pendapatan.toLocaleString()}</span>
              </div>
              <div className="flex gap-3 text-[9px]">
                <span className="text-emerald-500">+Rp{b.cashMasuk.toLocaleString()}</span>
                <span className="text-rose-500">-Rp{b.cashKeluar.toLocaleString()}</span>
                {b.piutang > 0 && <span className="text-amber-500">Piutang: Rp{b.piutang.toLocaleString()}</span>}
              </div>
              <div className="flex gap-3 text-[9px] text-slate-400">
                <span>{b.jumlahTransaksi} tx</span>
                <span>{b.jumlahProduk} produk</span>
                {b.stokMenipis > 0 && <span className="text-amber-500">{b.stokMenipis} stok tipis</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1b2e] rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">Grafik 7 Hari</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={last7Days}>
            <defs>
              <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="pemasukan" stroke="#10b981" fill="url(#colorPemasukan)" name="Pemasukan" />
            <Area type="monotone" dataKey="pengeluaran" stroke="#ef4444" fill="url(#colorPengeluaran)" name="Pengeluaran" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-[#1a1b2e] rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm mb-3">Pendapatan per Cabang</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={branchRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#7B61FF" radius={[4, 4, 0, 0]} name="Pendapatan" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
