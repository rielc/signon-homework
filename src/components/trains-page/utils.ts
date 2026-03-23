import { getTrainDisplayName, type Train } from "../../types";

export const FACET_KEYS = ["train.id", "trainType", "operator"] as const;
export type TrainFacetKey = (typeof FACET_KEYS)[number];

export const GROUP_BY_KEYS = ["trainType", "operator"] as const;
export type TrainGroupByKey = (typeof GROUP_BY_KEYS)[number];

export const GROUP_BY_OPTIONS: { value: TrainGroupByKey; label: string }[] = [
  { value: "trainType", label: "Zugtyp" },
  { value: "operator", label: "Verkehrsbetreiber" },
];

export const SORT_KEYS = [
  "name",
  "trainType",
  "trainNumber",
  "operator",
] as const;
export type TrainSortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export const DEFAULT_SORT: { key: TrainSortKey; dir: SortDir } = {
  key: "name",
  dir: "asc",
};

export const SORT_LABELS: Record<TrainSortKey, string> = {
  name: "Name",
  trainType: "Zugtyp",
  trainNumber: "Zugnummer",
  operator: "Verkehrsbetreiber",
};

export const SORT_OPTIONS: { value: string; label: string }[] = SORT_KEYS.flatMap(
  (key) => [
    { value: `${key}:asc`, label: `${SORT_LABELS[key]} (aufsteigend)` },
    { value: `${key}:desc`, label: `${SORT_LABELS[key]} (absteigend)` },
  ],
);

function getSortValue(train: Train, key: TrainSortKey): string {
  if (key === "name") return getTrainDisplayName(train);
  return train[key] ?? "";
}

export function sortTrains(
  trains: Train[],
  key: TrainSortKey,
  dir: SortDir,
): Train[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...trains].sort(
    (a, b) => getSortValue(a, key).localeCompare(getSortValue(b, key)) * factor,
  );
}

export const COLUMN_COUNT = 6;
export const EMPTY_GROUP_LABEL = "—";

export function getGroupValue(train: Train, key: TrainGroupByKey): string {
  const v = train[key];
  return v && v.length > 0 ? v : EMPTY_GROUP_LABEL;
}

export function partition(
  trains: Train[],
  key: TrainGroupByKey,
): { label: string; items: Train[] }[] {
  const map = new Map<string, Train[]>();
  for (const t of trains) {
    const g = getGroupValue(t, key);
    const arr = map.get(g) ?? [];
    arr.push(t);
    map.set(g, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === EMPTY_GROUP_LABEL) return 1;
      if (b === EMPTY_GROUP_LABEL) return -1;
      return a.localeCompare(b);
    })
    .map(([label, items]) => ({ label, items }));
}
