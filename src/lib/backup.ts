import { openDB } from "idb";

const DB_NAME = "mmcbank";

const STORE_NAMES = [
  "users", "sessions", "workspaces", "workspace_members",
  "accounts", "categories", "transactions", "budgets",
  "customers", "suppliers", "inventory_items", "inventory_mutations",
  "payment_methods", "projects", "project_tasks", "calendar_events",
  "widget_layouts", "workspace_settings", "audit_logs", "recurring_rules",
  "products", "orders", "branches", "pin_locks",
  "ppob_categories", "digital_products", "ppob_transactions", "qris_payments",
];

export interface BackupData {
  version: string;
  date: string;
  stores: Record<string, unknown[]>;
}

export async function exportBackup(): Promise<BackupData> {
  const db = await openDB(DB_NAME);
  const data: BackupData = {
    version: "1.0",
    date: new Date().toISOString(),
    stores: {},
  };
  for (const name of STORE_NAMES) {
    if (db.objectStoreNames.contains(name)) {
      const tx = db.transaction(name, "readonly");
      const store = tx.objectStore(name);
      data.stores[name] = await store.getAll();
    }
  }
  db.close();
  return data;
}

export async function importBackup(data: BackupData): Promise<{ store: string; count: number }[]> {
  const db = await openDB(DB_NAME);
  const results: { store: string; count: number }[] = [];
  for (const name of STORE_NAMES) {
    const records = data.stores[name];
    if (!records || !db.objectStoreNames.contains(name)) continue;
    const tx = db.transaction(name, "readwrite");
    const store = tx.objectStore(name);
    await store.clear();
    for (const record of records) {
      await store.put(record);
    }
    await tx.done;
    results.push({ store: name, count: records.length });
  }
  db.close();
  return results;
}

export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mmcbank-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
