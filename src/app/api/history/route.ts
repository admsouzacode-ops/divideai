import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FREE_LIMIT = 5;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  });

  const history = await prisma.splitHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: user?.isPro ? 100 : FREE_LIMIT,
  });

  return NextResponse.json(
    history.map((h) => ({
      id: h.id,
      title: h.title,
      mode: h.mode,
      total: Number(h.total),
      peopleCount: h.peopleCount,
      data: h.data,
      createdAt: h.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { title, mode, total, peopleCount, data } = body;

  if (!title || !mode || total == null || !peopleCount) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  });

  if (!user?.isPro) {
    const count = await prisma.splitHistory.count({
      where: { userId: session.user.id },
    });
    if (count >= FREE_LIMIT) {
      const oldest = await prisma.splitHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
        take: count - FREE_LIMIT + 1,
        select: { id: true },
      });
      await prisma.splitHistory.deleteMany({
        where: { id: { in: oldest.map((o) => o.id) } },
      });
    }
  }

  const item = await prisma.splitHistory.create({
    data: {
      userId: session.user.id,
      title,
      mode,
      total,
      peopleCount,
      data: data ?? {},
    },
  });

  return NextResponse.json(
    {
      id: item.id,
      title: item.title,
      mode: item.mode,
      total: Number(item.total),
      peopleCount: item.peopleCount,
      data: item.data,
      createdAt: item.createdAt.toISOString(),
    },
    { status: 201 }
  );
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await prisma.splitHistory.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
