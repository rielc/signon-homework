import { getTrainDisplayName, type Train, type RBC } from "../../types";
import { statusConfig } from "../rbcs-page/utils";

export type SortDir = "asc" | "desc";

export const TRAIN_FACET_KEYS = ["train.id", "train.trainType", "train.operator"] as const;
export type TrainFacetKey = (typeof TRAIN_FACET_KEYS)[number];

export const RBC_FACET_KEYS = [
  "rbc.id",
  "rbc.manufacturer",
  "rbc.location",
  "rbc.status",
] as const;
export type RBCFacetKey = (typeof RBC_FACET_KEYS)[number];

export const FACET_KEYS = [
  ...TRAIN_FACET_KEYS,
  ...RBC_FACET_KEYS,
] as const;
export type MatrixFacetKey = (typeof FACET_KEYS)[number];

export const TRAIN_ATTR_BY_FACET: Record<TrainFacetKey, keyof Train> = {
  "train.id": "id",
  "train.trainType": "trainType",
  "train.operator": "operator",
};

export const RBC_ATTR_BY_FACET: Record<RBCFacetKey, keyof RBC> = {
  "rbc.id": "id",
  "rbc.manufacturer": "manufacturer",
  "rbc.location": "location",
  "rbc.status": "status",
};

export const FACET_LABELS: Record<MatrixFacetKey, string> = {
  "train.id": "Zug",
  "train.trainType": "Zug-Typ",
  "train.operator": "Zug-Betreiber",
  "rbc.id": "RBC",
  "rbc.manufacturer": "RBC-Hersteller",
  "rbc.location": "RBC-Standort",
  "rbc.status": "RBC-Status",
};

export const ROW_SORT_KEYS = ["name", "trainType", "operator"] as const;
export type RowSortKey = (typeof ROW_SORT_KEYS)[number];

const ROW_SORT_LABELS: Record<RowSortKey, string> = {
  name: "Name",
  trainType: "Zugtyp",
  operator: "Verkehrsbetreiber",
};

export const ROW_SORT_OPTIONS: { value: string; label: string }[] =
  ROW_SORT_KEYS.flatMap((key) => [
    { value: `${key}:asc`, label: `${ROW_SORT_LABELS[key]} (aufsteigend)` },
    { value: `${key}:desc`, label: `${ROW_SORT_LABELS[key]} (absteigend)` },
  ]);

export const DEFAULT_ROW_SORT: { key: RowSortKey; dir: SortDir } = {
  key: "name",
  dir: "asc",
};

export const COL_SORT_KEYS = [
  "name",
  "manufacturer",
  "location",
  "status",
] as const;
export type ColSortKey = (typeof COL_SORT_KEYS)[number];

const COL_SORT_LABELS: Record<ColSortKey, string> = {
  name: "Name",
  manufacturer: "Hersteller",
  location: "Standort",
  status: "Status",
};

export const COL_SORT_OPTIONS: { value: string; label: string }[] =
  COL_SORT_KEYS.flatMap((key) => [
    { value: `${key}:asc`, label: `${COL_SORT_LABELS[key]} (aufsteigend)` },
    { value: `${key}:desc`, label: `${COL_SORT_LABELS[key]} (absteigend)` },
  ]);

export const DEFAULT_COL_SORT: { key: ColSortKey; dir: SortDir } = {
  key: "name",
  dir: "asc",
};

// Group option values match TRAIN_FACET_KEYS / RBC_FACET_KEYS so URL params
// and label lookups share one indirection table.
export const ROW_GROUP_OPTIONS: { value: TrainFacetKey; label: string }[] = [
  { value: "train.trainType", label: "Zugtyp" },
  { value: "train.operator", label: "Verkehrsbetreiber" },
];

export const COL_GROUP_OPTIONS: { value: RBCFacetKey; label: string }[] = [
  { value: "rbc.manufacturer", label: "Hersteller" },
  { value: "rbc.location", label: "Standort" },
  { value: "rbc.status", label: "Status" },
];

