"use client";
import React from "react";
import { Star, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Customer } from "./customer-types";

interface CustomerRewardCardProps {
  customer: Customer;
  onRedeem: (customer: Customer) => void;
}

export function CustomerRewardCard({ customer, onRedeem }: CustomerRewardCardProps) {
  return (
    <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Star className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[9px] text-amber-600/80 dark:text-amber-400/80 font-bold uppercase tracking-wider">Poin Reward</p>
            <p className="text-sm font-extrabold text-amber-700 dark:text-amber-300">{customer.poin.toLocaleString()} poin</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRedeem(customer)}
          disabled={customer.poin <= 0}
          className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
        >
          <Gift className="w-3.5 h-3.5" /> Tukar
        </Button>
      </div>
    </Card>
  );
}