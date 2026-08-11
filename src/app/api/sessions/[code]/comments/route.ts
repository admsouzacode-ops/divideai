import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { code: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const code = params.code.toUpperCase();
  const room = await prisma.session.findUnique({
    where: { code },
    include: { members: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  const isMember =
    room.createdById === session.user.id ||
    room.members.some((m) => m.userId === session.user.id);

  if (!isMember) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Comentário vazio" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      sessionId: room.id,
      userId: session.user.id,
      content: content.trim().slice(0, 500),
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(
    {
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      userName: comment.user.name,
      createdAt: comment.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
