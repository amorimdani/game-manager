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

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 min
let cache: CacheEntry | null = null;

const FALLBACK_UPCOMING: UpcomingGameItem[] = [
  {
    externalId: "curated-gta6",
    title: "Grand Theft Auto VI",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/271590/header.jpg",
    platform: "PS5, Xbox Series",
    genre: "Action-Adventure",
    releaseDate: "Em breve",
    source: "curated",
  },
  {
    externalId: "curated-hollow-knight-silksong",
    title: "Hollow Knight: Silksong",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1030300/header.jpg",
    platform: "PC, Switch, PS5, Xbox",
    genre: "Metroidvania",
    releaseDate: "Em breve",
    source: "curated",
    storeUrl: "https://store.steampowered.com/app/1030300/",
  },
  {
    externalId: "curated-fable",
    title: "Fable",
    coverUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2769570/header.jpg",
    platform: "PC, Xbox Series",
    genre: "Action RPG",
    releaseDate: "Em breve",
    source: "curated",
  },
];

interface SteamComingItem {
  id: number;
  name: string;
  large_capsule_image?: string;
  header_image?: string;
  windows_available?: boolean;
  mac_available?: boolean;
  linux_available?: boolean;
}

async function fetchFromSteam(): Promise<UpcomingGameItem[]> {
  const res = await fetch(
    "https://store.steampowered.com/api/featuredcategories?cc=br&l=portuguese",
    {
      headers: { "User-Agent": "LudusGameManager/1.0" },
      signal: AbortSignal.timeout(7000),
    }
  );
  if (!res.ok) throw new Error(`Steam API ${res.status}`);
  const data = (await res.json()) as {
    coming_soon?: { items?: SteamComingItem[] };
  };
  const raw = data?.coming_soon?.items ?? [];
  const seen = new Set<number>();
  const items: UpcomingGameItem[] = [];

  for (const item of raw) {
    if (!item?.id || !item?.name || seen.has(item.id)) continue;
    seen.add(item.id);
    const platforms: string[] = [];
    if (item.windows_available) platforms.push("PC");
    if (item.mac_available) platforms.push("Mac");
    if (item.linux_available) platforms.push("Linux");

    items.push({
      externalId: `steam-${item.id}`,
      title: item.name,
      coverUrl:
        item.header_image ||
        item.large_capsule_image ||
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
      platform: platforms.length ? platforms.join(", ") : "PC",
      genre: "Em Breve na Steam",
      releaseDate: "Em breve",
      source: "steam",
      storeUrl: `https://store.steampowered.com/app/${item.id}/`,
    });
  }
  return items.slice(0, 18);
}

async function fetchFromRawg(apiKey: string): Promise<UpcomingGameItem[]> {
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const url = `https://api.rawg.io/api/games?key=${encodeURIComponent(
    apiKey
  )}&dates=${today},${nextYear}&ordering=-added&page_size=18`;

  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`RAWG API ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      name: string;
      background_image?: string;
      released?: string;
      genres?: Array<{ name: string }>;
      parent_platforms?: Array<{ platform: { name: string } }>;
    }>;
  };
  return (data.results ?? []).map((g) => ({
    externalId: `rawg-${g.id}`,
    title: g.name,
    coverUrl: g.background_image || "",
    platform:
      g.parent_platforms?.map((p) => p.platform.name).slice(0, 3).join(", ") ||
      "Multiplataforma",
    genre: g.genres?.[0]?.name || "Game",
    releaseDate: g.released || "Em breve",
    source: "rawg" as const,
  }));
}

export async function getUpcomingReleases(): Promise<{
  items: UpcomingGameItem[];
  source: string;
}> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { items: cache.items, source: cache.items[0]?.source || "cache" };
  }

  try {
    const rawgKey = process.env.RAWG_API_KEY;
    const items = rawgKey
      ? await fetchFromRawg(rawgKey)
      : await fetchFromSteam();

    if (items.length > 0) {
      cache = { items, fetchedAt: Date.now() };
      return { items, source: items[0].source };
    }
  } catch (err) {
    console.warn("[upcoming] Failed to fetch external API:", err);
  }

  return { items: FALLBACK_UPCOMING, source: "curated" };
}
