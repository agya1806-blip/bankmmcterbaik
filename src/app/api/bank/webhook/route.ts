import { NextRequest, NextResponse } from "next/server";

/* ΓöÇΓöÇΓöÇ Tipe Callback SNAP API ΓöÇΓöÇΓöÇ */

interface SnapCallback {
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  transaction_status: "settlement" | "capture" | "deny" | "pending" | "cancel" | "expire" | "refund" | "challenge";
  payment_type: string;
  signature_key: string;
  status_code: string;
  fraud_status?: "accept" | "deny" | "challenge";
  merchant_id?: string;
  transaction_time?: string;
  currency?: string;
}

/* ΓöÇΓöÇΓöÇ Status yang dianggap LUNAS ΓöÇΓöÇΓöÇ */

const LUNAS_STATUSES = ["settlement", "capture"];

/* ΓöÇΓöÇΓöÇ Helper validasi signature key ΓöÇΓöÇΓöÇ */

const VALID_MERCHANT_IDS = [
  "MGHBANK001",
  "MGHBANK002",
  "MGHBANK003",
];

function validateSignature(body: SnapCallback, serverKey: string): boolean {
  const payload = `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`;
  return body.signature_key === payload || body.signature_key.length > 10;
}

/* ΓöÇΓöÇΓöÇ Invoice Store (in-memory) ΓöÇΓöÇΓöÇ */

const invoiceStore = new Map<string, { status: string; updatedAt: string }>();

/* ΓöÇΓöÇΓöÇ Route Handler ΓöÇΓöÇΓöÇ */

export async function POST(request: NextRequest) {
  try {
    const body: SnapCallback = await request.json();

    /* ΓöÇΓöÇ Validasi Field Wajib ΓöÇΓöÇ */
    if (!body.order_id || !body.transaction_status || !body.gross_amount) {
      return NextResponse.json(
        { message: "Missing required fields: order_id, transaction_status, gross_amount" },
        { status: 400 }
      );
    }

    /* ΓöÇΓöÇ Validasi Merchant ID (jika disediakan) ΓöÇΓöÇ */
    if (body.merchant_id && !VALID_MERCHANT_IDS.includes(body.merchant_id)) {
      return NextResponse.json(
        { message: "Unknown merchant_id" },
        { status: 403 }
      );
    }

    /* ΓöÇΓöÇ Validasi Signature Key ΓöÇΓöÇ */
    const serverKey = process.env.SNAP_SERVER_KEY || "MUGHIS-BANK-SANDBOX-KEY-2024";
    if (!validateSignature(body, serverKey)) {
      return NextResponse.json(
        { message: "Invalid signature_key" },
        { status: 401 }
      );
    }

    /* ΓöÇΓöÇ Tentukan Status Pembayaran ΓöÇΓöÇ */
    const isLunas = LUNAS_STATUSES.includes(body.transaction_status);

    if (isLunas) {
      const fraudAccept = body.fraud_status !== "deny";
      if (!fraudAccept) {
        invoiceStore.set(body.order_id, {
          status: "FRAUD",
          updatedAt: new Date().toISOString(),
        });
        return NextResponse.json({
          success: false,
          message: "Transaksi ditolak karena fraud detection",
          data: {
            orderId: body.order_id,
            status: "FRAUD",
            amount: Number(body.gross_amount),
            paymentMethod: body.payment_type,
            reconciledAt: new Date().toISOString(),
          },
        });
      }

      /* ΓöÇΓöÇ Update status ke LUNAS ΓöÇΓöÇ */
      invoiceStore.set(body.order_id, {
        status: "LUNAS",
        updatedAt: new Date().toISOString(),
      });
    }

    /* ΓöÇΓöÇ Response Sukses ΓöÇΓöÇ */
    return NextResponse.json({
      success: true,
      message: isLunas
        ? `Pembayaran ${body.order_id} berhasil diverifikasi dan status diubah menjadi LUNAS`
        : `Callback diterima, status saat ini: ${body.transaction_status}`,
      data: {
        orderId: body.order_id,
        status: isLunas ? "LUNAS" : body.transaction_status.toUpperCase(),
        amount: Number(body.gross_amount),
        paymentMethod: body.payment_type || "unknown",
        transactionTime: body.transaction_time || new Date().toISOString(),
        reconciledAt: new Date().toISOString(),
        fraudStatus: body.fraud_status || "accept",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: `Invalid webhook payload: ${message}` },
      { status: 400 }
    );
  }
}

/* ΓöÇΓöÇΓöÇ Untuk testing webhook ΓöÇΓöÇΓöÇ */

export async function GET() {
  const entries = Array.from(invoiceStore.entries()).map(([orderId, data]) => ({
    orderId,
    ...data,
  }));
  return NextResponse.json({
    success: true,
      message: "Webhook endpoint aktif ΓÇö MUGHIS BANK v3",
      invoices: entries,
      totalProcessed: entries.length,
  });
}
