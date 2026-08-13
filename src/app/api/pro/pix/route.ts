import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPixPayment, isMercadoPagoConfigured, PRO_PRICE, PRO_MONTHS } from "@/lib/mercadopago";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json(
      { error: "Faça login para assinar o Pro" },
      { status: 401 }
    );
  }

  try {
    const payment = await createPixPayment({
      email: session.user.email,
      name: session.user.name || "Cliente",
      userId: session.user.id,
      externalReference: `pro_${session.user.id}_${Date.now()}`,
    });

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      ticketUrl: payment.ticketUrl,
      expiresAt: payment.expiresAt,
      amount: PRO_PRICE,
      months: PRO_MONTHS,
      mock: !isMercadoPagoConfigured(),
    });
  } catch (e: any) {
    console.error("[PIX] create error", e);
    return NextResponse.json(
      { error: e.message || "Não foi possível gerar o PIX" },
      { status: 500 }
    );
  }
}
