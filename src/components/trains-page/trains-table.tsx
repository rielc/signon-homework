import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { MatrixFab, MatrixIcon } from "@/components/matrix-nav/matrix-nav";
import { RowActions } from "@/components/row-actions/row-actions";
import { useSuspenseTrains, useDeleteTrain } from "../../api/trains";
import { useRBCs } from "../../api/rbcs";
import { useRelations } from "../../api/relations";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteTrainDialog } from "./delete-train-dialog";
import { TableStatusBar } from "@/components/table-status-bar";
import {
  ColumnHeaderActions,
  type SortState,
} from "@/components/column-header-actions";
import {
  destructiveIconButton,
  emptyStateCell,
  tableContainer,
  tableGroupCell,
  tableGroupLabel,
  tableGroupRow,
  tableHeaderCell,
  tableHeaderRow,
} from "@/lib/mixins";
import { getTrainDisplayName, type Train } from "../../types";
import {
  COLUMN_COUNT,
  DEFAULT_SORT,
  FACET_KEYS,
  GROUP_BY_KEYS,
  SORT_KEYS,
  partition,
  sortTrains,
  type SortDir,
  type TrainFacetKey,
  type TrainGroupByKey,
  type TrainSortKey,
} from "./utils";

export function TrainsTable() {
  const { data: trains } = useSuspenseTrains();
  const { data: rbcs = [] } = useRBCs();
  const { data: relations = [] } = useRelations();
  const deleteTrain = useDeleteTrain();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rbcNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const rbc of rbcs) map.set(rbc.id, rbc.name);
    return map;
  }, [rbcs]);

  const connectedRbcNamesByTrain = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of relations) {
      const name = rbcNameById.get(r.rbcId);
      if (!name) continue;
      const list = map.get(r.trainId);
      if (list) list.push(name);
      else map.set(r.trainId, [name]);
    }
    return map;
  }, [relations, rbcNameById]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
  const activeSort = sortBy && sortDir ? { key: sortBy, dir: sortDir } : null;

  const selectedByFacet = useMemo(() => {
    const map: Record<TrainFacetKey, Set<string>> = {
      "train.id": new Set(),
      trainType: new Set(),
      operator: new Set(),
    };
    for (const key of FACET_KEYS) {
      const raw = searchParams.get(key);
      if (!raw) continue;
      for (const value of raw.split(",").filter(Boolean)) {
        map[key].add(value);
      }
    }
    return map;
  }, [searchParams]);

  const filterKey = FACET_KEYS.map((k) => searchParams.get(k) ?? "").join("|");
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterKey]);

  const filtered = trains.filter((t) => {
    if (
      selectedByFacet["train.id"].size > 0 &&
      !selectedByFacet["train.id"].has(t.id)
    )
      return false;
    if (
      selectedByFacet.trainType.size > 0 &&
      !selectedByFacet.trainType.has(t.trainType)
    )
      return false;
    if (
      selectedByFacet.operator.size > 0 &&
      !selectedByFacet.operator.has(t.operator)
    )
      return false;
    return true;
  });

  const sorted = useMemo(
    () => sortTrains(filtered, activeSort?.key ?? DEFAULT_SORT.key, activeSort?.dir ?? DEFAULT_SORT.dir),
    [filtered, activeSort],
  );

  const groups = useMemo(
    () => (groupBy ? partition(sorted, groupBy) : null),
    [sorted, groupBy],
  );

  const activeFilterCount =
    FACET_KEYS.reduce(
      (acc, key) => acc + (selectedByFacet[key].size > 0 ? 1 : 0),
      0,
    );

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    for (const key of FACET_KEYS) next.delete(key);
    setSearchParams(next);
  };

  const toggleSort = (key: TrainSortKey) => {
    const next = new URLSearchParams(searchParams);
    const current = activeSort?.key === key ? activeSort.dir : null;
    const nextDir: SortDir | null =
      current === null ? "asc" : current === "asc" ? "desc" : null;
    if (nextDir) {
      next.set("sortBy", key);
      next.set("sortDir", nextDir);
    } else {
      next.delete("sortBy");
      next.delete("sortDir");
    }
    setSearchParams(next);
  };

  const toggleGroup = (key: TrainGroupByKey) => {
    const next = new URLSearchParams(searchParams);
    if (groupBy === key) next.delete("groupBy");
    else next.set("groupBy", key);
    setSearchParams(next);
  };

  const sortStateFor = (key: TrainSortKey): SortState =>
    activeSort?.key === key ? activeSort.dir : "off";

  const renderRow = (train: Train) => {
    const isSelected = selectedIds.has(train.id);
    return (
      <TableRow key={train.id} className="group">
        <TableCell>{getTrainDisplayName(train)}</TableCell>
        <TableCell>{train.trainType}</TableCell>
        <TableCell>{train.trainNumber}</TableCell>
        <TableCell>{train.operator}</TableCell>
        <TableCell>
          <RowActions>
            <Button
              variant="ghost"
              size="icon"
              title="In Matrix anzeigen"
              onClick={() => navigate(`/matrix?train.id=${train.id}&hideEmpty=1`)}
            >
              <MatrixIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/trains/edit/${train.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <DeleteTrainDialog
              train={train}
              connectedRbcNames={connectedRbcNamesByTrain.get(train.id) ?? []}
              onConfirm={() => deleteTrain.mutate(train.id)}
            >
              <Button variant="ghost" size="icon" className={destructiveIconButton}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteTrainDialog>
          </RowActions>
        </TableCell>
        <TableCell
          className="w-9 cursor-pointer px-2"
          onClick={() => toggleSelect(train.id)}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(train.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 cursor-pointer rounded accent-db-red"
            aria-label={`Select ${getTrainDisplayName(train)}`}
          />
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className={tableContainer}>
      <Table>
        <TableHeader>
          <TableRow className={tableHeaderRow}>
            <TableHead className={tableHeaderCell}>
              <ColumnHeaderActions
                label="Name"
                sortState={sortStateFor("name")}
                onToggleSort={() => toggleSort("name")}
              />
            </TableHead>
            <TableHead className={tableHeaderCell}>
              <ColumnHeaderActions
                label="Zugtyp"
                sortState={sortStateFor("trainType")}
                onToggleSort={() => toggleSort("trainType")}
                groupState={groupBy === "trainType" ? "on" : "off"}
                onToggleGroup={() => toggleGroup("trainType")}
              />
            </TableHead>
            <TableHead className={tableHeaderCell}>
              <ColumnHeaderActions
                label="Zugnummer"
                sortState={sortStateFor("trainNumber")}
                onToggleSort={() => toggleSort("trainNumber")}
              />
            </TableHead>
            <TableHead className={tableHeaderCell}>
              <ColumnHeaderActions
                label="Verkehrsbetreiber"
                sortState={sortStateFor("operator")}
                onToggleSort={() => toggleSort("operator")}
                groupState={groupBy === "operator" ? "on" : "off"}
                onToggleGroup={() => toggleGroup("operator")}
              />
            </TableHead>
            <TableHead className={tableHeaderCell}>Aktionen</TableHead>
            <TableHead className="sticky top-0 z-20 w-9 bg-db-black px-2" />
          </TableRow>
        </TableHeader>
        {sorted.length === 0 ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={COLUMN_COUNT} className={emptyStateCell}>
                <div className="flex flex-col items-center gap-4">
                  <p>Keine Züge vorhanden</p>
                  <Button onClick={() => navigate("/trains/new")}>
                    Zug anlegen
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        ) : groups ? (
          groups.map((group) => (
            <TableBody key={group.label}>
              <TableRow className={tableGroupRow}>
                <TableCell colSpan={COLUMN_COUNT} className={tableGroupCell}>
                  <div className={tableGroupLabel}>
                    <span className="font-bold">{group.label}</span>
                    <span className="text-foreground-muted">
                      ({group.items.length} Züge)
                    </span>
                  </div>
                </TableCell>
              </TableRow>
              {group.items.map(renderRow)}
            </TableBody>
          ))
        ) : (
          <TableBody>{sorted.map(renderRow)}</TableBody>
        )}
        <TableStatusBar
          shown={sorted.length}
          total={trains.length}
          activeFilterCount={activeFilterCount}
          groupCount={groups?.length}
          onClearFilters={clearFilters}
          colSpan={COLUMN_COUNT}
        />
      </Table>
      <MatrixFab
        count={selectedIds.size}
        label={`${selectedIds.size} Züge in Matrix anzeigen`}
        ariaLabel={`${selectedIds.size} ausgewählte Züge in Matrix anzeigen`}
        onClick={() => {
          const ids = Array.from(selectedIds).join(",");
          navigate(`/matrix?train.id=${ids}&hideEmpty=1`);
        }}
      />
    </div>
  );
}
