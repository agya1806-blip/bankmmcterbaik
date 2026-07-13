"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";
import { getWorkspaceSettings } from "@/lib/db";
import { id } from "./translations";

const translations = { id } as const;
type Locale = keyof typeof translations;

export function useTranslation() {
  const { activeWorkspace } = useWorkspaceStore();
  const [locale, setLocale] = useState<Locale>("id");

  useEffect(() => {
    if (!activeWorkspace) return;
    getWorkspaceSettings(activeWorkspace.id).then((_s) => {
      setLocale("id");
    });
  }, [activeWorkspace]);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = translations[locale];
      for (const key of keys) {
        value = value?.[key];
      }
      if (typeof value !== "string") return path;
      if (vars) {
        return Object.entries(vars).reduce(
          (str, [k, v]) => str.replace(`{${k}}`, String(v)),
          value
        );
      }
      return value;
    },
    [locale]
  );

  return { t, locale };
}

/** For non-hook contexts (e.g. jsPDF). Always returns ID string. */
export function tStatic(path: string, vars?: Record<string, string | number>) {
  const keys = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = id;
  for (const key of keys) {
    value = value?.[key];
  }
  if (typeof value !== "string") return path;
  if (vars) {
    return Object.entries(vars).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, String(v)),
      value
    );
  }
  return value;
}
