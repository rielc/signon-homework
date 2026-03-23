import { useMemo, type RefObject } from "react";
import { useSearchParams } from "react-router-dom";
import { getTrainDisplayName, type Train, type RBC, type RBCStatus } from "../../types";
import { FilterBar } from "@/components/filter-bar";
import {
  FacetCombobox,
  type FacetComboboxHandle,
  type FacetDef,
  type FacetSelection,
} from "@/components/facet-combobox";
import { SortSelect } from "@/components/sort-select";
import { GroupBySelect } from "@/components/group-by-select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { filterBarItem, filterBarLabel } from "@/lib/mixins";
import { cn } from "@/lib/utils";
import { statusConfig } from "../rbcs-page/utils";
import {
  FACET_KEYS,
  FACET_LABELS,
  TRAIN_FACET_KEYS,
  TRAIN_ATTR_BY_FACET,
  ROW_SORT_OPTIONS,
  COL_SORT_OPTIONS,
  ROW_GROUP_OPTIONS,
  COL_GROUP_OPTIONS,
  DEFAULT_ROW_SORT,
  DEFAULT_COL_SORT,
} from "./utils";

interface Props {
  trains: Train[];
  rbcs: RBC[];
  comboboxRef?: RefObject<FacetComboboxHandle | null>;
}

