import { Book, Store, Coins, ShoppingCart, ClipboardList, type LucideIcon } from "lucide-react";
import type { WorkspaceType } from "@/lib/db";

const ICON_MAP: Record<string, LucideIcon> = {
  pribadi: Book,
  usaha: Store,
  modal: Coins,
  toko: ShoppingCart,
  hutang: ClipboardList,
};

export const WORKSPACE_ICON_NAMES: Record<string, string> = {
  pribadi: "Book",
  usaha: "Store",
  modal: "Coins",
  toko: "ShoppingCart",
  hutang: "ClipboardList",
};

export function getWorkspaceIcon(type: WorkspaceType | string): LucideIcon {
  return ICON_MAP[type] || Book;
}

export function WorkspaceIcon({ type, className }: { type: WorkspaceType | string; className?: string }) {
  const Icon = getWorkspaceIcon(type);
  return <Icon className={className} />;
}
