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
import { type RBC } from "../../types";
import { statusConfig } from "./utils";
import { infoRowLabel, infoRowValue } from "@/lib/mixins";
import { InfoRow } from "@/components/info-row/info-row";

interface DeleteRBCDialogProps {
  rbc: RBC;
  connectedTrainNames: string[];
  onConfirm: () => void;
  /** Trigger element. Omit for controlled mode — use `open` + `onOpenChange` instead. */
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteRBCDialog({ rbc, connectedTrainNames, onConfirm, children, open, onOpenChange }: DeleteRBCDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>RBC löschen?</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <InfoRow label="Name" value={rbc.name} />
          <InfoRow label="Hersteller" value={rbc.manufacturer} />
          <InfoRow label="Standort" value={rbc.location} />
          <InfoRow label="Status" value={statusConfig[rbc.status].label} />
          {rbc.notes && <InfoRow label="Notizen" value={rbc.notes} />}
        </div>

        <AlertDialogDescription asChild>
          <div className="space-y-3">
            {connectedTrainNames.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className={infoRowLabel}>Verbundene Züge</span>
                <span className={infoRowValue}>{connectedTrainNames.join(", ")}</span>
              </div>
            )}
            <p className="text-destructive text-sm">
              Alle zugehörigen Beziehungen werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>RBC löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
