"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0B0C16] flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <span className="text-4xl font-extrabold text-red-500">!</span>
            </div>
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">Terjadi Kesalahan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.</p>
            <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-2xl hover:bg-emerald-600 transition-colors">
              Coba Lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
