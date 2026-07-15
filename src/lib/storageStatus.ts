export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    return await navigator.storage.persist();
  }
  return false;
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
  persisted: boolean;
}> {
  let persisted = false;
  if (navigator.storage && navigator.storage.persisted) {
    persisted = await navigator.storage.persisted();
  }

  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    const usage = est.usage ?? 0;
    const quota = est.quota ?? 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
    return { usage, quota, percentUsed, persisted };
  }

  return { usage: 0, quota: 0, percentUsed: 0, persisted };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
