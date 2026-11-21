import { PrismaClient, GameStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@ludus.app";
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Jogador Demo",
        passwordHash: hashPassword("ludus1234"),
      },
    });

    await prisma.game.createMany({
      data: [
        {
          userId: user.id,
          title: "Hollow Knight",
          platform: "PC, Switch",
          genre: "Metroidvania",
          status: GameStatus.FAVORITE,
          rating: 5,
          coverUrl:
            "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg",
          notes: "Atmosfera impecável e combate preciso em Hallownest.",
        },
        {
          userId: user.id,
          title: "Elden Ring",
          platform: "PC, PS5",
          genre: "Action RPG",
          status: GameStatus.COMPLETED,
          rating: 5,
          coverUrl:
            "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
          notes: "Exploração sem igual. Zerei com build de Destreza.",
        },
        {
          userId: user.id,
          title: "Hades II",
          platform: "PC",
          genre: "Roguelike",
          status: GameStatus.PLAYING,
          rating: 4,
          coverUrl:
            "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145350/header.jpg",
          notes: "Runs rápidas no fim do dia.",
        },
        {
          userId: user.id,
          title: "Disco Elysium",
          platform: "PC",
          genre: "RPG Narrativo",
          status: GameStatus.BACKLOG,
          coverUrl:
            "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/632470/header.jpg",
          notes: "Próximo da fila quando terminar Hades II.",
        },
      ],
    });
  }

  console.log("Seed concluído:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
