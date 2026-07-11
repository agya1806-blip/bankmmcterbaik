"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-red-500/20">
        !
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-base font-semibold font-heading mb-1">Terjadi Kesalahan</h2>
        <p className="text-sm text-muted-foreground">{error.message || "Terjadi kesalahan yang tidak terduga."}</p>
      </div>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white px-5 py-2.5 text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-110 transition-all active:scale-95"
      >
        Coba Lagi
      </button>
    </div>
  );
}
