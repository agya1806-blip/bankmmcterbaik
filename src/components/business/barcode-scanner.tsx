"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Camera, Barcode } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [error, setError] = useState("");
  const [useCamera, setUseCamera] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!useCamera) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setError("Kamera tidak tersedia");
        setUseCamera(false);
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [useCamera]);

  useEffect(() => {
    if (!useCamera || !("BarcodeDetector" in window)) return;
    const detector = new (window as any).BarcodeDetector({ formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"] });
    let active = true;
    const scan = async () => {
      if (!active || !videoRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          onScan(barcodes[0].rawValue);
          streamRef.current?.getTracks().forEach(t => t.stop());
          return;
        }
      } catch {}
      if (active) requestAnimationFrame(scan);
    };
    scan();
    return () => { active = false; };
  }, [useCamera, onScan]);

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1b2e] rounded-2xl w-full max-w-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Scan Barcode</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        {useCamera ? (
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-[#7B61FF] rounded-xl m-4 opacity-50" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Masukkan kode barcode..." value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#F8F9FD] dark:bg-[#0B0C16] text-sm outline-none" />
            <button onClick={handleManualSubmit}
              className="px-4 py-2 bg-[#7B61FF] text-white rounded-xl text-sm font-semibold">Cari</button>
          </div>
        )}
        {!useCamera && (
          <button onClick={() => setUseCamera(true)} className="flex items-center gap-2 text-xs text-[#7B61FF]">
            <Camera className="w-4 h-4" /> Gunakan Kamera
          </button>
        )}
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
}
