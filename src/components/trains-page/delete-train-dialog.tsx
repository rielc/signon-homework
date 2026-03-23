import { type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getTrainDisplayName, type Train } from "../../types";
import { infoRowLabel, infoRowValue } from "@/lib/mixins";
import { InfoRow } from "@/components/info-row/info-row";

interface DeleteTrainDialogProps {
  train: Train;
  connectedRbcNames: string[];
  onConfirm: () => void;
  /** Trigger element. Omit for controlled mode — use `open` + `onOpenChange` instead. */
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteTrainDialog({ train, connectedRbcNames, onConfirm, children, open, onOpenChange }: DeleteTrainDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zug löschen?</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <InfoRow label="Name" value={getTrainDisplayName(train)} />
          <InfoRow label="Typ" value={train.trainType} />
          <InfoRow label="Nummer" value={train.trainNumber} />
          <InfoRow label="Betreiber" value={train.operator} />
          {train.notes && <InfoRow label="Notiz" value={train.notes} />}
        </div>

        <AlertDialogDescription asChild>
          <div className="space-y-3">
            {connectedRbcNames.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className={infoRowLabel}>Verbundene RBCs</span>
                <span className={infoRowValue}>{connectedRbcNames.join(", ")}</span>
              </div>
            )}
            <p className="text-destructive text-sm">
              Alle zugehörigen Beziehungen werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Zug löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
