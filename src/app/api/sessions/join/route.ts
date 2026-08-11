import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
  }

  const normalized = code.trim().toUpperCase();

  const room = await prisma.session.findUnique({
    where: { code: normalized },
    include: { members: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
  }

  if (room.status === "CLOSED") {
    return NextResponse.json({ error: "Esta sala já foi finalizada" }, { status: 400 });
  }

  const already = room.members.find((m) => m.userId === session.user.id);
  if (!already) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    await prisma.sessionMember.create({
      data: {
        sessionId: room.id,
        userId: session.user.id,
        displayName: user?.name || "Convidado",
        isDrinker: true,
      },
    });

    const data = (room.data as any) || { people: [], items: [], tipPercent: 10 };
    const people = data.people || [];
    if (!people.find((p: any) => p.id === session.user.id)) {
      people.push({
        id: session.user.id,
        name: user?.name || "Convidado",
        isDrinker: true,
      });
      await prisma.session.update({
        where: { id: room.id },
        data: { data: { ...data, people } },
      });
    }
  }

  return NextResponse.json({ code: room.code, title: room.title });
}
