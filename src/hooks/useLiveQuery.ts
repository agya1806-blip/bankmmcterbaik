import { useEffect, useState } from "react";
import { db } from "@/lib/db-v4";

export function useLiveQuery<T>(
  queryFn: () => Promise<T[]> | T[],
  deps: unknown[] = []
): T[] | undefined {
  const [data, setData] = useState<T[] | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    let unsub: (() => void) | undefined;

    const run = async () => {
      try {
        const result = await queryFn();
        if (mounted) setData(result);
      } catch {
        if (mounted) setData([]);
      }
    };

    run();

    try {
      const obs = (db as any).on("changes", (_changes: any) => {
        if (mounted) run();
      });
      if (obs && typeof obs.subscribe === "function") {
        unsub = obs.subscribe(() => run());
      }
    } catch {
      // fallback: poll every 10s instead of 2s
      const interval = setInterval(run, 10000);
      return () => { mounted = false; clearInterval(interval); };
    }

    return () => { mounted = false; unsub?.(); };
  }, deps);

  return data;
}

export { db };
