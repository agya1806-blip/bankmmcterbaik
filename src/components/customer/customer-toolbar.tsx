"use client";
import React from "react";
import { CustomerSearch } from "./customer-search";
import { CustomerFilter } from "./customer-filter";
import type { CustomerStatus } from "./customer-types";

interface CustomerToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterStatus: CustomerStatus;
  onFilterStatusChange: (status: CustomerStatus) => void;
}

export function CustomerToolbar({
  searchValue,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
}: CustomerToolbarProps) {
  return (
    <div className="space-y-2">
      <CustomerSearch value={searchValue} onChange={onSearchChange} />
      <CustomerFilter filterStatus={filterStatus} onFilterStatusChange={onFilterStatusChange} />
    </div>
  );
}