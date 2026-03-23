import { useMemo, type RefObject } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useSuspenseTrains } from "../../api/trains";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filter-bar";
import {
  FacetCombobox,
  type FacetComboboxHandle,
  type FacetDef,
  type FacetSelection,
} from "@/components/facet-combobox";
import { GroupBySelect } from "@/components/group-by-select";
import { SortSelect } from "@/components/sort-select";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_SORT,
  FACET_KEYS,
  GROUP_BY_KEYS,
  GROUP_BY_OPTIONS,
  SORT_KEYS,
  SORT_OPTIONS,
  type SortDir,
  type TrainGroupByKey,
  type TrainSortKey,
} from "./utils";
import { getTrainDisplayName } from "../../types";
import { filterBarItem, filterBarLabel } from "@/lib/mixins";
import { cn } from "@/lib/utils";

type Props = {
  comboboxRef: RefObject<FacetComboboxHandle | null>;
};

export function TrainsFilterBar({ comboboxRef }: Props) {
  const { data: trains } = useSuspenseTrains();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const groupByRaw = searchParams.get("groupBy");

  const groupBy: TrainGroupByKey | null =
    groupByRaw && (GROUP_BY_KEYS as readonly string[]).includes(groupByRaw)
      ? (groupByRaw as TrainGroupByKey)
      : null;

  const sortByRaw = searchParams.get("sortBy");
  const sortDirRaw = searchParams.get("sortDir");
  const sortBy: TrainSortKey | null =
    sortByRaw && (SORT_KEYS as readonly string[]).includes(sortByRaw)
      ? (sortByRaw as TrainSortKey)
      : null;
  const sortDir: SortDir | null =
    sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : null;
  const sortValue = sortBy && sortDir
    ? `${sortBy}:${sortDir}`
    : `${DEFAULT_SORT.key}:${DEFAULT_SORT.dir}`;

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
    const countBy = <T,>(getter: (t: (typeof trains)[number]) => T) => {
      const map = new Map<T, number>();
      for (const t of trains) {
        const key = getter(t);
        if (!key) continue;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return map;
    };
    const typeCounts = countBy((t) => t.trainType);
    const operatorCounts = countBy((t) => t.operator);
    const types = Array.from(typeCounts.keys()).sort();
    const operators = Array.from(operatorCounts.keys()).sort();
    return [
      {
        key: "train.id",
        label: "Zug",
        options: [...trains]
          .sort((a, b) =>
            getTrainDisplayName(a).localeCompare(getTrainDisplayName(b)),
          )
          .map((t) => ({ value: t.id, label: getTrainDisplayName(t) })),
      },
      {
        key: "trainType",
        label: "Zugtyp",
        options: types.map((v) => ({
          value: v,
          label: v,
          count: typeCounts.get(v) ?? 0,
        })),
      },
      {
        key: "operator",
        label: "Verkehrsbetreiber",
        options: operators.map((v) => ({
          value: v,
          label: v,
          count: operatorCounts.get(v) ?? 0,
        })),
      },
    ];
  }, [trains]);

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

  const handleGroupByChange = (value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("groupBy", value);
    else next.delete("groupBy");
    setSearchParams(next);
  };

  const handleSortChange = (value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      const [key, dir] = value.split(":");
      next.set("sortBy", key);
      next.set("sortDir", dir);
    } else {
      next.delete("sortBy");
      next.delete("sortDir");
    }
    setSearchParams(next);
  };

  return (
    <FilterBar
      actions={
        <Button onClick={() => navigate("/trains/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Zug anlegen
        </Button>
      }
    >
      <div className={cn(filterBarItem, "flex-1")}>
        <Label className={filterBarLabel}>Filter</Label>
        <FacetCombobox
          ref={comboboxRef}
          facets={facets}
          selected={selected}
          onChange={handleFacetChange}
          placeholder="Zug, Zugtyp, Betreiber ..."
        />
      </div>
      <div className="self-stretch w-px bg-border -mx-3" />
      <div className={filterBarItem}>
        <Label className={filterBarLabel}>Sortierung</Label>
        <SortSelect
          options={SORT_OPTIONS}
          value={sortValue}
          onChange={handleSortChange}
        />
      </div>
      <div className="self-stretch w-px bg-border -mx-3" />
      <div className={filterBarItem}>
        <Label className={filterBarLabel}>Gruppierung</Label>
        <GroupBySelect
          options={GROUP_BY_OPTIONS}
          value={groupBy}
          onChange={handleGroupByChange}
        />
      </div>
    </FilterBar>
  );
}
