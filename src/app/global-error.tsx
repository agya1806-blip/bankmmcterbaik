"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 bg-background">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-red-500/20">
            !
          </div>
          <h1 className="text-2xl font-bold text-foreground">Application Error</h1>
          <p className="text-muted-foreground text-sm max-w-md text-center">
            {error.message || "Something went wrong loading the application"}
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre className="text-xs text-muted-foreground/60 max-w-xl overflow-auto p-4 bg-muted/30 rounded-xl">
              {error.stack}
            </pre>
          )}
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-6 py-2.5 text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
