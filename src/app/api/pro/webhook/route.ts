import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || body.action;
    const paymentId = body.data?.id || body.id;

    console.log("[MP webhook]", type, paymentId);

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    if (type && !String(type).includes("payment")) {
      return NextResponse.json({ ok: true });
    }

    const payment = await getPaymentStatus(paymentId);

    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, status: payment.status });
    }

    const ref = payment.externalReference || "";
    let userId = ref;
    if (ref.startsWith("pro_")) {
      const parts = ref.split("_");
      userId = parts[1] || ref;
    }

    if (!userId) {
      console.warn("[MP webhook] sem external_reference", paymentId);
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: userId }],
      },
    });

    if (!user) {
      console.warn("[MP webhook] user não encontrado", userId);
      return NextResponse.json({ ok: true });
    }

    let base = new Date();
    if (user.isPro && user.proExpiresAt && user.proExpiresAt > base) {
      base = user.proExpiresAt;
    }
    const newExpires = new Date(base);
    newExpires.setMonth(newExpires.getMonth() + 6);

    await prisma.user.update({
      where: { id: user.id },
      data: { isPro: true, proExpiresAt: newExpires },
    });

    console.log("[MP webhook] Pro ativado", user.id, newExpires.toISOString());

    return NextResponse.json({ ok: true, activated: true });
  } catch (e: any) {
    console.error("[MP webhook] error", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "paga-juntos-webhook" });
}
