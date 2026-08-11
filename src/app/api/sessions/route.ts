import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, generateSessionCode } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const rooms = await prisma.session.findMany({
    where: {
      OR: [
        { createdById: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      createdBy: { select: { name: true } },
      members: { select: { id: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json(
    rooms.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      mode: r.mode,
      status: r.status,
      totalAmount: r.totalAmount ? Number(r.totalAmount) : null,
      createdBy: r.createdBy.name,
      memberCount: r.members.length,
      commentCount: r._count.comments,
      updatedAt: r.updatedAt.toISOString(),
      isOwner: r.createdById === session.user.id,
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true, name: true },
  });

  const body = await req.json();
  const title = (body.title as string)?.trim() || "Churrasco";
  const mode = body.mode === "NORMAL" ? "NORMAL" : "BBQ";

  let code = generateSessionCode(6);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.session.findUnique({ where: { code } });
    if (!exists) break;
    code = generateSessionCode(6);
  }

  const room = await prisma.session.create({
    data: {
      code,
      title,
      mode: mode as "NORMAL" | "BBQ",
      createdById: session.user.id,
      data: {
        people: [{ id: session.user.id, name: user?.name || "Eu", isDrinker: true }],
        items: [],
        tipPercent: 10,
        categories: mode === "BBQ" ? ["Carne", "Bebida", "Extra"] : [],
        categoriesReady: mode === "BBQ",
      },
      members: {
        create: {
          userId: session.user.id,
          displayName: user?.name || "Eu",
          isDrinker: true,
        },
      },
    },
  });

  return NextResponse.json(
    { id: room.id, code: room.code, title: room.title, mode: room.mode },
    { status: 201 }
  );
}
