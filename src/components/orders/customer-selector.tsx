"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User, X } from "lucide-react";
import type { Customer } from "@/lib/db";

interface CustomerSelectorProps {
  workspaceId: string;
  value: Customer | null;
  onChange: (c: Customer | null) => void;
}

export default function CustomerSelector({
  workspaceId,
  value,
  onChange,
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    import("@/lib/db").then((db) =>
      db.getCustomersByWorkspace(workspaceId).then(setCustomers)
    );
  }, [workspaceId]);

  const filtered = useMemo(() => {
    if (!query) return customers.slice(0, 5);
    const q = query.toLowerCase();
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 8);
  }, [customers, query]);

  const pilih = (c: Customer) => {
    onChange(c);
    setQuery(c.name);
    setShowDropdown(false);
  };

  return (
    <Card hover={false}>
      <CardContent className="p-4 space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Pelanggan</Label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Cari nama / telepon..."
            className="pl-10 h-11"
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-20 top-full mt-1.5 w-full bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl shadow-black/5 max-h-52 overflow-y-auto animate-scale-in">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={() => pilih(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
                >
                  <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{c.name}</p>
                    {c.phone && <p className="text-[10px] text-muted-foreground/60">{c.phone}</p>}
                  </div>
                  {c.phone && (
                    <span className="text-[10px] font-mono text-muted-foreground/40">{c.phone}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {value && (
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-emerald-100/20 dark:from-emerald-950/20 dark:to-emerald-900/5 border border-emerald-200/40 dark:border-emerald-800/30 rounded-xl p-3 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <User className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{value.name}</p>
                {value.phone && <p className="text-[10px] text-muted-foreground/60">{value.phone}</p>}
              </div>
            </div>
            <button
              onClick={() => { onChange(null); setQuery(""); }}
              className="flex items-center justify-center size-8 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
