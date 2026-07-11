"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditInvoiceRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/orders"); }, [router]);
  return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Mengarahkan...</p></div>;
}
