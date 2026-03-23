import { useForm } from "react-hook-form";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDrawer } from "@/components/form-drawer/form-drawer";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import type { RBC, Relation, Train } from "@/types";
import { getTrainDisplayName } from "@/types";
import {
  useCreateRelation,
  useDeleteRelation,
  useUpdateKey,
} from "@/api/relations";
import { statusConfig } from "@/components/rbcs-page/utils";
import { formFieldsContainer } from "@/lib/mixins";
import { InfoRow } from "@/components/info-row/info-row";
import { Label } from "@/components/ui/label";

const schema = z.object({
  key: z.string().min(1, "Schlüssel ist erforderlich"),
});

type FormData = z.infer<typeof schema>;

interface KeyFormDrawerProps {
  open: boolean;
  train: Train;
  rbc: RBC;
  relation?: Relation;
  onClose: () => void;
}

export function KeyFormDrawer({
  open,
  train,
  rbc,
  relation,
  onClose,
}: KeyFormDrawerProps) {
  const isNew = !relation;
  const trainName = getTrainDisplayName(train);

  useDocumentTitle(
    "Matrix",
    relation ? `${trainName} ↔ ${rbc.name} Bearbeiten` : "Erstellen",
  );

  const createRelation = useCreateRelation();
  const deleteRelation = useDeleteRelation();
  const updateKey = useUpdateKey();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { key: "" },
    values: { key: relation?.key ?? "" },
  });

  const onSubmit = async (values: FormData) => {
    if (isNew) {
      await createRelation.mutateAsync({
        trainId: train.id,
        rbcId: rbc.id,
        key: values.key,
      });
    } else {
      await updateKey.mutateAsync({
        trainId: train.id,
        rbcId: rbc.id,
        key: values.key,
      });
    }
    onClose();
  };

  const handleRemove = async () => {
    await deleteRelation.mutateAsync({ trainId: train.id, rbcId: rbc.id });
    onClose();
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Schlüssel anlegen"
      confirmLabel="Speichern"
      onSave={form.handleSubmit(onSubmit)}
      isSaving={createRelation.isPending || updateKey.isPending}
      isDirty={isNew || form.formState.isDirty}
      onRemove={!isNew ? handleRemove : undefined}
      removeLabel="Beziehung entfernen"
    >
      <Form {...form}>
        <div className={formFieldsContainer}>
          <div className="space-y-4">
            <Label className="font-bold">Zug</Label>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Typ" value={train.trainType} />
              <InfoRow label="Nummer" value={train.trainNumber} />
              <InfoRow label="Betreiber" value={train.operator} />
              {train.notes && <InfoRow label="Notiz" value={train.notes} />}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="font-bold">RBC</Label>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Name" value={rbc.name} />
              <InfoRow label="Standort" value={rbc.location} />
              <InfoRow label="Hersteller" value={rbc.manufacturer} />
              <InfoRow
                label="Status"
                value={statusConfig[rbc.status].label}
              />
              {rbc.notes && <InfoRow label="Notizen" value={rbc.notes} />}
            </div>
          </div>

          <div className="border-t border-border" />

          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Schlüssel <span className="text-destructive">*</span>
                </FormLabel>
                <FormDescription>
                  Authentifizierungsschlüssel für die Verbindung zwischen Zug
                  und RBC
                </FormDescription>
                <FormControl>
                  <Input {...field} placeholder="z.B. ak-1a2b3c4d" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>
      </Form>
    </FormDrawer>
  );
}
