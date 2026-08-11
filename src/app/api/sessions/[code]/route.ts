import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { code: string } };

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const code = params.code.toUpperCase();

  const room = await prisma.session.findUnique({
    where: { code },
    include: {
      createdBy: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: "asc" },
      },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const isMember =
    room.createdById === session.user.id ||
    room.members.some((m) => m.userId === session.user.id);

  if (!isMember) {
    return NextResponse.json(
      { error: "Você não faz parte desta sala. Entre com o código." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    id: room.id,
    code: room.code,
    title: room.title,
    mode: room.mode,
    status: room.status,
    tipPercent: room.tipPercent,
    totalAmount: room.totalAmount ? Number(room.totalAmount) : null,
    data: room.data,
    isOwner: room.createdById === session.user.id,
    createdBy: room.createdBy,
    members: room.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.displayName || m.user.name,
      isDrinker: m.isDrinker,
      amountDue: m.amountDue ? Number(m.amountDue) : null,
    })),
    comments: room.comments.map((c) => ({
      id: c.id,
      content: c.content,
      userId: c.userId,
      userName: c.user.name,
      createdAt: c.createdAt.toISOString(),
    })),
    updatedAt: room.updatedAt.toISOString(),
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const code = params.code.toUpperCase();
  const room = await prisma.session.findUnique({ where: { code } });

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const member = await prisma.sessionMember.findFirst({
    where: { sessionId: room.id, userId: session.user.id },
  });
  if (!member && room.createdById !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const update: any = {};

  if (body.title) update.title = body.title;
  if (body.tipPercent != null) update.tipPercent = body.tipPercent;
  if (body.data) update.data = body.data;
  if (body.status === "CLOSED" || body.status === "OPEN") update.status = body.status;
  if (body.totalAmount != null) update.totalAmount = body.totalAmount;
  if (body.memberAmounts && Array.isArray(body.memberAmounts)) {
    for (const ma of body.memberAmounts) {
      await prisma.sessionMember.updateMany({
        where: { sessionId: room.id, userId: ma.userId },
        data: { amountDue: ma.amount },
      });
    }
  }

  const updated = await prisma.session.update({
    where: { id: room.id },
    data: update,
  });

  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt.toISOString() });
}
