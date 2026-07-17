"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, User, Building2, Home, LayoutGrid } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[390px] h-16 glass-pill rounded-full px-3 flex items-center justify-between shadow-2xl z-40 pb-safe transition-all duration-300">
      <Link href="/buku-global" className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <BarChart3 className={`w-5 h-5 ${isActive('/buku-global') ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] text-[#008CEB]' : ''}`} />
        <span className="text-[9px] mt-0.5">Global</span>
        {isActive('/buku-global') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-[#008CEB] rounded-full" />
        )}
      </Link>

      <Link href="/buku-pribadi" className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <User className={`w-5 h-5 ${isActive('/buku-pribadi') ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] text-[#008CEB]' : ''}`} />
        <span className="text-[9px] mt-0.5">Pribadi</span>
        {isActive('/buku-pribadi') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-[#008CEB] rounded-full" />
        )}
      </Link>

      <Link href="/buku-usaha/usaha" className="relative group">
        <motion.div
          whileTap={{ scale: 0.95 }}
          className={`h-11 px-5 rounded-full flex items-center gap-1.5 transition-all ${
            isActive('/buku-usaha')
              ? 'bg-[#008CEB] text-white font-extrabold shadow-lg shadow-[#008CEB]/30'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span className="text-xs font-bold tracking-tight">USAHA</span>
        </motion.div>
      </Link>

      <Link href="/buku-keluarga" className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <Home className={`w-5 h-5 ${isActive('/buku-keluarga') ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] text-rose-400' : ''}`} />
        <span className="text-[9px] mt-0.5">Keluarga</span>
        {isActive('/buku-keluarga') && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-rose-400 rounded-full" />
        )}
      </Link>

      <Link href="/buku-usaha" className="flex flex-col items-center justify-center w-12 h-12 text-zinc-400 hover:text-white transition-all duration-200 active:scale-90 relative">
        <LayoutGrid className={`w-5 h-5 ${pathname === '/buku-usaha' ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.4)] text-[#008CEB]' : ''}`} />
        <span className="text-[9px] mt-0.5">Beranda</span>
        {pathname === '/buku-usaha' && (
          <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1.5 h-1.5 bg-[#008CEB] rounded-full" />
        )}
      </Link>
    </div>
  );
}
