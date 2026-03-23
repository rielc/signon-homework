import { useMemo, useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { KeyRound, Pencil, Plus, Radio, Train as TrainIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Train, RBC, Relation } from "@/types";
import { getTrainDisplayName } from "@/types";
import { cn } from "@/lib/utils";
import type { GroupStart } from "@/components/matrix-page/utils";
import { tableGroupCell, tableGroupLabel } from "@/lib/mixins";

interface RelationMatrixProps {
  trains: Train[];
  rbcs: RBC[];
  relations: Relation[];
  rowGroups?: GroupStart[];
  colGroups?: GroupStart[];
  onCellClick: (trainId: string, rbcId: string, relation?: Relation) => void;
}

const COL_WIDTH = 200;
const TRAIN_COL_WIDTH = 150;
const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 56;
const GROUP_LABEL_HEIGHT = 32;

const RelationCell = memo(function RelationCell({
  rel,
}: {
  rel: Relation | undefined;
}) {
  if (!rel) {
    return (
      <>
        <span className="text-gray-300 group-hover:hidden">—</span>
        <span className="hidden items-center gap-1.5 text-sm font-medium text-primary-foreground group-hover:inline-flex">
          <Plus className="h-4 w-4" />
          Schlüssel hinzufügen
        </span>
      </>
    );
  }
  return (
    <>
      <Tooltip>
        <TooltipTrigger className="group-hover:hidden">
          <Badge
            variant="outline"
            className="border-green-500 bg-green-50 text-green-700"
          >
            <KeyRound className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{rel.key}</TooltipContent>
      </Tooltip>
      <span className="hidden items-center gap-1.5 text-sm font-medium text-green-800 group-hover:inline-flex">
        <Pencil className="h-4 w-4" />
        Schlüssel bearbeiten
      </span>
    </>
  );
});

type CellBGVariant =
  | "header-col"
  | "header-row"
  | "default-cell"
  | "green-cell";

const cellBGVariantStyles: Record<CellBGVariant, string> = {
  "header-col": "bg-white",
  "header-row":
    "bg-db-white/75 backdrop-blur shadow-[inset_0_-2px_0_0_var(--color-border)]",
  "default-cell":
    "bg-db-white border border-border group-hover:bg-primary group-hover:border-primary transition-colors",
  "green-cell":
    "bg-db-success-bg border border-border group-hover:bg-db-success-bg/70 transition-colors",
};

function cellVariant(rel: Relation | undefined): CellBGVariant {
  if (!rel) return "default-cell";
  return "green-cell";
}

const CellBG = memo(function CellBG({ variant }: { variant: CellBGVariant }) {
  return (
    <div
      className={cn(
        "absolute inset-0 -z-10 select-none",
        cellBGVariantStyles[variant],
      )}
    />
  );
});

export default function RelationMatrix({
  trains,
  rbcs,
  relations,
  rowGroups,
  colGroups,
  onCellClick,
}: RelationMatrixProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const relationMap = useMemo(() => {
    const map = new Map<string, Relation>();
    for (const r of relations) {
      map.set(`${r.trainId}:${r.rbcId}`, r);
    }
    return map;
  }, [relations]);

  const hasRowGroups = (rowGroups?.length ?? 0) > 0;
  const hasColGroups = (colGroups?.length ?? 0) > 0;

  const topLabelHeight = hasColGroups ? GROUP_LABEL_HEIGHT : 0;

  const frozenLeftWidth = TRAIN_COL_WIDTH;
  const frozenTopHeight = topLabelHeight + HEADER_HEIGHT;

  const rowOffset = useMemo(() => {
    if (!hasRowGroups) return () => 0;
    const offsetByRow = new Uint32Array(trains.length + 1);
    const sortedStarts = [...rowGroups!]
      .map((g) => g.index)
      .sort((a, b) => a - b);
    let count = 0;
    let next = 0;
    for (let i = 0; i <= trains.length; i++) {
      while (next < sortedStarts.length && sortedStarts[next] <= i) {
        count++;
        next++;
      }
      offsetByRow[i] = count * ROW_HEIGHT;
    }
    return (rowIndex: number) => offsetByRow[rowIndex] ?? 0;
  }, [rowGroups, hasRowGroups, trains.length]);

  const totalGroupRowsHeight = hasRowGroups
    ? rowGroups!.length * ROW_HEIGHT
    : 0;

  const totalWidth = frozenLeftWidth + rbcs.length * COL_WIDTH;
  const totalHeight =
    frozenTopHeight + trains.length * ROW_HEIGHT + totalGroupRowsHeight;

  const rowVirtualizer = useVirtualizer({
    count: trains.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    scrollMargin: frozenTopHeight,
  });

  const colVirtualizer = useVirtualizer({
    count: rbcs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => COL_WIDTH,
    horizontal: true,
    overscan: 10,
    scrollMargin: frozenLeftWidth,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualCols = colVirtualizer.getVirtualItems();

  return (
    <TooltipProvider>
      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-auto overscroll-none"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${TRAIN_COL_WIDTH}px ${rbcs.length * COL_WIDTH}px`,
            gridTemplateRows: `${topLabelHeight}px ${HEADER_HEIGHT}px ${trains.length * ROW_HEIGHT + totalGroupRowsHeight}px`,
            width: totalWidth,
            height: totalHeight,
          }}
        >
          <div
            className="sticky left-0 top-0 z-40 bg-db-white"
            style={{ height: topLabelHeight }}
          />

          <div
            className="sticky top-0 z-20 flex"
            style={{ height: topLabelHeight }}
          >
            {hasColGroups &&
              colGroups!.map((g) => (
                <div
                  key={`colg-${g.index}-${g.label}`}
                  className={cn(
                    tableGroupCell,
                    tableGroupLabel,
                    "items-center py-0!",
                  )}
                  style={{
                    position: "absolute",
                    left: g.index * COL_WIDTH,
                    width: COL_WIDTH * g.span,
                    height: topLabelHeight,
                  }}
                >
                  <span className="font-bold">{g.label}</span>
                </div>
              ))}
          </div>

          <div
            className="isolate z-40 sticky flex items-center justify-between px-3 py-2 font-bold text-db-black"
            style={{
              left: 0,
              top: topLabelHeight,
              width: TRAIN_COL_WIDTH,
              height: HEADER_HEIGHT,
            }}
          >
            <CellBG variant="header-row" />
            <span>Zug</span> <span>/</span> <span>RBC</span>
          </div>

          <div
            className="sticky z-20 flex divide-x-2 divide-border"
            style={{ height: HEADER_HEIGHT, top: topLabelHeight }}
          >
            {rbcs.map((rbc) => (
              <div
                key={rbc.id}
                className="select-none isolate relative flex items-center px-2 py-2"
                style={{
                  width: COL_WIDTH,
                  height: HEADER_HEIGHT,
                  flexShrink: 0,
                }}
              >
                <CellBG variant="header-col" />
                <div className="flex w-full items-center gap-2">
                  <Radio className="size-[1em] text-db-muted" />
                  <div className="font-bold">{rbc.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="sticky left-0 z-10 bg-white"
            style={{ width: TRAIN_COL_WIDTH }}
          >
            {hasRowGroups &&
              rowGroups!.map((g) => {
                const headerTop =
                  g.index * ROW_HEIGHT + rowOffset(g.index) - ROW_HEIGHT;
                return (
                  <div
                    key={`rowg-label-${g.index}`}
                    className={cn(
                      tableGroupCell,
                      tableGroupLabel,
                      "items-center",
                    )}
                    style={{
                      position: "absolute",
                      top: headerTop,
                      width: TRAIN_COL_WIDTH,
                      height: ROW_HEIGHT,
                    }}
                  >
                    <span className="font-bold">{g.label}</span>
                  </div>
                );
              })}
            {trains.map((train, i) => (
              <div
                key={train.id}
                className="select-none isolate relative flex items-center px-3 py-2 font-bold text-db-black"
                style={{
                  position: "absolute",
                  top: i * ROW_HEIGHT + rowOffset(i),
                  width: TRAIN_COL_WIDTH,
                  height: ROW_HEIGHT,
                }}
              >
                <CellBG variant="header-row" />
                <div className="flex w-full items-center gap-2">
                  <TrainIcon className="size-[1em] text-db-muted" />
                  <div className="font-bold">{getTrainDisplayName(train)}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            {hasRowGroups &&
              rowGroups!.map((g) => {
                const headerTop =
                  g.index * ROW_HEIGHT + rowOffset(g.index) - ROW_HEIGHT;
                return (
                  <div
                    key={`rowg-stripe-${g.index}`}
                    className={cn(tableGroupCell)}
                    style={{
                      position: "absolute",
                      top: headerTop,
                      left: 0,
                      width: rbcs.length * COL_WIDTH,
                      height: ROW_HEIGHT,
                    }}
                  />
                );
              })}
            {virtualRows.map((virtualRow) => {
              const train = trains[virtualRow.index];
              const offset = rowOffset(virtualRow.index);
              return virtualCols.map((virtualCol) => {
                const rbc = rbcs[virtualCol.index];
                const rel = relationMap.get(`${train.id}:${rbc.id}`);
                return (
                  <div
                    key={`${train.id}:${rbc.id}`}
                    data-train={train.id}
                    data-rbc={rbc.id}
                    className="group select-none isolate relative flex cursor-pointer items-center justify-center px-2 py-2"
                    style={{
                      position: "absolute",
                      top: virtualRow.start - frozenTopHeight + offset,
                      left: virtualCol.start - frozenLeftWidth,
                      width: COL_WIDTH,
                      height: ROW_HEIGHT,
                    }}
                    onClick={() => onCellClick(train.id, rbc.id, rel)}
                  >
                    <CellBG variant={cellVariant(rel)} />
                    <RelationCell rel={rel} />
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
