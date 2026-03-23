import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "../hooks/use-document-title";
import { Loader2 } from "lucide-react";
import { loadingContainer, loadingSpinner } from "@/lib/mixins";
import { useTrains } from "../api/trains";
import { useRBCs } from "../api/rbcs";
import { useRelations } from "../api/relations";
import RelationMatrix from "../components/relation-matrix/relation-matrix";
import { KeyFormDrawer } from "../components/key-form-drawer/key-form-drawer";
import { MatrixFilterBar } from "../components/matrix-page/matrix-filter-bar";
import { useQuickJump } from "../hooks/use-quick-jump";
import { type FacetComboboxHandle } from "../components/facet-combobox";
import {
  TRAIN_FACET_KEYS,
  RBC_FACET_KEYS,
  TRAIN_ATTR_BY_FACET,
  RBC_ATTR_BY_FACET,
  DEFAULT_ROW_SORT,
  DEFAULT_COL_SORT,
  sortTrains,
  sortRBCs,
  partitionTrains,
  partitionRBCs,
  rowGroupStarts,
  colGroupStarts,
  isRowSortKey,
  isColSortKey,
  isTrainFacetKey,
  isRBCFacetKey,
  isSortDir,
  type TrainFacetKey,
  type RBCFacetKey,
} from "../components/matrix-page/utils";

