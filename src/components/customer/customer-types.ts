"use client";

import type { Customer, DbPiutang, DbPiutangInstallment, DbTransaction } from "@/lib/db-v4";

export type { Customer, DbPiutang, DbPiutangInstallment, DbTransaction };

export interface ParsedContact {
  nama: string;
  noWA: string;
}

export type CustomerStatus = "semua" | "aktif" | "tidak-aktif" | "memiliki-piutang";