import { type ReactNode, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  onSave: () => void;
  isSaving?: boolean;
  cancelLabel?: string;
  /** When true, closing the drawer prompts for confirmation. */
  isDirty?: boolean;
  /**
   * Renders a delete confirmation dialog around the footer remove button.
   * Receives the trigger button as its argument — wrap it in e.g. DeleteTrainDialog.
   */
  renderRemoveDialog?: (trigger: ReactNode) => ReactNode;
  /** Bare remove handler for cases that don't need a confirmation dialog. Ignored when `renderRemoveDialog` is set. */
  onRemove?: () => void;
  removeLabel?: string;
  children: React.ReactNode;
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onSave,
  isSaving = false,
  cancelLabel = "Abbrechen",
  isDirty = false,
  renderRemoveDialog,
  onRemove,
  removeLabel = "Entfernen",
  children,
}: FormDrawerProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && isDirty) {
      setConfirmOpen(true);
      return;
    }
    onOpenChange(next);
  };

  const requestClose = () => handleOpenChange(false);

  const discardAndClose = () => {
    setConfirmOpen(false);
    onOpenChange(false);
  };

  const removeButton = (
    <Button variant="destructive">
      {removeLabel}
    </Button>
  );

  const footerRemoveSlot = renderRemoveDialog
    ? renderRemoveDialog(removeButton)
    : onRemove
      ? <Button variant="destructive" onClick={onRemove}>{removeLabel}</Button>
      : null;

  return (
    <>
      <Drawer direction="right" open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex h-full flex-col">
          <DrawerHeader className="relative pt-4 border-b border-border">
            <div className="flex flex-row items-center justify-between">
              <DrawerTitle>{title}</DrawerTitle>
              <Button variant="ghost" size="icon" onClick={requestClose}>
                <X className="h-6 w-6" strokeWidth={3} />
                <span className="sr-only">Schließen</span>
              </Button>
            </div>
            <DrawerDescription className={description ? undefined : "sr-only"}>
              {description ?? title}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6">{children}</div>
          <DrawerFooter className="flex-row items-center justify-between gap-2 border-t border-border">
            <div>
              {footerRemoveSlot}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={requestClose}>
                {cancelLabel}
              </Button>
              <Button onClick={onSave} disabled={isSaving}>
                {confirmLabel}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Änderungen verwerfen?</AlertDialogTitle>
            <AlertDialogDescription>
              Ihre Änderungen gehen verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={discardAndClose}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Verwerfen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
