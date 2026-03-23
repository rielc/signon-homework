import { infoRowLabel, infoRowValue } from "@/lib/mixins";

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={infoRowLabel}>{label}</span>
      <span className={infoRowValue}>{value}</span>
    </div>
  );
}
