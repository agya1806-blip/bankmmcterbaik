import type { BusinessSubType } from "@/lib/db";

export type DashboardWidgetType = "stats" | "orders" | "chart" | "cost_breakdown" | "top_products" | "low_stock";

export interface BusinessTypeConfig {
  value: BusinessSubType;
  label: string;
  icon: string;
  description: string;
  color: string;
  productFields: {
    showStock: boolean;
    showCategory: boolean;
    showImei: boolean;
    showSize: boolean;
    showVariant: boolean;
    showUnit: boolean;
    categories: string[];
  };
  orderFields: {
    showSpecs: boolean;
    showDeadline: boolean;
    showPartai: boolean;
    showMenu: boolean;
  };
  dashboard: DashboardWidgetType[];
}

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    value: "general",
    label: "Umum",
    icon: "📦",
    description: "Usaha umum / lainnya",
    color: "from-gray-500 to-gray-600",
    productFields: { showStock: true, showCategory: true, showImei: false, showSize: false, showVariant: false, showUnit: true, categories: ["Umum", "Lainnya"] },
    orderFields: { showSpecs: false, showDeadline: false, showPartai: false, showMenu: false },
    dashboard: ["stats", "orders", "chart", "cost_breakdown"],
  },
  {
    value: "konveksi",
    label: "Konveksi",
    icon: "👕",
    description: "Produksi pakaian & tekstil",
    color: "from-blue-500 to-blue-700",
    productFields: { showStock: true, showCategory: true, showImei: false, showSize: true, showVariant: true, showUnit: true, categories: ["Kain", "Bahan", "Jasa Jahit", "Aksesoris"] },
    orderFields: { showSpecs: true, showDeadline: true, showPartai: true, showMenu: false },
    dashboard: ["stats", "orders", "cost_breakdown", "chart"],
  },
  {
    value: "percetakan",
    label: "Percetakan",
    icon: "🖨️",
    description: "Cetak digital & offset",
    color: "from-purple-500 to-purple-700",
    productFields: { showStock: false, showCategory: true, showImei: false, showSize: true, showVariant: true, showUnit: true, categories: ["Cetak", "Design", "Fotocopy", "Atk"] },
    orderFields: { showSpecs: true, showDeadline: true, showPartai: true, showMenu: false },
    dashboard: ["stats", "orders", "cost_breakdown", "chart"],
  },
  {
    value: "toko_hp",
    label: "Toko HP",
    icon: "📱",
    description: "Jual beli handphone & aksesoris",
    color: "from-emerald-500 to-emerald-700",
    productFields: { showStock: true, showCategory: true, showImei: true, showSize: false, showVariant: true, showUnit: false, categories: ["HP", "Aksesoris", "Charger", "Casing", "Tempered Glass"] },
    orderFields: { showSpecs: true, showDeadline: false, showPartai: false, showMenu: false },
    dashboard: ["stats", "low_stock", "orders", "chart"],
  },
  {
    value: "toko_laptop",
    label: "Toko Laptop",
    icon: "💻",
    description: "Jual beli laptop & komputer",
    color: "from-indigo-500 to-indigo-700",
    productFields: { showStock: true, showCategory: true, showImei: true, showSize: false, showVariant: true, showUnit: false, categories: ["Laptop", "Komputer", "Sparepart", "Aksesoris"] },
    orderFields: { showSpecs: true, showDeadline: false, showPartai: false, showMenu: false },
    dashboard: ["stats", "low_stock", "orders", "cost_breakdown"],
  },
  {
    value: "kelontong",
    label: "Kelontong / Sembako",
    icon: "🏪",
    description: "Toko kelontong & sembako",
    color: "from-orange-500 to-orange-700",
    productFields: { showStock: true, showCategory: true, showImei: false, showSize: false, showVariant: false, showUnit: true, categories: ["Sembako", "Minuman", "Makanan", "Rokok", "Alat Rumah Tangga", "Lainnya"] },
    orderFields: { showSpecs: false, showDeadline: false, showPartai: false, showMenu: false },
    dashboard: ["stats", "low_stock", "cost_breakdown", "chart"],
  },
  {
    value: "kedai_kopi",
    label: "Kedai Kopi",
    icon: "☕",
    description: "Kedai kopi & minuman",
    color: "from-amber-600 to-amber-800",
    productFields: { showStock: true, showCategory: true, showImei: false, showSize: false, showVariant: true, showUnit: false, categories: ["Kopi", "Non-Kopi", "Makanan Ringan", "Topping"] },
    orderFields: { showSpecs: false, showDeadline: false, showPartai: false, showMenu: true },
    dashboard: ["stats", "top_products", "cost_breakdown", "chart"],
  },
  {
    value: "warung",
    label: "Warung",
    icon: "🍜",
    description: "Warung makan & minuman",
    color: "from-red-500 to-red-700",
    productFields: { showStock: true, showCategory: true, showImei: false, showSize: false, showVariant: true, showUnit: false, categories: ["Makanan", "Minuman", "Lauk", "Snack"] },
    orderFields: { showSpecs: false, showDeadline: false, showPartai: false, showMenu: true },
    dashboard: ["stats", "top_products", "cost_breakdown", "chart"],
  },
];

export const DEFAULT_BUSINESS: BusinessSubType = "general";

export function getBusinessConfig(type?: BusinessSubType): BusinessTypeConfig {
  return BUSINESS_TYPES.find(b => b.value === type) || BUSINESS_TYPES[0];
}
