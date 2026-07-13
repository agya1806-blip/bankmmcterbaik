"use client";

import { useState, useCallback } from "react";

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice: (options: {
        acceptAllDevices?: boolean;
        optionalServices?: string[];
        filters?: { name?: string; namePrefix?: string; services?: string[] }[];
      }) => Promise<BluetoothDevice>;
    };
  }
  interface BluetoothDevice {
    gatt?: BluetoothRemoteGATTServer;
    name?: string;
    id: string;
  }
  interface BluetoothRemoteGATTServer {
    connect: () => Promise<BluetoothRemoteGATTServer>;
    disconnect: () => void;
    getPrimaryService: (uuid: string) => Promise<BluetoothRemoteGATTService>;
    connected: boolean;
  }
  interface BluetoothRemoteGATTService {
    getCharacteristic: (uuid: string) => Promise<BluetoothRemoteGATTCharacteristic>;
  }
  interface BluetoothRemoteGATTCharacteristic {
    writeValue: (value: BufferSource) => Promise<void>;
  }
}

/* ─── Tipe Data Transaksi dari /orders ─── */

export interface OrderPrintData {
  toko: string;
  alamat: string;
  tanggal: string;
  nomorNota: string;
  pelanggan: string;
  items: { deskripsi: string; qty: number; harga: number; total: number }[];
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  catatan?: string;
}

/* ─── ESC/POS Command Builder ─── */

const ESC = "\x1B";
const GS = "\x1D";

const CMD = {
  RESET: ESC + "@",
  CENTER: ESC + "\x61\x01",
  LEFT: ESC + "\x61\x00",
  RIGHT: ESC + "\x61\x02",
  BOLD_ON: ESC + "\x45\x01",
  BOLD_OFF: ESC + "\x45\x00",
  DOUBLE_HEIGHT: ESC + "\x21\x10",
  DOUBLE_WIDTH: ESC + "\x21\x20",
  NORMAL: ESC + "\x21\x00",
  FONT_B: ESC + "\x4D\x01",
  FONT_A: ESC + "\x4D\x00",
  CUT: GS + "\x56\x00",
  DRAWER: ESC + "\x70\x00\x19\xFA",
  LINE_FEED: "\x0A",
  TAB: "\x09",
};

function encodeLine(line: string): Uint8Array {
  return new TextEncoder().encode(line + "\n");
}

function buildReceipt(data: OrderPrintData): Uint8Array {
  const chunks: Uint8Array[] = [];

  const push = (s: string) => chunks.push(new TextEncoder().encode(s));
  const pushLine = (s: string) => chunks.push(encodeLine(s));

  push(CMD.RESET);

  // Header
  push(CMD.CENTER);
  push(CMD.BOLD_ON);
  push(CMD.DOUBLE_HEIGHT);
  pushLine(data.toko);
  push(CMD.NORMAL);
  push(CMD.BOLD_OFF);
  if (data.alamat) {
    push(CMD.FONT_B);
    pushLine(data.alamat);
    push(CMD.FONT_A);
  }
  pushLine("");

  // Info Nota
  push(CMD.LEFT);
  push(CMD.FONT_B);
  const maxLen = 32;
  const padRight = (s: string, n: number) => s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
  pushLine(padRight("Nota: " + data.nomorNota, maxLen));
  pushLine(padRight("Tgl:  " + data.tanggal, maxLen));
  pushLine(padRight("Ksr:  " + data.pelanggan, maxLen));
  push(CMD.FONT_A);

  // Separator
  pushLine("-".repeat(32));

  // Item Header
  push(CMD.BOLD_ON);
  pushLine("ITEM           QTY   TOTAL");
  push(CMD.BOLD_OFF);
  pushLine("-".repeat(32));

  // Items
  for (const item of data.items) {
    const nama = item.deskripsi.slice(0, 14).padEnd(14);
    const qty = String(item.qty).padStart(4);
    const total = String(item.total).padStart(8);
    pushLine(`${nama}${qty}   ${total}`);
    // Harga satuan di baris kedua dengan font kecil
    push(CMD.FONT_B);
    pushLine("  @" + String(item.harga).padStart(10));
    push(CMD.FONT_A);
  }

  // Separator
  pushLine("-".repeat(32));

  // Subtotal
  pushLine(padRight("Subtotal", 24) + String(data.subtotal).padStart(8));
  if (data.diskon > 0) {
    pushLine(padRight("Diskon", 24) + "-" + String(data.diskon).padStart(7));
  }
  // Total (bold, double width)
  push(CMD.BOLD_ON);
  push(CMD.DOUBLE_WIDTH);
  pushLine(padRight("TOTAL", 24) + String(data.total).padStart(8));
  push(CMD.NORMAL);
  push(CMD.BOLD_OFF);

  pushLine("");
  pushLine(padRight("Tunai", 24) + String(data.bayar).padStart(8));
  push(CMD.BOLD_ON);
  pushLine(padRight("Kembali", 24) + String(data.kembalian).padStart(8));
  push(CMD.BOLD_OFF);

  if (data.catatan) {
    pushLine("");
    pushLine("Catatan: " + data.catatan);
  }

  // Footer
  pushLine("");
  push(CMD.CENTER);
  pushLine("Terima kasih!");
  pushLine("MUGHIS BANK v3");
  pushLine("");

  // Cut
  push(CMD.CUT);

  // Open cash drawer
  push(CMD.DRAWER);

  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

/* ─── Hook ─── */

export function useThermalPrinter() {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);

  const connect = useCallback(async (): Promise<boolean> => {
    const bt = navigator.bluetooth;
    if (!bt) {
      setError("Web Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge Android.");
      return false;
    }
    setConnecting(true);
    setError(null);
    try {
      const d = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });
      setDevice(d);
      setDeviceName(d.name || "Printer");
      setConnected(true);
      return true;
    } catch (err) {
      const msg = (err as Error).message || "Gagal menghubungkan printer";
      setError(msg);
      return false;
    } finally {
      setConnecting(false);
    }
  }, []);

  const print = useCallback(async (data: OrderPrintData): Promise<boolean> => {
    if (!device) {
      setError("Printer belum terhubung. Klik Connect terlebih dahulu.");
      return false;
    }
    setError(null);
    try {
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
      const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");
      const payload = buildReceipt(data);
      await characteristic.writeValue(payload as unknown as ArrayBuffer);
      server.disconnect();
      return true;
    } catch (err) {
      const msg = (err as Error).message || "Gagal mencetak";
      setError(msg);
      return false;
    }
  }, [device]);

  const disconnect = useCallback(() => {
    try { device?.gatt?.disconnect(); } catch { /* ignore */ }
    setDevice(null);
    setDeviceName(null);
    setConnected(false);
    setError(null);
  }, [device]);

  const scanAndPrint = useCallback(async (data: OrderPrintData): Promise<boolean> => {
    const ok = await connect();
    if (!ok) return false;
    return await print(data);
  }, [connect, print]);

  return {
    connect,
    print,
    disconnect,
    scanAndPrint,
    connecting,
    connected,
    deviceName,
    error,
  };
}
