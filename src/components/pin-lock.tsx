"use client";

import React, { useState, useCallback } from "react";
import { Lock, Delete } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

interface PinLockProps {
  onSuccess: () => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

export default function PinLock({ onSuccess, onCancel, title = "Masukkan PIN", subtitle = "PIN akses diperlukan" }: PinLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleVerify = useCallback(() => {
    const users = JSON.parse(localStorage.getItem("mmc_users") || "[]");
    const matched = users.some((u: any) => u.pin === pin);
    if (matched) {
      onSuccess();
    } else {
      setError("PIN salah!");
      setPin("");
    }
  }, [pin, onSuccess]);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + d;
    setPin(newPin);
    setError("");
    if (newPin.length >= 4) {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem("mmc_users") || "[]");
        const matched = users.some((u: any) => u.pin === newPin);
        if (matched) {
          onSuccess();
        } else {
          setError("PIN salah!");
          setPin("");
        }
      }, 200);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError("");
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xs bg-white dark:bg-[#0F1926] rounded-[32px] p-6 space-y-6 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#008CEB] to-[#00C9A7] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-sm font-extrabold">{title}</h3>
          <p className="text-[10px] text-slate-400">{subtitle}</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                i < pin.length
                  ? "bg-[#008CEB] border-[#008CEB]"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {i < pin.length && (
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-[#FF3B5C] text-center animate-shake">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {digits.map((d, i) => {
            if (d === "") return <div key={i} />;
            if (d === "del") {
              return (
                <button
                  key={i}
                  onClick={handleBackspace}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-transform"
                >
                  <Delete className="w-4 h-4" />
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleDigit(d)}
                className="h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold active:scale-95 transition-transform hover:bg-slate-200 dark:hover:bg-zinc-700"
              >
                {d}
              </button>
            );
          })}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            Batal
          </button>
        )}
      </motion.div>
    </div>
  );
}
