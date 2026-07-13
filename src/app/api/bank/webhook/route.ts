import { NextRequest, NextResponse } from "next/server";

interface SnapCallback {
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  transaction_status: "settlement" | "capture" | "deny" | "pending" | "cancel" | "expire" | "refund";
  payment_type: string;
  signature_key: string;
  status_code: string;
}

const VALID_STATUSES = ["settlement", "capture"];

export async function POST(request: NextRequest) {
  try {
    const body: SnapCallback = await request.json();
    const { order_id, transaction_status, gross_amount, payment_type } = body;

    if (!order_id || !transaction_status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const isSuccess = VALID_STATUSES.includes(transaction_status);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order_id,
        status: isSuccess ? "LUNAS" : transaction_status.toUpperCase(),
        amount: Number(gross_amount || 0),
        paymentMethod: payment_type || "unknown",
        reconciledAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ message: `Invalid payload: ${(error as Error).message}` }, { status: 400 });
  }
}
