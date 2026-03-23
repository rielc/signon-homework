import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";

interface TableStatusBarProps {
  shown: number;
  total: number;
  activeFilterCount: number;
  groupCount?: number;
  onClearFilters?: () => void;
  colSpan: number;
}

export function TableStatusBar({
  shown,
  total,
  activeFilterCount,
  groupCount,
  onClearFilters,
  colSpan,
}: TableStatusBarProps) {
  const filtersActive = activeFilterCount > 0;
  const grouped = groupCount !== undefined && groupCount > 0;

  return (
    <TableFooter className="bg-db-black">
      <TableRow className="bg-db-black hover:bg-db-black border-t border-border">
        <TableCell
          colSpan={colSpan}
          className="sticky bottom-0 z-20 bg-db-muted px-3 py-2 text-sm text-db-white font-normal border-t border-border"
        >
          <div className="flex items-center gap-3">
            <span>
              {shown} von {total} angezeigt
            </span>
            {filtersActive && (
              <span>
                · {activeFilterCount} Filter
              </span>
            )}
            {grouped && (
              <span>
                · {groupCount} {groupCount === 1 ? "Gruppe" : "Gruppen"}
              </span>
            )}
            {filtersActive && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2 text-db-white hover:text-db-white"
                onClick={onClearFilters}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    </TableFooter>
  );
}
