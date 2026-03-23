import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormDrawer } from "@/components/form-drawer/form-drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComboboxInput } from "@/components/ui/combobox-input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { useTrains, useCreateTrain, useUpdateTrain, useDeleteTrain } from "@/api/trains";
import { useRBCs } from "@/api/rbcs";
import { useRelations } from "@/api/relations";
import { getTrainDisplayName } from "@/types";
import { DeleteTrainDialog } from "@/components/trains-page/delete-train-dialog";
import { formFieldsContainer } from "@/lib/mixins";

const schema = z.object({
  trainType: z.string().min(1, "Zugtyp ist erforderlich"),
  trainNumber: z.string().min(1, "Zugnummer ist erforderlich"),
  operator: z.string().min(1, "Verkehrsbetreiber ist erforderlich"),
  notes: z.string(),
});

type FormData = z.infer<typeof schema>;

export function TrainFormDrawer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: trains = [] } = useTrains();
  const train = id ? trains.find((t) => t.id === id) : undefined;
  const isEdit = !!id;

  useDocumentTitle(
    "Züge",
    isEdit ? `${train ? getTrainDisplayName(train) : ""} Bearbeiten` : "Erstellen",
  );

  const createTrain = useCreateTrain();
  const updateTrain = useUpdateTrain();
  const deleteTrain = useDeleteTrain();
  const { data: rbcs = [] } = useRBCs();
  const { data: relations = [] } = useRelations();

  const connectedRbcNames = useMemo(() => {
    if (!train) return [];
    const byId = new Map(rbcs.map((r) => [r.id, r.name]));
    return relations
      .filter((r) => r.trainId === train.id)
      .map((r) => byId.get(r.rbcId))
      .filter((name): name is string => Boolean(name));
  }, [train, rbcs, relations]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      trainType: "",
      trainNumber: "",
      operator: "",
      notes: "",
    },
    values: train
      ? {
          trainType: train.trainType,
          trainNumber: train.trainNumber,
          operator: train.operator,
          notes: train.notes ?? "",
        }
      : undefined,
  });

  const trainTypeSuggestions = useMemo(
    () => [...new Set(trains.map((t) => t.trainType).filter(Boolean))],
    [trains],
  );

  const operatorSuggestions = useMemo(
    () => [...new Set(trains.map((t) => t.operator).filter(Boolean))],
    [trains],
  );

  const onClose = () => navigate("/trains");

  const onSubmit = async (values: FormData) => {
    if (isEdit && train) {
      await updateTrain.mutateAsync({ id: train.id, ...values });
      form.reset();
      onClose();
    } else {
      const created = await createTrain.mutateAsync(values);
      form.reset();
      navigate(`/trains?train.id=${created.id}`);
    }
  };

  return (
    <FormDrawer
      open
      onOpenChange={(v) => {
        if (!v) {
          form.reset();
          onClose();
        }
      }}
      title={isEdit ? "Zug bearbeiten" : "Zug anlegen"}
      confirmLabel="Speichern"
      onSave={form.handleSubmit(onSubmit)}
      isSaving={createTrain.isPending || updateTrain.isPending}
      isDirty={form.formState.isDirty}
      renderRemoveDialog={isEdit && train ? (trigger) => (
        <DeleteTrainDialog
          train={train}
          connectedRbcNames={connectedRbcNames}
          onConfirm={async () => { await deleteTrain.mutateAsync(train.id); onClose(); }}
        >
          {trigger}
        </DeleteTrainDialog>
      ) : undefined}
    >
      <Form {...form}>
        <div className={formFieldsContainer}>
          <FormField
            control={form.control}
            name="trainType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Zugtyp <span className="text-destructive">*</span>
                </FormLabel>
                <FormDescription>
                  Typ / Gattung des Zuges
                </FormDescription>
                <FormControl>
                  <ComboboxInput
                    id="trainType"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={trainTypeSuggestions}
                    placeholder="z.B. ICE, TGV, S-Bahn"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trainNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Zugnummer <span className="text-destructive">*</span>
                </FormLabel>
                <FormDescription>
                  Alphanumerische Bezeichnung des Zuges
                </FormDescription>
                <FormControl>
                  <Input {...field} placeholder="z.B. 425" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="operator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Verkehrsbetreiber <span className="text-destructive">*</span>
                </FormLabel>
                <FormDescription>
                  Betreiber des Zuges
                </FormDescription>
                <FormControl>
                  <ComboboxInput
                    id="operator"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={operatorSuggestions}
                    placeholder="z.B. DB, VVS, VBB"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notiz (Optional)</FormLabel>
                <FormDescription>
                  Zusätzliche Anmerkungen oder Hinweise
                </FormDescription>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Zusätzliche Informationen..."
                    rows={3}
                  />
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
