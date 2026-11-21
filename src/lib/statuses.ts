export type GameStatusType =
  | "BACKLOG"
  | "PLAYING"
  | "COMPLETED"
  | "FAVORITE"
  | "DROPPED"
  | "RADAR";

export interface StatusMeta {
  value: GameStatusType;
  label: string;
  shortLabel: string;
  dotClass: string;
}

export const GAME_STATUSES: StatusMeta[] = [
  {
    value: "PLAYING",
    label: "Jogando",
    shortLabel: "Jogando",
    dotClass: "bg-emerald-500",
  },
  {
    value: "BACKLOG",
    label: "Quero Jogar",
    shortLabel: "Backlog",
    dotClass: "bg-sky-500",
  },
  {
    value: "COMPLETED",
    label: "Finalizados",
    shortLabel: "Zerei",
    dotClass: "bg-violet-500",
  },
  {
    value: "FAVORITE",
    label: "Favoritos",
    shortLabel: "Favoritos",
    dotClass: "bg-rose-500",
  },
  {
    value: "DROPPED",
    label: "Dropados",
    shortLabel: "Dropados",
    dotClass: "bg-zinc-400",
  },
  {
    value: "RADAR",
    label: "No Radar",
    shortLabel: "Radar",
    dotClass: "bg-amber-500",
  },
];

export const STATUS_MAP: Record<GameStatusType, StatusMeta> = Object.fromEntries(
  GAME_STATUSES.map((s) => [s.value, s])
) as Record<GameStatusType, StatusMeta>;
