export function generateSyncCode(): string {
  const keys = [
    "mmcbank-business-store-v3",
    "mmcbank-role-store",
    "mmcbank-theme",
    "mmcbank-onboarding",
  ];

  const data: Record<string, unknown> = {};
  for (const key of keys) {
    try {
      const val = localStorage.getItem(key);
      if (val) data[key] = JSON.parse(val);
    } catch {
      // skip if key doesn't exist or parse fails
    }
  }

  const json = JSON.stringify(data);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded;
}

export function applySyncCode(code: string): { success: boolean; message: string } {
  try {
    const json = decodeURIComponent(escape(atob(code)));
    const data = JSON.parse(json);

    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        count++;
      } catch {
        return { success: false, message: `Gagal menyimpan ${key}` };
      }
    }

    return {
      success: true,
      message: `${count} data berhasil disinkronisasi. Halaman akan di-refresh.`,
    };
  } catch {
    return {
      success: false,
      message: "Kode sinkronisasi tidak valid atau rusak.",
    };
  }
}

export function getSyncCodeSize(): number {
  try {
    const keys = ["mmcbank-business-store-v3", "mmcbank-role-store", "mmcbank-theme"];
    let total = 0;
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) total += val.length;
    }
    return total;
  } catch {
    return 0;
  }
}

export function estimateLocalStorageUsage(): string {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key);
      if (val) total += val.length;
    }
  }
  const kb = (total / 1024).toFixed(1);
  const limit = 5120; // 5MB in KB
  const pct = ((total / 1024 / limit) * 100).toFixed(0);
  return `${kb} KB / ${limit} KB (${pct}%)`;
}

export function getLastSyncTimestamp(): string | null {
  try {
    return localStorage.getItem("mmcbank-last-sync");
  } catch {
    return null;
  }
}

export function setLastSyncTimestamp(): void {
  try {
    localStorage.setItem("mmcbank-last-sync", new Date().toISOString());
  } catch {
    // ignore
  }
}
