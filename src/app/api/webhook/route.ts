import { NextRequest, NextResponse } from "next/server";

/* ─── SNAP API / Payment Gateway Simulator ─── */

interface WebhookPayload {
  event: "payment.success" | "payment.failed" | "payment.refund";
  invoiceNumber?: string;
  transactionId?: string;
  amount: number;
  method: "TRANSFER" | "QRIS" | "CASH" | "DEPOSIT";
  timestamp: string;
  signature?: string;
}

interface WebhookResponse {
  status: "ok" | "error";
  message: string;
  updatedTransaction?: boolean;
}

/* ─── POST /api/webhook ─── */

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();

    if (!payload.event || !payload.invoiceNumber) {
      return NextResponse.json<WebhookResponse>(
        { status: "error", message: "Payload tidak valid: event dan invoiceNumber wajib" },
        { status: 400 }
      );
    }

    if (payload.event !== "payment.success") {
      return NextResponse.json<WebhookResponse>(
        { status: "ok", message: `Event ${payload.event} diterima, tidak ada aksi` }
      );
    }

    console.log(
      `[WEBHOOK] Pembayaran sukses: ${payload.invoiceNumber} - Rp${payload.amount.toLocaleString()} via ${payload.method}`
    );

    /*
     * Dalam produksi nyata, endpoint ini akan:
     * 1. Verifikasi signature dengan API key merchant
     * 2. Cari transaksi di DB berdasarkan invoiceNumber
     * 3. Update status menjadi LUNAS
     * 4. Buat cashflow entry
     * 5. Kirim notifikasi WA ke pelanggan
     *
     * Karena ini IndexedDB (client-side), update dilakukan oleh client
     * setelah mendeteksi webhook melalui Service Worker atau polling.
     */

    return NextResponse.json<WebhookResponse>({
      status: "ok",
      message: `Webhook ${payload.event} untuk ${payload.invoiceNumber} berhasil diproses (simulasi)`,
      updatedTransaction: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[WEBHOOK] Error:", message);
    return NextResponse.json<WebhookResponse>(
      { status: "error", message: `Internal error: ${message}` },
      { status: 500 }
    );
  }
}

/* ─── GET /api/webhook (health check) ─── */

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "MMCBANK Payment Webhook",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
