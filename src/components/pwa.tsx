"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function PWA() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferred(promptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = () => {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(() => {
      setDeferred(null);
      setShow(false);
    });
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-[100px] left-3 right-3 z-[70] lg:hidden animate-slide-up">
      <div className="floating-card p-4 flex items-center gap-3 shadow-xl border-emerald-500/20">
        <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
          M
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install MUGHIS BANK</p>
          <p className="text-xs text-muted-foreground">Akses cepat dari home screen</p>
        </div>
        <button onClick={install} className="btn-premium bg-emerald-500 text-white px-4 py-2 text-sm">
          <Download className="size-4 mr-1.5" />
          Install
        </button>
        <button onClick={() => setShow(false)} className="size-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors shrink-0">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
