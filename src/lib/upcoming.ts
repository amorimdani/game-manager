export interface UpcomingGameItem {
  externalId: string;
  title: string;
  coverUrl: string;
  platform: string;
  genre: string;
  releaseDate: string;
  source: "steam" | "rawg" | "curated";
  storeUrl?: string;
}

interface CacheEntry {
  items: UpcomingGameItem[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 1000 * 60 * 30;
let catalogCache: CacheEntry | null = null;
const searchCache = new Map<string, CacheEntry>();

const EPIC_CURATED: UpcomingGameItem[] = [
  {
    externalId: "steam-271590",
    title: "Grand Theft Auto V",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg",
    platform: "PC, PS5, Xbox",
    genre: "Ação · Mundo Aberto",
    releaseDate: "Clássico",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/271590/",
  },
  {
    externalId: "steam-1245620",
    title: "Elden Ring",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
    platform: "PC, PS5, Xbox",
    genre: "Action RPG",
    releaseDate: "Épico",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/1245620/",
  },
  {
    externalId: "steam-1091500",
    title: "Cyberpunk 2077",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg",
    platform: "PC, PS5, Xbox",
    genre: "RPG · Sci-Fi",
    releaseDate: "Épico",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/1091500/",
  },
  {
    externalId: "steam-1086940",
    title: "Baldur's Gate 3",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/header.jpg",
    platform: "PC, PS5, Xbox",
    genre: "RPG",
    releaseDate: "Épico",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/1086940/",
  },
  {
    externalId: "steam-1174180",
    title: "Red Dead Redemption 2",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg",
    platform: "PC, PS4, Xbox",
    genre: "Ação · Narrativo",
    releaseDate: "Épico",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/1174180/",
  },
  {
    externalId: "steam-1030300",
    title: "Hollow Knight: Silksong",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1030300/header.jpg",
    platform: "PC, Switch, PS5, Xbox",
    genre: "Metroidvania",
    releaseDate: "Em breve",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/1030300/",
  },
  {
    externalId: "steam-292030",
    title: "The Witcher 3: Wild Hunt",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/292030/header.jpg",
    platform: "PC, PS5, Switch, Xbox",
    genre: "Action RPG",
    releaseDate: "Épico",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/292030/",
  },
  {
    externalId: "steam-2358720",
    title: "Black Myth: Wukong",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg",
    platform: "PC, PS5",
    genre: "Action RPG",
    releaseDate: "Popular",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/2358720/",
  },
];

interface SteamCategoryItem {
  id: number;
  name: string;
  large_capsule_image?: string;
  header_image?: string;
  windows_available?: boolean;
  mac_available?: boolean;
  linux_available?: boolean;
}

function mapSteamCategoryItems(
  raw: SteamCategoryItem[] | undefined,
  tag: string,
  seen: Set<number>
): UpcomingGameItem[] {
  const out: UpcomingGameItem[] = [];
  for (const item of raw ?? []) {
    if (!item?.id || !item?.name || seen.has(item.id)) continue;
    seen.add(item.id);
    const platforms: string[] = [];
    if (item.windows_available) platforms.push("PC");
    if (item.mac_available) platforms.push("Mac");
    if (item.linux_available) platforms.push("Linux");

    out.push({
      externalId: `steam-${item.id}`,
      title: item.name,
      coverUrl:
        item.header_image ||
        item.large_capsule_image ||
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
      platform: platforms.length ? platforms.join(", ") : "PC",
      genre: tag,
      releaseDate: tag,
      source: "steam",
      storeUrl: `https://store.steampowered.com/app/${item.id}/`,
    });
  }
  return out;
}

async function fetchSteamCatalog(): Promise<UpcomingGameItem[]> {
  const res = await fetch(
    "https://store.steampowered.com/api/featuredcategories?cc=br&l=portuguese",
    {
      headers: { "User-Agent": "GameManager/1.0" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) throw new Error(`Steam API ${res.status}`);
  const data = (await res.json()) as {
    coming_soon?: { items?: SteamCategoryItem[] };
    top_sellers?: { items?: SteamCategoryItem[] };
    new_releases?: { items?: SteamCategoryItem[] };
    specials?: { items?: SteamCategoryItem[] };
  };

  const seen = new Set<number>();
  const combined: UpcomingGameItem[] = [
    ...mapSteamCategoryItems(data.coming_soon?.items, "Em Breve", seen),
    ...mapSteamCategoryItems(data.new_releases?.items, "Lançamento", seen),
    ...mapSteamCategoryItems(data.top_sellers?.items, "Mais Vendidos", seen),
    ...mapSteamCategoryItems(data.specials?.items, "Em Destaque", seen),
  ];

  // Merge epic curated games without duplicates
  for (const epic of EPIC_CURATED) {
    const numId = Number(epic.externalId.replace("steam-", ""));
    if (!seen.has(numId)) {
      seen.add(numId);
      combined.push(epic);
    }
  }

  return combined;
}

async function searchSteamGames(query: string): Promise<UpcomingGameItem[]> {
  const normalized = query.trim().toLowerCase();
  const cached = searchCache.get(normalized);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.items;
  }

  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
    query.trim()
  )}&l=portuguese&cc=br`;
  const res = await fetch(url, {
    headers: { "User-Agent": "GameManager/1.0" },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) throw new Error(`Steam search ${res.status}`);
  const data = (await res.json()) as {
    items?: Array<{
      id: number;
      name: string;
      tiny_image?: string;
      platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
    }>;
  };

  const items: UpcomingGameItem[] = (data.items ?? []).slice(0, 30).map((item) => {
    const plats: string[] = [];
    if (item.platforms?.windows) plats.push("PC");
    if (item.platforms?.mac) plats.push("Mac");
    if (item.platforms?.linux) plats.push("Linux");
    return {
      externalId: `steam-${item.id}`,
      title: item.name,
      coverUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
      platform: plats.length ? plats.join(", ") : "PC",
      genre: "Steam Store",
      releaseDate: "Catálogo Steam",
      source: "steam",
      storeUrl: `https://store.steampowered.com/app/${item.id}/`,
    };
  });

  searchCache.set(normalized, { items, fetchedAt: Date.now() });
  return items;
}

export async function getUpcomingReleases(query?: string): Promise<{
  items: UpcomingGameItem[];
  source: string;
}> {
  const q = query?.trim();
  if (q && q.length >= 2) {
    try {
      const items = await searchSteamGames(q);
      return { items, source: "steam-search" };
    } catch (err) {
      console.warn("[upcoming search] Failed:", err);
      const localMatches = EPIC_CURATED.filter((g) =>
        g.title.toLowerCase().includes(q.toLowerCase())
      );
      return { items: localMatches, source: "curated" };
    }
  }

  if (catalogCache && Date.now() - catalogCache.fetchedAt < CACHE_TTL_MS) {
    return { items: catalogCache.items, source: "steam" };
  }

  try {
    const items = await fetchSteamCatalog();
    if (items.length > 0) {
      catalogCache = { items, fetchedAt: Date.now() };
      return { items, source: "steam" };
    }
  } catch (err) {
    console.warn("[upcoming] Failed to fetch external API:", err);
  }

  return { items: EPIC_CURATED, source: "curated" };
}
