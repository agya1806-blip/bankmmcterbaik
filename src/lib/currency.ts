import { db, type MataUang } from "./db-v4";

export const CURRENCY_SYMBOLS: Record<MataUang, string> = {
  IDR: "Rp",
  USD: "$",
};

export const CURRENCY_NAMES: Record<MataUang, string> = {
  IDR: "Rupiah",
  USD: "US Dollar",
};

export function formatCurrency(amount: number, mataUang: MataUang = "IDR"): string {
  const symbol = CURRENCY_SYMBOLS[mataUang];
  if (mataUang === "IDR") {
    return `${symbol} ${amount.toLocaleString("id-ID")}`;
  }
  return `${symbol} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function getExchangeRate(from: MataUang, to: MataUang): Promise<number> {
  if (from === to) return 1;

  const rate = await db.exchangeRates
    .where({ from, to })
    .first();

  if (rate) return rate.rate;

  if (from === "USD" && to === "IDR") return 16500;
  if (from === "IDR" && to === "USD") return 1 / 16500;
  return 1;
}

export async function convertCurrency(amount: number, from: MataUang, to: MataUang): Promise<number> {
  const rate = await getExchangeRate(from, to);
  return Math.round(amount * rate * 100) / 100;
}

export function convertCurrencySync(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}
