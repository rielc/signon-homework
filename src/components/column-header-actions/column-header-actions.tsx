import { ArrowDown, ArrowUp, ArrowUpDown, TableRowsSplit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SortState = "asc" | "desc" | "off";
export type GroupState = "on" | "off";

interface Props {
  label: string;
  sortState: SortState;
  onToggleSort: () => void;
  groupState?: GroupState;
  onToggleGroup?: () => void;
}

export function ColumnHeaderActions({
  label,
  sortState,
  onToggleSort,
  groupState,
  onToggleGroup,
}: Props) {
  const SortIcon =
    sortState === "asc"
      ? ArrowUp
      : sortState === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Sortierung ${label}`}
          aria-pressed={sortState !== "off"}
          onClick={onToggleSort}
          className={cn(
            "h-7 w-7 text-db-white hover:bg-white/10 hover:text-db-white",
            sortState !== "off" && "bg-white/15",
          )}
        >
          <SortIcon className="h-4 w-4" />
        </Button>
        {onToggleGroup && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Gruppierung ${label}`}
            aria-pressed={groupState === "on"}
            onClick={onToggleGroup}
            className={cn(
              "h-7 w-7 text-db-white hover:bg-white/10 hover:text-db-white",
              groupState === "on" && "bg-white/15",
            )}
          >
            <TableRowsSplit className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