export default function MatrixPage() {
  const { data: trains = [], isLoading: trainsLoading } = useTrains();
  const { data: rbcs = [], isLoading: rbcsLoading } = useRBCs();
  const { data: relations = [], isLoading: relationsLoading } = useRelations();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoading = trainsLoading || rbcsLoading || relationsLoading;

  useDocumentTitle("Matrix");

  const comboboxRef = useRef<FacetComboboxHandle>(null);
  const onClear = useCallback(() => comboboxRef.current?.clearQuery(), []);
  const onChar = useCallback((char: string) => comboboxRef.current?.seedQuery(char), []);
  useQuickJump({ onClear, onChar });

  const selectedTrainId = searchParams.get("selectedTrain");
  const selectedRbcId = searchParams.get("selectedRbc");

  const selectedRelation = relations.find(
    (r) => r.trainId === selectedTrainId && r.rbcId === selectedRbcId,
  );

  const handleCellClick = (trainId: string, rbcId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("selectedTrain", trainId);
      next.set("selectedRbc", rbcId);
      return next;
    });
  };

  const handleModalClose = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("selectedTrain");
      next.delete("selectedRbc");
      return next;
    });
  };

  const selectedTrain = trains.find((t) => t.id === selectedTrainId);
  const selectedRbc = rbcs.find((r) => r.id === selectedRbcId);

  const rowSortByRaw = searchParams.get("rowSortBy");
  const rowSortDirRaw = searchParams.get("rowSortDir");
  const colSortByRaw = searchParams.get("colSortBy");
  const colSortDirRaw = searchParams.get("colSortDir");
  const rowGroupByRaw = searchParams.get("rowGroupBy");
  const colGroupByRaw = searchParams.get("colGroupBy");

  const rowSortBy =
    rowSortByRaw && isRowSortKey(rowSortByRaw) ? rowSortByRaw : null;
  const rowSortDir =
    rowSortDirRaw && isSortDir(rowSortDirRaw) ? rowSortDirRaw : null;
  const colSortBy =
    colSortByRaw && isColSortKey(colSortByRaw) ? colSortByRaw : null;
  const colSortDir =
    colSortDirRaw && isSortDir(colSortDirRaw) ? colSortDirRaw : null;
  const rowGroupBy: TrainFacetKey | null =
    rowGroupByRaw && isTrainFacetKey(rowGroupByRaw) ? rowGroupByRaw : null;
  const colGroupBy: RBCFacetKey | null =
    colGroupByRaw && isRBCFacetKey(colGroupByRaw) ? colGroupByRaw : null;

  const filteredTrains = useMemo(() => {
    const filtered = trains.filter((t) => {
      for (const fk of TRAIN_FACET_KEYS) {
        const raw = searchParams.get(fk);
        if (!raw) continue;
        const values = new Set(raw.split(",").filter(Boolean));
        if (values.size === 0) continue;
        if (!values.has(t[TRAIN_ATTR_BY_FACET[fk]] ?? "")) return false;
      }
      return true;
    });
    const sorted = sortTrains(
      filtered,
      rowSortBy ?? DEFAULT_ROW_SORT.key,
      rowSortDir ?? DEFAULT_ROW_SORT.dir,
    );
    return rowGroupBy
      ? partitionTrains(sorted, rowGroupBy).flatMap((g) => g.items)
      : sorted;
  }, [trains, searchParams, rowSortBy, rowSortDir, rowGroupBy]);

  const filteredRbcs = useMemo(() => {
    const filtered = rbcs.filter((r) => {
      for (const fk of RBC_FACET_KEYS) {
        const raw = searchParams.get(fk);
        if (!raw) continue;
        const values = new Set(raw.split(",").filter(Boolean));
        if (values.size === 0) continue;
        if (!values.has(String(r[RBC_ATTR_BY_FACET[fk]] ?? ""))) return false;
      }
      return true;
    });
    const sorted = sortRBCs(
      filtered,
      colSortBy ?? DEFAULT_COL_SORT.key,
      colSortDir ?? DEFAULT_COL_SORT.dir,
    );
    return colGroupBy
      ? partitionRBCs(sorted, colGroupBy).flatMap((g) => g.items)
      : sorted;
  }, [rbcs, searchParams, colSortBy, colSortDir, colGroupBy]);

  const hideEmpty = searchParams.get("hideEmpty") === "1";

  const { visibleTrains, visibleRbcs } = useMemo(() => {
    if (!hideEmpty) {
      return { visibleTrains: filteredTrains, visibleRbcs: filteredRbcs };
    }
    const filteredTrainIds = new Set(filteredTrains.map((t) => t.id));
    const filteredRbcIds = new Set(filteredRbcs.map((r) => r.id));
    const trainsWithRelation = new Set<string>();
    const rbcsWithRelation = new Set<string>();
    for (const r of relations) {
      if (filteredTrainIds.has(r.trainId) && filteredRbcIds.has(r.rbcId)) {
        trainsWithRelation.add(r.trainId);
        rbcsWithRelation.add(r.rbcId);
      }
    }
    return {
      visibleTrains: filteredTrains.filter((t) => trainsWithRelation.has(t.id)),
      visibleRbcs: filteredRbcs.filter((r) => rbcsWithRelation.has(r.id)),
    };
  }, [filteredTrains, filteredRbcs, relations, hideEmpty]);

  const rowGroups = useMemo(
    () => (rowGroupBy ? rowGroupStarts(visibleTrains, rowGroupBy) : undefined),
    [visibleTrains, rowGroupBy],
  );

  const colGroups = useMemo(
    () => (colGroupBy ? colGroupStarts(visibleRbcs, colGroupBy) : undefined),
    [visibleRbcs, colGroupBy],
  );

  return (
    <div className="flex h-full flex-col">
      <MatrixFilterBar trains={trains} rbcs={rbcs} comboboxRef={comboboxRef} />
      {isLoading ? (
        <div className={loadingContainer}>
          <Loader2 className={loadingSpinner} />
          <span className="text-xl text-db-muted">Lade Matrix...</span>
        </div>
      ) : trains.length === 0 || rbcs.length === 0 ? (
        <div className="py-12 text-center text-db-muted">
          Bitte zuerst Züge und RBCs anlegen.
        </div>
      ) : (
        <RelationMatrix
          trains={visibleTrains}
          rbcs={visibleRbcs}
          relations={relations}
          rowGroups={rowGroups}
          colGroups={colGroups}
          onCellClick={handleCellClick}
        />
      )}
      {selectedTrainId && selectedRbcId && selectedTrain && selectedRbc && (
        <KeyFormDrawer
          open
          train={selectedTrain}
          rbc={selectedRbc}
          relation={selectedRelation}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
