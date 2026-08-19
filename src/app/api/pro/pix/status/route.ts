import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPaymentStatus } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const paymentId = req.nextUrl.searchParams.get("id");
  if (!paymentId) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }

  if (
    paymentId.startsWith("mock_") &&
    req.nextUrl.searchParams.get("mock_confirm") === "1" &&
    !(process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN)
  ) {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 6);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isPro: true, proExpiresAt: expires },
    });
    return NextResponse.json({
      status: "approved",
      isPro: true,
      proExpiresAt: expires.toISOString(),
    });
  }

  try {
    const payment = await getPaymentStatus(paymentId);

    if (payment.status === "approved") {
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 6);

      await prisma.user.update({
        where: { id: session.user.id },
        data: { isPro: true, proExpiresAt: expires },
      });

      return NextResponse.json({
        status: "approved",
        isPro: true,
        proExpiresAt: expires.toISOString(),
      });
    }

    return NextResponse.json({
      status: payment.status,
      statusDetail: payment.statusDetail,
      isPro: false,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao consultar pagamento" },
      { status: 500 }
    );
  }
}
