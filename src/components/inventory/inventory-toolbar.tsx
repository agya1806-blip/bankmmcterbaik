"use client";

import React from "react";
import { InventorySearch } from "./inventory-search";
import { InventoryFilter, type StockFilter } from "./inventory-filter";

interface InventoryToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  filter: StockFilter;
  onFilterChange: (f: StockFilter) => void;
  counts: { all: number; normal: number; low: number; out: number };
}

export function InventoryToolbar({ search, onSearchChange, filter, onFilterChange, counts }: InventoryToolbarProps) {
  return (
    <div className="space-y-2">
      <InventorySearch value={search} onChange={onSearchChange} />
      <InventoryFilter active={filter} onChange={onFilterChange} counts={counts} />
    </div>
  );
}
