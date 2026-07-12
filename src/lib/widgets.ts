const STORAGE_KEY = "mmcbank-widgets";

const ALL_WIDGETS = [
  { id: "balance", label: "Ringkasan Saldo", default: true },
  { id: "quick-actions", label: "Aksi Cepat", default: true },
  { id: "recent-transactions", label: "Transaksi Terakhir", default: true },
  { id: "budgets", label: "Anggaran", default: true },
  { id: "business-stats", label: "Statistik Bisnis", default: false },
  { id: "debts", label: "Hutang Piutang", default: false },
  { id: "accounts-summary", label: "Rekening", default: true },
] as const;

export type WidgetId = (typeof ALL_WIDGETS)[number]["id"];

export function getWidgets(): WidgetId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WidgetId[];
      return ALL_WIDGETS.map((w) => w.id).filter((id) => parsed.includes(id));
    }
  } catch {}
  return ALL_WIDGETS.filter((w) => w.default).map((w) => w.id);
}

export function saveWidgets(ids: WidgetId[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export { ALL_WIDGETS };
