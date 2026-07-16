"use client";
import { useState, useCallback, useRef } from "react";

interface ThermalPrinterState {
  isSupported: boolean;
  isConnected: boolean;
  isPrinting: boolean;
  deviceName: string | null;
}

interface UseThermalPrinterReturn extends ThermalPrinterState {
  connect: () => Promise<void>;
  disconnect: () => void;
  printReceipt: (lines: string[]) => Promise<void>;
  error: string | null;
}

function buildReceipt(lines: string[]): Uint8Array {
  const boldOn = "\x1bE\x01";
  const boldOff = "\x1bE\x00";
  const alignCenter = "\x1ba\x01";
  const alignLeft = "\x1ba\x00";
  const cut = "\x1dV\x00";

  let payload = "";
  payload += alignCenter;
  payload += boldOn;
  payload += "MMCBANK BUKU USAHA\n";
  payload += boldOff;
  payload += "==============================\n";
  payload += alignLeft;

  for (const line of lines) {
    if (line.startsWith("*") && line.endsWith("*")) {
      payload += boldOn + line.slice(1, -1) + "\n" + boldOff;
    } else if (line.startsWith("=")) {
      payload += "==============================\n";
    } else {
      payload += line + "\n";
    }
  }

  payload += "\n";
  payload += alignCenter;
  payload += "Terima kasih!\n\n\n";
  payload += cut;

  return new TextEncoder().encode(payload);
}

export function useThermalPrinter(): UseThermalPrinterReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serverRef = useRef<any>(null);
  const charRef = useRef<any>(null);

  const isSupported =
    typeof window !== "undefined" && "bluetooth" in navigator;

  const connect = useCallback(async () => {
    if (!isSupported) {
      setError("Web Bluetooth tidak didukung di browser ini");
      return;
    }

    try {
      setError(null);

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
      });

      setDeviceName(device.name || "Thermal Printer");

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Gagal konek ke GATT server");
      serverRef.current = server;

      const service = await server.getPrimaryService(
        "000018f0-0000-1000-8000-00805f9b34fb"
      );

      const characteristic = await service.getCharacteristic(
        "00002af1-0000-1000-8000-00805f9b34fb"
      );
      charRef.current = characteristic;

      setIsConnected(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal konek";
      setError(message);
      setIsConnected(false);
    }
  }, [isSupported]);

  const disconnect = useCallback(() => {
    serverRef.current?.disconnect();
    serverRef.current = null;
    charRef.current = null;
    setIsConnected(false);
    setDeviceName(null);
    setError(null);
  }, []);

  const printReceipt = useCallback(
    async (lines: string[]) => {
      if (!charRef.current) {
        setError("Printer belum terkoneksi");
        return;
      }

      try {
        setIsPrinting(true);
        setError(null);
        const data = buildReceipt(lines);
        await charRef.current.writeValue(data);
        setIsPrinting(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Gagal cetak";
        setError(message);
        setIsPrinting(false);
      }
    },
    []
  );

  return {
    isSupported,
    isConnected,
    isPrinting,
    deviceName,
    connect,
    disconnect,
    printReceipt,
    error,
  };
}
