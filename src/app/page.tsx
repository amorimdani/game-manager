import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GameManagerApp } from "@/components/GameManagerApp";
import type { GameItem } from "@/components/GameModal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSessionUser();

  let initialGames: GameItem[] = [];
  if (session) {
    const rows = await prisma.game.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
    });
    initialGames = rows.map((r) => ({
      id: r.id,
      title: r.title,
      coverUrl: r.coverUrl,
      platform: r.platform,
      genre: r.genre,
      releaseDate: r.releaseDate,
      status: r.status,
      rating: r.rating,
      notes: r.notes,
      externalId: r.externalId,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  return (
    <GameManagerApp
      initialUser={
        session
          ? { id: session.userId, email: session.email, name: session.name }
          : null
      }
      initialGames={initialGames}
    />
  );
}
