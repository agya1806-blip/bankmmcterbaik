"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/engines/workspace/workspace-store";

export default function Reminder() {
  const { activeWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (!activeWorkspace || typeof Notification === "undefined") return;
    if (Notification.permission === "default") Notification.requestPermission();

    const check = async () => {
      if (Notification.permission !== "granted") return;
      const { getRecurringRulesByWorkspace } = await import("@/lib/db");
      const rules = await getRecurringRulesByWorkspace(activeWorkspace.id);
      const today = new Date().toISOString().slice(0, 10);
      for (const r of rules) {
        if (r.active && r.nextDate === today) {
          new Notification("Tagihan Jatuh Tempo", {
            body: `${r.description} — ${activeWorkspace.currency} ${r.amount.toLocaleString()}`,
            icon: "/icon-192.svg",
          });
        }
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [activeWorkspace]);

  return null;
}
