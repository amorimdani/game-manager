import { NextRequest, NextResponse } from "next/server";
import { GameStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const VALID_STATUSES = new Set<string>(Object.values(GameStatus));

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const where: {
    userId: string;
    status?: GameStatus;
    title?: { contains: string; mode: "insensitive" };
  } = { userId: user.userId };

  if (statusParam && VALID_STATUSES.has(statusParam)) {
    where.status = statusParam as GameStatus;
  }
  if (q) {
    where.title = { contains: q, mode: "insensitive" };
  }

  const games = await prisma.game.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ games });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      title?: string;
      coverUrl?: string;
      platform?: string;
      genre?: string;
      releaseDate?: string;
      status?: string;
      rating?: number | null;
      notes?: string;
      externalId?: string;
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json(
        { error: "O nome do jogo é obrigatório." },
        { status: 400 }
      );
    }

    const status =
      body.status && VALID_STATUSES.has(body.status)
        ? (body.status as GameStatus)
        : GameStatus.BACKLOG;

    const rating =
      typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
        ? Math.round(body.rating)
        : null;

    const game = await prisma.game.create({
      data: {
        userId: user.userId,
        title,
        coverUrl: body.coverUrl?.trim() || null,
        platform: body.platform?.trim() || null,
        genre: body.genre?.trim() || null,
        releaseDate: body.releaseDate?.trim() || null,
        status,
        rating,
        notes: body.notes?.trim() || null,
        externalId: body.externalId?.trim() || null,
      },
    });

    return NextResponse.json({ game }, { status: 201 });
  } catch (err) {
    console.error("[games POST]", err);
    return NextResponse.json({ error: "Erro ao salvar jogo." }, { status: 500 });
  }
}