export function MatrixFilterBar({ trains, rbcs, comboboxRef }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();

  const selected: FacetSelection[] = useMemo(() => {
    const out: FacetSelection[] = [];
    for (const key of FACET_KEYS) {
      const raw = searchParams.get(key);
      if (!raw) continue;
      for (const value of raw.split(",").filter(Boolean)) {
        out.push({ facetKey: key, value });
      }
    }
    return out;
  }, [searchParams]);

  const facets: FacetDef[] = useMemo(() => {
    const countTrainBy = (attr: keyof Train) => {
      const map = new Map<string, number>();
      for (const t of trains) {
        const v = t[attr];
        if (!v) continue;
        map.set(v, (map.get(v) ?? 0) + 1);
      }
      return map;
    };
    const countRBCBy = <K extends keyof RBC>(attr: K) => {
      const map = new Map<RBC[K], number>();
      for (const r of rbcs) {
        const v = r[attr];
        if (!v) continue;
        map.set(v, (map.get(v) ?? 0) + 1);
      }
      return map;
    };

    const defs: FacetDef[] = [];

    defs.push({
      key: "train.id",
      label: FACET_LABELS["train.id"],
      options: [...trains]
        .sort((a, b) => getTrainDisplayName(a).localeCompare(getTrainDisplayName(b)))
        .map((t) => ({ value: t.id, label: getTrainDisplayName(t) })),
    });

    defs.push({
      key: "rbc.id",
      label: FACET_LABELS["rbc.id"],
      options: [...rbcs]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ value: r.id, label: r.name })),
    });

    for (const fk of TRAIN_FACET_KEYS) {
      if (fk === "train.id") continue;
      const counts = countTrainBy(TRAIN_ATTR_BY_FACET[fk]);
      const values = Array.from(counts.keys()).sort();
      defs.push({
        key: fk,
        label: FACET_LABELS[fk],
        options: values.map((v) => ({
          value: v,
          label: v,
          count: counts.get(v) ?? 0,
        })),
      });
    }

    const manufacturerCounts = countRBCBy("manufacturer");
    const locationCounts = countRBCBy("location");
    const statusCounts = countRBCBy("status");

    defs.push({
      key: "rbc.manufacturer",
      label: FACET_LABELS["rbc.manufacturer"],
      options: Array.from(manufacturerCounts.keys())
        .sort()
        .map((v) => ({
          value: v,
          label: v,
          count: manufacturerCounts.get(v) ?? 0,
        })),
    });

    defs.push({
      key: "rbc.location",
      label: FACET_LABELS["rbc.location"],
      options: Array.from(locationCounts.keys())
        .sort()
        .map((v) => ({
          value: v,
          label: v,
          count: locationCounts.get(v) ?? 0,
        })),
    });

    defs.push({
      key: "rbc.status",
      label: FACET_LABELS["rbc.status"],
      options: (Object.keys(statusConfig) as RBCStatus[]).map((s) => ({
        value: s,
        label: statusConfig[s].label,
        count: statusCounts.get(s) ?? 0,
      })),
    });

    return defs;
  }, [trains, rbcs]);

  const handleFacetChange = (next: FacetSelection[]) => {
    const grouped: Record<string, string[]> = {};
    for (const s of next) {
      (grouped[s.facetKey] ??= []).push(s.value);
    }
    const params = new URLSearchParams(searchParams);
    for (const key of FACET_KEYS) {
      const values = grouped[key];
      if (values && values.length > 0) params.set(key, values.join(","));
      else params.delete(key);
    }
    setSearchParams(params);
  };

  const rowSortBy = searchParams.get("rowSortBy");
  const rowSortDir = searchParams.get("rowSortDir");
  const rowSortValue = rowSortBy && rowSortDir
    ? `${rowSortBy}:${rowSortDir}`
    : `${DEFAULT_ROW_SORT.key}:${DEFAULT_ROW_SORT.dir}`;

  const colSortBy = searchParams.get("colSortBy");
  const colSortDir = searchParams.get("colSortDir");
  const colSortValue = colSortBy && colSortDir
    ? `${colSortBy}:${colSortDir}`
    : `${DEFAULT_COL_SORT.key}:${DEFAULT_COL_SORT.dir}`;

  const rowGroupBy = searchParams.get("rowGroupBy");
  const colGroupBy = searchParams.get("colGroupBy");

  const handleSortChange =
    (byKey: string, dirKey: string) => (value: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        const [key, dir] = value.split(":");
        next.set(byKey, key);
        next.set(dirKey, dir);
      } else {
        next.delete(byKey);
        next.delete(dirKey);
      }
      setSearchParams(next);
    };

  const handleGroupChange = (paramKey: string) => (value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(paramKey, value);
    else next.delete(paramKey);
    setSearchParams(next);
  };

  const hideEmpty = searchParams.get("hideEmpty") === "1";

  const handleHideEmptyChange = (checked: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (checked) next.set("hideEmpty", "1");
    else next.delete("hideEmpty");
    setSearchParams(next);
  };

  return (
    <FilterBar>
      <div className={cn(filterBarItem, "flex-1")}>
        <Label className={filterBarLabel}>Filter</Label>
        <FacetCombobox
          ref={comboboxRef}
          facets={facets}
          selected={selected}
          onChange={handleFacetChange}
          placeholder="Zugtyp, Hersteller, Standort ..."
        />
      </div>
      <div className="self-stretch w-px bg-border -mx-3" />
      <div className={filterBarItem}>
        <Label className={filterBarLabel}>Züge</Label>
        <div className="flex flex-col gap-2">
          <SortSelect
            options={ROW_SORT_OPTIONS}
            value={rowSortValue}
            onChange={handleSortChange("rowSortBy", "rowSortDir")}
          />
          <GroupBySelect
            options={ROW_GROUP_OPTIONS}
            value={rowGroupBy}
            onChange={handleGroupChange("rowGroupBy")}
          />
        </div>
      </div>
      <div className="self-stretch w-px bg-border -mx-3" />
      <div className={filterBarItem}>
        <Label className={filterBarLabel}>RBCs</Label>
        <div className="flex flex-col gap-2">
          <SortSelect
            options={COL_SORT_OPTIONS}
            value={colSortValue}
            onChange={handleSortChange("colSortBy", "colSortDir")}
          />
          <GroupBySelect
            options={COL_GROUP_OPTIONS}
            value={colGroupBy}
            onChange={handleGroupChange("colGroupBy")}
          />
        </div>
      </div>
      <div className="self-stretch w-px bg-border -mx-3" />
      <div className={filterBarItem}>
        <Label className={filterBarLabel}>Nur verbundene</Label>
        <Switch checked={hideEmpty} onCheckedChange={handleHideEmptyChange} />
      </div>
    </FilterBar>
  );
}