export const EMPTY_GROUP_LABEL = "—";

function trainSortValue(train: Train, key: RowSortKey): string {
  if (key === "name") return getTrainDisplayName(train);
  return train[key] ?? "";
}

export function sortTrains(
  trains: Train[],
  key: RowSortKey,
  dir: SortDir,
): Train[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...trains].sort(
    (a, b) =>
      trainSortValue(a, key).localeCompare(trainSortValue(b, key)) * factor,
  );
}

function rbcSortValue(rbc: RBC, key: ColSortKey): string {
  if (key === "status") return statusConfig[rbc.status].label;
  return rbc[key] ?? "";
}

export function sortRBCs(rbcs: RBC[], key: ColSortKey, dir: SortDir): RBC[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...rbcs].sort(
    (a, b) => rbcSortValue(a, key).localeCompare(rbcSortValue(b, key)) * factor,
  );
}

function trainGroupLabel(train: Train, key: TrainFacetKey): string {
  const v = train[TRAIN_ATTR_BY_FACET[key]];
  return v && v.length > 0 ? v : EMPTY_GROUP_LABEL;
}

function rbcGroupLabel(rbc: RBC, key: RBCFacetKey): string {
  if (key === "rbc.status") return statusConfig[rbc.status].label;
  const v = rbc[RBC_ATTR_BY_FACET[key]];
  return v && v.length > 0 ? v : EMPTY_GROUP_LABEL;
}

function partition<T>(
  items: T[],
  getLabel: (item: T) => string,
): { label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const g = getLabel(item);
    const arr = map.get(g) ?? [];
    arr.push(item);
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

export function partitionTrains(
  trains: Train[],
  key: TrainFacetKey,
): { label: string; items: Train[] }[] {
  return partition(trains, (t) => trainGroupLabel(t, key));
}

export function partitionRBCs(
  rbcs: RBC[],
  key: RBCFacetKey,
): { label: string; items: RBC[] }[] {
  return partition(rbcs, (r) => rbcGroupLabel(r, key));
}

export interface GroupStart {
  index: number;
  label: string;
  span: number;
}

export function groupStarts<T extends { id: string }>(
  items: T[],
  getLabel: (item: T) => string,
): GroupStart[] {
  if (items.length === 0) return [];
  const starts: GroupStart[] = [];
  let lastLabel: string | null = null;
  for (let i = 0; i < items.length; i++) {
    const label = getLabel(items[i]);
    if (label !== lastLabel) {
      if (starts.length > 0) {
        starts[starts.length - 1].span = i - starts[starts.length - 1].index;
      }
      starts.push({ index: i, label, span: 0 });
      lastLabel = label;
    }
  }
  starts[starts.length - 1].span =
    items.length - starts[starts.length - 1].index;
  return starts;
}

export function rowGroupStarts(
  trains: Train[],
  key: TrainFacetKey,
): GroupStart[] {
  return groupStarts(trains, (t) => trainGroupLabel(t, key));
}

export function colGroupStarts(rbcs: RBC[], key: RBCFacetKey): GroupStart[] {
  return groupStarts(rbcs, (r) => rbcGroupLabel(r, key));
}

export function isRowSortKey(v: string): v is RowSortKey {
  return (ROW_SORT_KEYS as readonly string[]).includes(v);
}

export function isColSortKey(v: string): v is ColSortKey {
  return (COL_SORT_KEYS as readonly string[]).includes(v);
}

export function isTrainFacetKey(v: string): v is TrainFacetKey {
  return (TRAIN_FACET_KEYS as readonly string[]).includes(v);
}

export function isRBCFacetKey(v: string): v is RBCFacetKey {
  return (RBC_FACET_KEYS as readonly string[]).includes(v);
}

export function isSortDir(v: string): v is SortDir {
  return v === "asc" || v === "desc";
}
