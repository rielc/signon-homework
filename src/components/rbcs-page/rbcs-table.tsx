import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { MatrixFab, MatrixIcon } from "@/components/matrix-nav/matrix-nav";
import { RowActions } from "@/components/row-actions/row-actions";
import { useSuspenseRBCs, useDeleteRBC } from "../../api/rbcs";
import { useTrains } from "../../api/trains";
import { useRelations } from "../../api/relations";
import { getTrainDisplayName, type RBC } from "../../types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteRBCDialog } from "./delete-rbc-dialog";
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
import {
  COLUMN_COUNT,
  DEFAULT_SORT,
  FACET_KEYS,
  GROUP_BY_KEYS,
  SORT_KEYS,
  partition,
  sortRBCs,
  statusConfig,
  type RBCFacetKey,
  type RBCGroupByKey,
  type RBCSortKey,
  type SortDir,
} from "./utils";

export function RBCsTable() {
  const { data: rbcs } = useSuspenseRBCs();
  const { data: trains = [] } = useTrains();
  const { data: relations = [] } = useRelations();
  const deleteRBC = useDeleteRBC();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const trainNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of trains) map.set(t.id, getTrainDisplayName(t));
    return map;
  }, [trains]);

  const connectedTrainNamesByRbc = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of relations) {
      const name = trainNameById.get(r.trainId);
      if (!name) continue;
      const list = map.get(r.rbcId);
      if (list) list.push(name);
      else map.set(r.rbcId, [name]);
    }
    return map;
  }, [relations, trainNameById]);

  const groupByRaw = searchParams.get("groupBy");
  const groupBy: RBCGroupByKey | null =
    groupByRaw && (GROUP_BY_KEYS as readonly string[]).includes(groupByRaw)
      ? (groupByRaw as RBCGroupByKey)
      : null;

  const sortByRaw = searchParams.get("sortBy");
  const sortDirRaw = searchParams.get("sortDir");
  const sortBy: RBCSortKey | null =
    sortByRaw && (SORT_KEYS as readonly string[]).includes(sortByRaw)
      ? (sortByRaw as RBCSortKey)
      : null;
  const sortDir: SortDir | null =
    sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : null;
  const activeSort = sortBy && sortDir ? { key: sortBy, dir: sortDir } : null;

  const selectedByFacet = useMemo(() => {
    const map: Record<RBCFacetKey, Set<string>> = {
      "rbc.id": new Set(),
      manufacturer: new Set(),
      location: new Set(),
      status: new Set(),
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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterKey = FACET_KEYS.map((k) => searchParams.get(k) ?? "").join("|");
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterKey]);

  const filtered = rbcs.filter((r) => {
    if (
      selectedByFacet["rbc.id"].size > 0 &&
      !selectedByFacet["rbc.id"].has(r.id)
    )
      return false;
    if (
      selectedByFacet.manufacturer.size > 0 &&
      !selectedByFacet.manufacturer.has(r.manufacturer)
    )
      return false;
    if (
      selectedByFacet.location.size > 0 &&
      !selectedByFacet.location.has(r.location)
    )
      return false;
    if (
      selectedByFacet.status.size > 0 &&
      !selectedByFacet.status.has(r.status)
    )
      return false;
    return true;
  });

  const sorted = useMemo(
    () => sortRBCs(filtered, activeSort?.key ?? DEFAULT_SORT.key, activeSort?.dir ?? DEFAULT_SORT.dir),
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

  const toggleSort = (key: RBCSortKey) => {
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

  const toggleGroup = (key: RBCGroupByKey) => {
    const next = new URLSearchParams(searchParams);
    if (groupBy === key) next.delete("groupBy");
    else next.set("groupBy", key);
    setSearchParams(next);
  };

  const sortStateFor = (key: RBCSortKey): SortState =>
    activeSort?.key === key ? activeSort.dir : "off";

  const renderRow = (rbc: RBC) => {
    const isSelected = selectedIds.has(rbc.id);
    return (
      <TableRow key={rbc.id} className="group">
        <TableCell>{rbc.name}</TableCell>
        <TableCell>{rbc.manufacturer}</TableCell>
        <TableCell>{rbc.location}</TableCell>
        <TableCell>{statusConfig[rbc.status].label}</TableCell>
        <TableCell>
          <RowActions>
            <Button
              variant="ghost"
              size="icon"
              title="In Matrix anzeigen"
              onClick={() => navigate(`/matrix?rbc.id=${rbc.id}&hideEmpty=1`)}
            >
              <MatrixIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/rbcs/edit/${rbc.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <DeleteRBCDialog
              rbc={rbc}
              connectedTrainNames={connectedTrainNamesByRbc.get(rbc.id) ?? []}
              onConfirm={() => deleteRBC.mutate(rbc.id)}
            >
              <Button
                variant="ghost"
                size="icon"
                className={destructiveIconButton}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteRBCDialog>
          </RowActions>
        </TableCell>
        <TableCell
          className="w-9 cursor-pointer px-2"
          onClick={() => toggleSelect(rbc.id)}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(rbc.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 cursor-pointer rounded accent-db-red"
            aria-label={`Select ${rbc.name}`}
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
                label="Hersteller"
                sortState={sortStateFor("manufacturer")}
                onToggleSort={() => toggleSort("manufacturer")}
                groupState={groupBy === "manufacturer" ? "on" : "off"}
                onToggleGroup={() => toggleGroup("manufacturer")}
              />
            </TableHead>
            <TableHead className={tableHeaderCell}>
              <ColumnHeaderActions
                label="Standort"
                sortState={sortStateFor("location")}
                onToggleSort={() => toggleSort("location")}
                groupState={groupBy === "location" ? "on" : "off"}
                onToggleGroup={() => toggleGroup("location")}
              />
            </TableHead>
            <TableHead className={tableHeaderCell}>
              <ColumnHeaderActions
                label="Status"
                sortState={sortStateFor("status")}
                onToggleSort={() => toggleSort("status")}
                groupState={groupBy === "status" ? "on" : "off"}
                onToggleGroup={() => toggleGroup("status")}
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
                  <p>Keine RBCs vorhanden</p>
                  <Button onClick={() => navigate("/rbcs/new")}>
                    RBC anlegen
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
                      ({group.items.length} RBCs)
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
          total={rbcs.length}
          activeFilterCount={activeFilterCount}
          groupCount={groups?.length}
          onClearFilters={clearFilters}
          colSpan={COLUMN_COUNT}
        />
      </Table>
      <MatrixFab
        count={selectedIds.size}
        label={`${selectedIds.size} RBCs in Matrix anzeigen`}
        ariaLabel={`${selectedIds.size} ausgewählte RBCs in Matrix anzeigen`}
        onClick={() => {
          const ids = Array.from(selectedIds).join(",");
          navigate(`/matrix?rbc.id=${ids}&hideEmpty=1`);
        }}
      />
    </div>
  );
}
