import { NextRequest, NextResponse } from "next/server";
import { GameStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const VALID_STATUSES = new Set<string>(Object.values(GameStatus));

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.game.findFirst({
    where: { id, userId: user.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const body = (await req.json()) as {
    title?: string;
    coverUrl?: string | null;
    platform?: string | null;
    genre?: string | null;
    releaseDate?: string | null;
    status?: string;
    rating?: number | null;
    notes?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (body.coverUrl !== undefined) {
    data.coverUrl = body.coverUrl?.trim() || null;
  }
  if (body.platform !== undefined) {
    data.platform = body.platform?.trim() || null;
  }
  if (body.genre !== undefined) {
    data.genre = body.genre?.trim() || null;
  }
  if (body.releaseDate !== undefined) {
    data.releaseDate = body.releaseDate?.trim() || null;
  }
  if (body.notes !== undefined) {
    data.notes = body.notes?.trim() || null;
  }
  if (body.status && VALID_STATUSES.has(body.status)) {
    data.status = body.status as GameStatus;
  }
  if (body.rating !== undefined) {
    data.rating =
      typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
        ? Math.round(body.rating)
        : null;
  }

  const game = await prisma.game.update({
    where: { id },
    data,
  });

  return NextResponse.json({ game });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.game.findFirst({
    where: { id, userId: user.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  await prisma.game.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
