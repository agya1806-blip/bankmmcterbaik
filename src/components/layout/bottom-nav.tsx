"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Settings, ShoppingBag, FolderGit2, Receipt } from 'lucide-react';
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
      {/* 1. Global Settings */}
      <Link href="/buku-global" className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <Settings className={`w-5 h-5 ${isActive('/buku-global') ? 'text-indigo-400' : ''}`} />
        <span className="text-[9px] mt-0.5">Global</span>
        {isActive('/buku-global') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        )}
      </Link>

      {/* 2. Main Dashboard Unit Bisnis */}
      <Link href={activeBranch ? `/buku-usaha/${activeBranch}` : '/buku-usaha'} className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <Home className={`w-5 h-5 ${pathname === `/buku-usaha/${activeBranch}` || pathname === '/buku-usaha' ? 'text-indigo-400' : ''}`} />
        <span className="text-[9px] mt-0.5">Beranda</span>
        {(pathname === `/buku-usaha/${activeBranch}` || pathname === '/buku-usaha') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        )}
      </Link>

      {/* 3. Kasir POS Pill */}
      <Link href={getBranchUrl('kasir')} className="relative group">
        {activeBranch ? (
          <motion.div
            whileTap={{ scale: 0.95 }}
            className={`h-11 px-5 rounded-full flex items-center gap-1.5 transition-all ${
              pathname.includes('/kasir')
                ? 'bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white font-extrabold shadow-lg shadow-indigo-500/20'
                : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-bold tracking-tight">KASIR</span>
          </motion.div>
        ) : (
          <div className="h-11 px-4 rounded-full flex items-center gap-1.5 bg-zinc-800 text-zinc-500 cursor-not-allowed">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-bold">KASIR</span>
          </div>
        )}
      </Link>

      {/* 4. Riwayat Transaksi */}
      <Link href={getBranchUrl('transaksi')} className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <Receipt className={`w-5 h-5 ${pathname.includes('/transaksi') ? 'text-indigo-400' : ''}`} />
        <span className="text-[9px] mt-0.5">Transaksi</span>
        {pathname.includes('/transaksi') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        )}
      </Link>

      {/* 5. Inventory */}
      <Link href={getBranchUrl('inventory')} className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <FolderGit2 className={`w-5 h-5 ${pathname.includes('/inventory') ? 'text-indigo-400' : ''}`} />
        <span className="text-[9px] mt-0.5">Barang</span>
        {pathname.includes('/inventory') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
        )}
      </Link>
    </div>
  );
}
