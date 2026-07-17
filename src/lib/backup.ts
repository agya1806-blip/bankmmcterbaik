import { db } from "@/lib/db-v4";

/* ─── Crypto Helpers ─── */

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(data: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(data)
  );
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode.apply(null, Array.from(result)));
}

async function decrypt(encryptedBase64: string, password: string): Promise<string> {
  const data = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted as BufferSource
  );
  return new TextDecoder().decode(decrypted);
}

/* ─── Backup Data Structure ─── */

interface BackupData {
  version: number;
  timestamp: string;
  dbName: string;
  tables: Record<string, any[]>;
}

/* ─── Export Backup ─── */

export async function createBackup(password: string): Promise<Blob> {
  const tables = [
    "users", "profiles", "wallets", "walletMutations", "customers",
    "transactions", "piutang", "piutangInstallments",
    "inventory", "inventoryMutations",
    "labels", "labelTags", "quickOrders",
    "sedekahBalances", "invoiceCounters",
    "auditLogs", "cashflows", "productions",
  ];
  const data: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    dbName: db.name,
    tables: {},
  };

  for (const table of tables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collection = (db as any)[table];
    if (collection && typeof collection.toArray === "function") {
      data.tables[table] = await collection.toArray();
    }
  }

  const jsonStr = JSON.stringify(data);
  const encrypted = await encrypt(jsonStr, password);

  return new Blob([encrypted], { type: "text/plain" });
}

/* ─── Import Backup ─── */

export async function restoreBackup(file: File, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const text = await file.text();
    const decrypted = await decrypt(text, password);
    const data: BackupData = JSON.parse(decrypted);

    if (!data.tables || typeof data.tables !== "object") {
      return { ok: false, error: "Format backup tidak valid!" };
    }

    // Clear existing data and restore
    const tables = Object.keys(data.tables);
    for (const table of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const collection = (db as any)[table];
      if (collection && typeof collection.clear === "function") {
        await collection.clear();
        if (Array.isArray(data.tables[table]) && data.tables[table].length > 0) {
          await collection.bulkAdd(data.tables[table]);
        }
      }
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("decrypt") || message.includes("Invalid")) {
      return { ok: false, error: "Password salah atau file backup corrupt!" };
    }
    return { ok: false, error: `Gagal restore: ${message}` };
  }
}

/* ─── Download Helper ─── */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
