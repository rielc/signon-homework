import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormDrawer } from "@/components/form-drawer/form-drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Label } from "@/components/ui/label";
import { useRBCs, useCreateRBC, useUpdateRBC, useDeleteRBC } from "@/api/rbcs";
import { useTrains } from "@/api/trains";
import { useRelations } from "@/api/relations";
import { getTrainDisplayName } from "@/types";
import { DeleteRBCDialog } from "@/components/rbcs-page/delete-rbc-dialog";
import { formFieldsContainer } from "@/lib/mixins";

const rbcStatusEnum = z.enum(["operational", "maintenance", "decommissioned"]);

const schema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  location: z.string().min(1, "Standort ist erforderlich"),
  manufacturer: z.string().min(1, "Hersteller ist erforderlich"),
  status: rbcStatusEnum,
  notes: z.string(),
});

type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: "operational", label: "Betriebsbereit" },
  { value: "maintenance", label: "Wartung" },
  { value: "decommissioned", label: "Außer Betrieb" },
] as const;

const defaultValues = {
  name: "",
  location: "",
  manufacturer: "",
  status: "operational",
  notes: "",
} as const;

export function RBCFormDrawer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: rbcs = [] } = useRBCs();
  const rbc = id ? rbcs.find((r) => r.id === id) : undefined;
  const isEdit = !!id;

  useDocumentTitle(
    "RBCs",
    isEdit ? `${rbc?.name ?? ""} Bearbeiten` : "Erstellen",
  );

  const createRBC = useCreateRBC();
  const updateRBC = useUpdateRBC();
  const deleteRBC = useDeleteRBC();
  const { data: trains = [] } = useTrains();
  const { data: relations = [] } = useRelations();

  const connectedTrainNames = useMemo(() => {
    if (!rbc) return [];
    const byId = new Map(trains.map((t) => [t.id, getTrainDisplayName(t)]));
    return relations
      .filter((r) => r.rbcId === rbc.id)
      .map((r) => byId.get(r.trainId))
      .filter((name): name is string => Boolean(name));
  }, [rbc, trains, relations]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
    values: rbc
      ? {
          name: rbc.name,
          location: rbc.location,
          manufacturer: rbc.manufacturer,
          status: rbc.status,
          notes: rbc.notes ?? "",
        }
      : undefined,
  });

  const manufacturerSuggestions = useMemo(
    () => [...new Set(rbcs.map((r) => r.manufacturer).filter(Boolean))],
    [rbcs],
  );

  const locationSuggestions = useMemo(
    () => [...new Set(rbcs.map((r) => r.location).filter(Boolean))],
    [rbcs],
  );

  const onClose = () => navigate("/rbcs");

  const onSubmit = async (values: FormData) => {
    if (isEdit && rbc) {
      await updateRBC.mutateAsync({ id: rbc.id, ...values });
      form.reset();
      onClose();
    } else {
      const created = await createRBC.mutateAsync(values);
      form.reset();
      navigate(`/rbcs?rbc.id=${created.id}`);
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
      title={isEdit ? "RBC bearbeiten" : "RBC anlegen"}
      confirmLabel="Speichern"
      onSave={form.handleSubmit(onSubmit)}
      isSaving={createRBC.isPending || updateRBC.isPending}
      isDirty={form.formState.isDirty}
      renderRemoveDialog={isEdit && rbc ? (trigger) => (
        <DeleteRBCDialog
          rbc={rbc}
          connectedTrainNames={connectedTrainNames}
          onConfirm={async () => { await deleteRBC.mutateAsync(rbc.id); onClose(); }}
        >
          {trigger}
        </DeleteRBCDialog>
      ) : undefined}
    >
      <Form {...form}>
        <div className={formFieldsContainer}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Name <span className="text-destructive">*</span>
                </FormLabel>

                <FormDescription>
                  Eindeutiger Bezeichner des RBC
                </FormDescription>
                <FormControl>
                  <Input {...field} placeholder="z.B. Alpha" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Hersteller <span className="text-destructive">*</span>
                </FormLabel>
                <FormDescription>
                  Der Hersteller des RBC-Systems
                </FormDescription>
                <FormControl>
                  <ComboboxInput
                    id="manufacturer"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={manufacturerSuggestions}
                    placeholder="z.B. Siemens"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Standort <span className="text-destructive">*</span>
                </FormLabel>
                <FormDescription>
                  Die geographische Betriebsstelle des RBC
                </FormDescription>
                <FormControl>
                  <ComboboxInput
                    id="location"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={locationSuggestions}
                    placeholder="z.B. Frankfurt"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Betriebsstatus <span className="text-destructive">*</span>
                </FormLabel>
                <FormDescription>
                  Aktueller Betriebsstatus des RBC
                </FormDescription>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="mt-1"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-3"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`status-${option.value}`}
                        />
                        <Label htmlFor={`status-${option.value}`}>
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
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
                <FormLabel>Notizen (Optional)</FormLabel>
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
