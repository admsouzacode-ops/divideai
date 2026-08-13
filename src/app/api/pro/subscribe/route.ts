import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Ativa assinatura Pro por 6 meses.
 * Por enquanto é mock (sem cobrança real).
 * Depois: integrar Mercado Pago Subscriptions / Checkout Pro.
 */
export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Faça login para assinar o Pro" },
      { status: 401 }
    );
  }

  const expires = new Date();
  expires.setMonth(expires.getMonth() + 6);

  const user = await prisma.user.update({
    where: { email: session.user.email.toLowerCase() },
    data: {
      isPro: true,
      proExpiresAt: expires,
    },
    select: {
      id: true,
      isPro: true,
      proExpiresAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    isPro: user.isPro,
    proExpiresAt: user.proExpiresAt?.toISOString() ?? null,
    message: "Assinatura Pro ativada por 6 meses",
  });
}
