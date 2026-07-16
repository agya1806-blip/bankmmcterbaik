import { useState, useEffect } from "react";
import { db } from "@/lib/db-v4";

export function useLiveQuery<T>(
  queryFn: () => Promise<T[]> | T[],
  deps: unknown[] = []
): T[] | undefined {
  const [data, setData] = useState<T[] | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const result = await queryFn();
      if (mounted) setData(result);
    };
    run();

    const interval = setInterval(run, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, deps);

  return data;
}

export { db };
