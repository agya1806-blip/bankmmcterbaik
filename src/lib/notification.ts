export function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  if (Notification.permission === "denied") return Promise.resolve(false);
  return Notification.requestPermission().then(p => p === "granted");
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { ...options, icon: "/icon-192.png" });
  }
}

export function showPiutangReminder(jumlah: number, total: number) {
  if (jumlah === 0) return;
  sendNotification("Piutang Jatuh Tempo", {
    body: `${jumlah} piutang akan jatuh tempo dengan total Rp ${total.toLocaleString()}`,
    tag: "piutang-reminder",
  });
}

export function showStockAlert(items: { nama: string; stok: number }[]) {
  if (items.length === 0) return;
  sendNotification("Stok Menipis!", {
    body: items.map(i => `${i.nama}: ${i.stok}`).join(", "),
    tag: "stock-alert",
  });
}
