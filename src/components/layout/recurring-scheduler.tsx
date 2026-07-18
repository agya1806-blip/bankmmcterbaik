"use client";
import { useEffect } from "react";
import { db } from "@/lib/db-v4";

export default function RecurringScheduler() {
  useEffect(() => {
    const process = async () => {
      const now = new Date();
      const templates = await db.recurringTemplates
        .filter(t => t.isActive)
        .toArray();

      for (const tmpl of templates) {
        if (tmpl.endDate && now > new Date(tmpl.endDate)) continue;

        const lastGen = tmpl.lastGenerated ? new Date(tmpl.lastGenerated) : new Date(0);
        let shouldGenerate = false;

        switch (tmpl.frequency) {
          case "daily":
            shouldGenerate = daysBetween(lastGen, now) >= 1;
            break;
          case "weekly":
            shouldGenerate = daysBetween(lastGen, now) >= 7;
            break;
          case "monthly":
            shouldGenerate = monthsBetween(lastGen, now) >= 1;
            break;
          case "yearly":
            shouldGenerate = monthsBetween(lastGen, now) >= 12;
            break;
        }

        if (shouldGenerate) {
          const wallets = await db.wallets.where("unitId").equals(tmpl.unitId).toArray();
          const wallet = wallets.find(w => w.id === tmpl.walletId) || wallets[0];
          if (!wallet) continue;

          const saldoSebelum = wallet.saldo;
          const nominal = tmpl.jumlah;
          const saldoSesudah = tmpl.tipe === "pemasukan" ? saldoSebelum + nominal : saldoSebelum - nominal;

          await db.cashflows.add({
            id: crypto.randomUUID(),
            bookOrBranchId: tmpl.bookOrBranchId,
            unitId: tmpl.unitId,
            tipe: tmpl.tipe === "pemasukan" ? "masuk" : "keluar",
            kategori: tmpl.kategori || "Otomatis",
            nominal,
            saldoSebelum,
            saldoSesudah,
            walletId: wallet.id,
            walletNama: wallet.namaDompet,
            referensiId: tmpl.id,
            referensiTipe: "recurring",
            catatan: `[Otomatis] ${tmpl.nama} - ${tmpl.catatan || ""}`,
            createdAt: now.toISOString(),
          });

          await db.wallets.update(wallet.id, { saldo: saldoSesudah });
          await db.recurringTemplates.update(tmpl.id, { lastGenerated: now.toISOString() });
        }
      }
    };

    const interval = setInterval(process, 60 * 60 * 1000);
    setTimeout(process, 5000);

    return () => clearInterval(interval);
  }, []);

  return null;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
}
