"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Trash2, ShoppingCart, ShoppingBag } from "lucide-react";

export interface CartItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PosCartProps {
  items: CartItem[];
  currency: string;
  discount: number;
  bayar: number;
  catatan: string;
  subtotal: number;
  totalBayar: number;
  kembalian: number;
  onUpdateQty: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onDiscountChange: (v: number) => void;
  onBayarChange: (v: number) => void;
  onCatatanChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}

export default function PosCart({
  items,
  currency,
  discount,
  bayar,
  catatan,
  subtotal,
  totalBayar,
  kembalian,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onDiscountChange,
  onBayarChange,
  onCatatanChange,
  onSave,
  saving,
}: PosCartProps) {
  return (
    <Card hover={false}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4 text-muted-foreground/60" />
            <Label className="text-xs font-medium">Keranjang</Label>
            {items.length > 0 && (
              <span className="flex items-center justify-center size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                {items.length}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <button onClick={onClearCart}
              className="text-[10px] font-medium text-muted-foreground/50 hover:text-red-500 transition-colors">
              Kosongkan
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <ShoppingCart className="size-10 text-muted-foreground/15 mb-2" />
            <p className="text-xs text-muted-foreground/40 text-center">Belum ada item</p>
            <p className="text-[10px] text-muted-foreground/30 text-center">Pilih unit bisnis lalu tambah produk</p>
          </div>
        ) : (
          <>
            <div className="space-y-1 max-h-64 overflow-y-auto -mx-1 px-1">
              {items.map((item) => (
                <div key={item.id}
                  className="group flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground/50">
                      {currency} {item.unitPrice.toLocaleString()} &times; {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      className="size-7 flex items-center justify-center rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground transition-all active:scale-90">
                      <Minus className="size-3" />
                    </button>
                    <span className="text-xs font-bold w-7 text-center tabular-nums">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      className="size-7 flex items-center justify-center rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground transition-all active:scale-90">
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold w-20 text-right tabular-nums">
                    {currency} {item.total.toLocaleString()}
                  </span>
                  <button onClick={() => onRemoveItem(item.id)}
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/10 dark:from-emerald-950/10 dark:to-emerald-900/5 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground/70">Subtotal</span>
                <span className="font-semibold tabular-nums">{currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs shrink-0 text-muted-foreground/70">Diskon</Label>
                <Input type="number" value={discount || ""} onChange={(e) => onDiscountChange(Number(e.target.value))}
                  className="h-8 text-xs w-28 text-right tabular-nums" />
              </div>
              <div className="flex justify-between text-base font-bold border-t border-emerald-200/30 dark:border-emerald-800/30 pt-2.5">
                <span>Total</span>
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{currency} {totalBayar.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs shrink-0 text-muted-foreground/70">Bayar</Label>
                <Input type="number" value={bayar || ""} onChange={(e) => onBayarChange(Number(e.target.value))}
                  className="h-8 text-xs w-28 text-right tabular-nums" />
                {bayar > 0 && (
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    Kembali: <strong className="text-green-600 dark:text-green-400 tabular-nums">{currency} {kembalian.toLocaleString()}</strong>
                  </span>
                )}
              </div>
            </div>

            <Input value={catatan} onChange={(e) => onCatatanChange(e.target.value)}
              placeholder="Catatan pesanan..." className="h-9 text-xs" />

            <Button className="w-full h-12 text-sm" onClick={onSave} disabled={items.length === 0 || saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                <><ShoppingCart className="size-4" /> Simpan Pesanan</>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
