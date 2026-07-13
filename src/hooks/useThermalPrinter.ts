"use client";

import { useState, useCallback } from "react";

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice: (options: { acceptAllDevices?: boolean; optionalServices?: string[] }) => Promise<any>;
    };
  }
}

interface PrinterData {
  namaToko: string;
  alamat: string;
  tanggal: string;
  nomorNota: string;
  items: { nama: string; qty: number; harga: number; total: number }[];
  total: number;
  dibayar: number;
  kembalian: number;
}

function escapeChars(s: string): string {
  return s.replace(/[\\\n\r]/g, "").substring(0, 200);
}

function buatESCString(data: PrinterData): Uint8Array {
  const lines: string[] = [];
  lines.push("\x1B\x61\x01"); // center
  lines.push(escapeChars(data.namaToko) + "\n");
  lines.push("\x1B\x61\x00"); // left
  lines.push(escapeChars(data.alamat) + "\n");
  lines.push("Tanggal: " + data.tanggal + "\n");
  lines.push("Nota: " + data.nomorNota + "\n");
  lines.push("--------------------------------\n");
  lines.push("\x1B\x45\x01"); // bold on
  lines.push("ITEM          QTY   HARGA   TOTAL\n");
  lines.push("\x1B\x45\x00"); // bold off
  lines.push("--------------------------------\n");
  for (const item of data.items) {
    const nama = escapeChars(item.nama).padEnd(14).slice(0, 14);
    const qty = String(item.qty).padStart(4);
    const harga = String(item.harga).padStart(8);
    const total = String(item.total).padStart(8);
    lines.push(`${nama}${qty}${harga}${total}\n`);
  }
  lines.push("--------------------------------\n");
  lines.push("\x1B\x45\x01");
  lines.push(`TOTAL: ${String(data.total).padStart(32)}\n`);
  lines.push("\x1B\x45\x00");
  lines.push(`Bayar: ${String(data.dibayar).padStart(31)}\n`);
  lines.push(`Kembali: ${String(data.kembalian).padStart(29)}\n`);
  lines.push("\n");
  lines.push("\x1B\x61\x01");
  lines.push("Terima kasih!\n");
  lines.push("\n\n\n");
  lines.push("\x1B\x69"); // cut
  const encoder = new TextEncoder();
  const parts = lines.map((l) => encoder.encode(l));
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}

export function useThermalPrinter() {
  const [connecting, setConnecting] = useState(false);
  const [device, setDevice] = useState<any | null>(null);

  const connect = useCallback(async () => {
    const bt = navigator.bluetooth;
    if (!bt) {
      throw new Error("Web Bluetooth tidak didukung di browser ini");
    }
    setConnecting(true);
    try {
      const d = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });
      setDevice(d);
      return d;
    } finally {
      setConnecting(false);
    }
  }, []);

  const print = useCallback(async (data: PrinterData) => {
    if (!device) throw new Error("Printer belum terhubung");
    const server = await device.gatt?.connect();
    if (!server) throw new Error("Gagal konek GATT");
    const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
    const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
    const payload = buatESCString(data);
    await characteristic.writeValue(payload);
  }, [device]);

  const disconnect = useCallback(() => {
    device?.gatt?.disconnect();
    setDevice(null);
  }, [device]);

  return { connect, print, disconnect, connecting, connected: !!device, device };
}
