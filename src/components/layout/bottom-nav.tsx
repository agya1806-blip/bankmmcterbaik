"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const activeBranch = (params?.cabang as string) || '';

  const isActive = (path: string) => pathname === path;

  const getBranchUrl = (subPath: string) => {
    if (!activeBranch) return '/buku-usaha';
    return `/buku-usaha/${activeBranch}/${subPath}`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[390px] h-16 glass-pill rounded-full px-3 flex items-center justify-between shadow-2xl z-40 pb-safe transition-all duration-300">
      <Link href="/buku-global" className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <span className={`text-lg ${isActive('/buku-global') ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : ''}`}>⚙️</span>
        <span className="text-[9px] mt-0.5">Global</span>
        {isActive('/buku-global') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full" />
        )}
      </Link>

      <Link href={activeBranch ? `/buku-usaha/${activeBranch}` : '/buku-usaha'} className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <span className={`text-lg ${(pathname === `/buku-usaha/${activeBranch}` || pathname === '/buku-usaha') ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : ''}`}>🏠</span>
        <span className="text-[9px] mt-0.5">Beranda</span>
        {(pathname === `/buku-usaha/${activeBranch}` || pathname === '/buku-usaha') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full" />
        )}
      </Link>

      <Link href={getBranchUrl('kasir')} className="relative group">
        {activeBranch ? (
          <motion.div
            whileTap={{ scale: 0.95 }}
            className={`h-11 px-5 rounded-full flex items-center gap-1.5 transition-all ${
              pathname.includes('/kasir')
                ? 'bg-white text-slate-900 font-extrabold shadow-lg'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="text-sm">🛒</span>
            <span className="text-xs font-bold tracking-tight">KASIR</span>
          </motion.div>
        ) : (
          <div className="h-11 px-4 rounded-full flex items-center gap-1.5 bg-white/5 text-zinc-500 cursor-not-allowed">
            <span className="text-sm">🛒</span>
            <span className="text-xs font-bold">KASIR</span>
          </div>
        )}
      </Link>

      <Link href={getBranchUrl('transaksi')} className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <span className={`text-lg ${pathname.includes('/transaksi') ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : ''}`}>🧾</span>
        <span className="text-[9px] mt-0.5">Transaksi</span>
        {pathname.includes('/transaksi') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full" />
        )}
      </Link>

      <Link href={getBranchUrl('inventory')} className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <span className={`text-lg ${pathname.includes('/inventory') ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : ''}`}>📦</span>
        <span className="text-[9px] mt-0.5">Barang</span>
        {pathname.includes('/inventory') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full" />
        )}
      </Link>
    </div>
  );
}
