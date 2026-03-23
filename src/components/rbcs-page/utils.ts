import type { RBC, RBCStatus } from "../../types";

export const statusConfig: Record<
  RBCStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  operational: { label: "Betriebsbereit", variant: "default" },
  maintenance: { label: "Wartung", variant: "secondary" },
  decommissioned: { label: "Außer Betrieb", variant: "outline" },
};

export const FACET_KEYS = [
  "rbc.id",
  "manufacturer",
  "location",
  "status",
] as const;
export type RBCFacetKey = (typeof FACET_KEYS)[number];

export const GROUP_BY_KEYS = ["manufacturer", "location", "status"] as const;
export type RBCGroupByKey = (typeof GROUP_BY_KEYS)[number];

export const GROUP_BY_OPTIONS: { value: RBCGroupByKey; label: string }[] = [
  { value: "manufacturer", label: "Hersteller" },
  { value: "location", label: "Standort" },
  { value: "status", label: "Status" },
];

export const SORT_KEYS = [
  "name",
  "manufacturer",
  "location",
  "status",
] as const;
export type RBCSortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";

export const DEFAULT_SORT: { key: RBCSortKey; dir: SortDir } = {
  key: "name",
  dir: "asc",
};

export const SORT_LABELS: Record<RBCSortKey, string> = {
  name: "Name",
  manufacturer: "Hersteller",
  location: "Standort",
  status: "Status",
};

export const SORT_OPTIONS: { value: string; label: string }[] = SORT_KEYS.flatMap(
  (key) => [
    { value: `${key}:asc`, label: `${SORT_LABELS[key]} (aufsteigend)` },
    { value: `${key}:desc`, label: `${SORT_LABELS[key]} (absteigend)` },
  ],
);

function getSortValue(rbc: RBC, key: RBCSortKey): string {
  if (key === "status") return statusConfig[rbc.status].label;
  return rbc[key] ?? "";
}

export function sortRBCs(
  rbcs: RBC[],
  key: RBCSortKey,
  dir: SortDir,
): RBC[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...rbcs].sort(
    (a, b) => getSortValue(a, key).localeCompare(getSortValue(b, key)) * factor,
  );
}

export const COLUMN_COUNT = 6;
export const EMPTY_GROUP_LABEL = "—";

function getGroupLabel(rbc: RBC, key: RBCGroupByKey): string {
  if (key === "status") return statusConfig[rbc.status].label;
  const v = rbc[key];
  return v && v.length > 0 ? v : EMPTY_GROUP_LABEL;
}

export function partition(
  rbcs: RBC[],
  key: RBCGroupByKey,
): { label: string; items: RBC[] }[] {
  const map = new Map<string, RBC[]>();
  for (const r of rbcs) {
    const g = getGroupLabel(r, key);
    const arr = map.get(g) ?? [];
    arr.push(r);
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
