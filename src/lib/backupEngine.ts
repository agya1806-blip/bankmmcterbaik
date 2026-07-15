import { db } from "@/lib/db-v4";

const ALGORITHM = "AES-GCM";
const ITERATIONS = 100000;
const HASH = "SHA-256";
const SALT = "mmcbank-backup-v1";

async function deriveKey(pin: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface BackupPayload {
  version: string;
  date: string;
  bookOrBranchIds: string[];
  data: Record<string, unknown[]>;
  iv: string;
}

async function exportRawData(): Promise<Record<string, unknown[]>> {
  const tables = [
    "users", "profiles", "wallets", "walletMutations", "customers",
    "transactions", "piutang", "piutangInstallments", "inventory",
    "inventoryMutations", "labels", "labelTags", "quickOrders",
    "sedekahBalances", "invoiceCounters", "auditLogs",
  ] as const;

  const data: Record<string, unknown[]> = {};
  for (const table of tables) {
    const all = await (db as any)[table].toArray();
    data[table] = all;
  }
  return data;
}

export async function exportEncryptedBackup(pin: string): Promise<Blob> {
  const rawData = await exportRawData();
  const bookOrBranchIds = [
    ...new Set(
      Object.values(rawData)
        .flat()
        .map((r: any) => r.bookOrBranchId)
        .filter(Boolean) as string[]
    ),
  ];

  const jsonStr = JSON.stringify(rawData);
  const enc = new TextEncoder();
  const dataBytes = enc.encode(jsonStr);

  const key = await deriveKey(pin);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    dataBytes
  );

  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const encryptedBase64 = btoa(
    String.fromCharCode(...new Uint8Array(encrypted))
  );

  const payload: BackupPayload = {
    version: "2.0",
    date: new Date().toISOString(),
    bookOrBranchIds,
    data: { encrypted: encryptedBase64 } as any,
    iv: ivHex,
  };

  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
}

export async function importEncryptedBackup(
  blob: Blob,
  pin: string
): Promise<{ success: boolean; message: string }> {
  try {
    const text = await blob.text();
    const payload: BackupPayload = JSON.parse(text);

    if (payload.version !== "2.0") {
      return { success: false, message: "Format backup tidak dikenal" };
    }

    const key = await deriveKey(pin);
    const iv = new Uint8Array(
      payload.iv.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
    );
    const encryptedBytes = Uint8Array.from(atob(payload.data as any as string), (c) =>
      c.charCodeAt(0)
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encryptedBytes
    );

    const dec = new TextDecoder();
    const rawData: Record<string, unknown[]> = JSON.parse(dec.decode(decrypted));

    const tables = Object.keys(rawData);
    await db.transaction("rw", tables as any, async () => {
      for (const [tableName, rows] of Object.entries(rawData)) {
        const table = (db as any)[tableName];
        if (!table) continue;
        await table.clear();
        for (const row of rows) {
          await table.add(row);
        }
      }
    });

    return { success: true, message: `Restore berhasil (${tables.length} tabel)` };
  } catch {
    return { success: false, message: "PIN salah atau data rusak" };
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
