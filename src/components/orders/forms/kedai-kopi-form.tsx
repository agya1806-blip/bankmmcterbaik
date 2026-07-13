"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useBusinessStore } from "@/store/useBusinessStore";
import { Plus, Coffee, Package, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface KedaiKopiFormProps {
  currency: string;
  onAddToCart: (desc: string, price: number) => void;
}

const COFFEE_MENU = [
  { name: "Espresso", price: 15000, bom: { coffee: 18, milk: 0 }, color: "amber" },
  { name: "Kopi Susu", price: 18000, bom: { coffee: 14, milk: 120 }, color: "amber" },
  { name: "Latte", price: 22000, bom: { coffee: 16, milk: 200 }, color: "amber" },
  { name: "Cappuccino", price: 20000, bom: { coffee: 16, milk: 150 }, color: "amber" },
  { name: "Americano", price: 15000, bom: { coffee: 18, milk: 0 }, color: "amber" },
  { name: "Mocca", price: 25000, bom: { coffee: 16, milk: 180 }, color: "amber" },
  { name: "Matcha Latte", price: 24000, bom: { coffee: 0, milk: 200 }, color: "green" },
  { name: "Red Velvet", price: 26000, bom: { coffee: 0, milk: 200 }, color: "rose" },
];

export default function KedaiKopiForm({
  currency,
  onAddToCart,
}: KedaiKopiFormProps) {
  const { coffeeIngredients, addCoffeeIngredient, reduceStock } = useBusinessStore();

  const [kopiBahan, setKopiBahan] = useState("");
  const [kopiGram, setKopiGram] = useState(0);
  const [coffeeMinStock, setCoffeeMinStock] = useState(0);

  const tambahBahan = () => {
    if (!kopiBahan) return;
    addCoffeeIngredient({
      id: crypto.randomUUID(),
      name: kopiBahan,
      stockGram: kopiGram,
      minStockThreshold: coffeeMinStock,
    });
    setKopiBahan("");
    setKopiGram(0);
    toast.success("Bahan ditambahkan");
  };

  const pilihMenu = (item: (typeof COFFEE_MENU)[number]) => {
    const cukupStok =
      item.bom.coffee === 0 ||
      coffeeIngredients.some((c) => c.stockGram >= item.bom.coffee);
    if (!cukupStok) {
      toast.error("Stok bahan tidak mencukupi");
      return;
    }
    if (item.bom.coffee > 0) {
      coffeeIngredients.forEach((c) => {
        if (
          c.name.toLowerCase().includes("kopi") ||
          c.name.toLowerCase().includes("bean")
        ) {
          reduceStock(c.id, item.bom.coffee);
        }
      });
    }
    onAddToCart(item.name, item.price);
    toast.success(`${item.name} ditambahkan`);
  };

  const colorMap: Record<string, string> = {
    amber: "from-amber-500 to-orange-500",
    green: "from-emerald-500 to-teal-500",
    rose: "from-rose-500 to-pink-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Coffee className="size-5 text-amber-500" />
        <span className="text-xs font-medium text-muted-foreground/70">Menu & Stok Bahan</span>
      </div>

      <div className="floating-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground/60" />
          <Label className="text-xs font-semibold">Stok Bahan Baku</Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Input value={kopiBahan} onChange={(e) => setKopiBahan(e.target.value)} placeholder="Nama bahan" className="h-8 text-xs" />
          </div>
          <div>
            <Input type="number" value={kopiGram || ""} onChange={(e) => setKopiGram(Number(e.target.value))} placeholder="Gram" className="h-8 text-xs" />
          </div>
        </div>
        <div className="flex gap-2">
          <Input type="number" value={coffeeMinStock || ""} onChange={(e) => setCoffeeMinStock(Number(e.target.value))} placeholder="Min stok (gram)" className="h-8 text-xs flex-1" />
          <Button size="sm" variant="secondary" onClick={tambahBahan}>Tambah</Button>
        </div>
        {coffeeIngredients.length > 0 && (
          <div className="max-h-20 overflow-y-auto space-y-0.5">
            {coffeeIngredients.map((c) => {
              const low = c.stockGram < c.minStockThreshold;
              return (
                <div key={c.id}
                  className={`flex justify-between items-center p-2 rounded-xl text-xs transition-all ${
                    low
                      ? "bg-red-50/80 dark:bg-red-950/20 border border-red-200/40"
                      : "bg-muted/30"
                  }`}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className={`font-semibold ${low ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {c.stockGram}g
                    {low && <AlertTriangle className="inline size-3 ml-1 text-red-500" />}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {coffeeIngredients.length === 0 && (
          <p className="text-[10px] text-center text-muted-foreground/40 py-2">Belum ada bahan baku</p>
        )}
      </div>

      <Label className="text-xs font-semibold">Menu Minuman</Label>
      <div className="grid grid-cols-2 gap-2">
        {COFFEE_MENU.map((item) => {
          const lowStock =
            item.bom.coffee > 0 &&
            coffeeIngredients.some((c) => c.stockGram < item.bom.coffee);
          return (
            <button
              key={item.name}
              onClick={() => pilihMenu(item)}
              className="group relative flex flex-col items-center p-4 rounded-2xl border border-border/40 bg-white/50 dark:bg-card/30 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-400/30 active:scale-[0.97] transition-all duration-200"
            >
              {lowStock && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 text-[8px] px-1.5 py-0.5 z-10">
                  <AlertTriangle className="size-2.5 inline mr-0.5" /> Low
                </Badge>
              )}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[item.color]} flex items-center justify-center mb-2 shadow-lg ${
                colorMap[item.color].includes("amber") ? "shadow-amber-500/20" :
                colorMap[item.color].includes("emerald") ? "shadow-emerald-500/20" : "shadow-rose-500/20"
              }`}>
                <Coffee className="size-5 text-white" />
              </div>
              <span className="text-sm font-medium text-center leading-tight">{item.name}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1.5">
                {currency} {item.price.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
