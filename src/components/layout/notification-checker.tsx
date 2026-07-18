"use client";
import { useEffect } from "react";
import { db } from "@/lib/db-v4";
import { requestNotificationPermission, showPiutangReminder, showStockAlert } from "@/lib/notification";

export default function NotificationChecker() {
  useEffect(() => {
    requestNotificationPermission();

    const check = async () => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const cutoff = threeDaysFromNow.toISOString();

      const duePiutang = await db.piutang
        .where("status").equals("AKTIF")
        .filter(p => p.jatuhTempo <= cutoff)
        .toArray();

      if (duePiutang.length > 0) {
        const total = duePiutang.reduce((s, p) => s + p.sisaPiutang, 0);
        showPiutangReminder(duePiutang.length, total);
      }

      const allInventory = await db.inventory.toArray();
      const lowStock = allInventory
        .filter(i => i.stok <= i.stokMin && i.stokMin > 0)
        .map(i => ({ nama: i.nama, stok: i.stok }));

      if (lowStock.length > 0) {
        showStockAlert(lowStock.slice(0, 5));
      }
    };

    const initialTimeout = setTimeout(check, 3000);
    const interval = setInterval(check, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return null;
}
