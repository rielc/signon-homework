import { Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MatrixIcon() {
  return <Grid3x3 className="h-4 w-4" />;
}

interface MatrixFabProps {
  count: number;
  label: string;
  ariaLabel: string;
  onClick: () => void;
}

export function MatrixFab({ count, label, ariaLabel, onClick }: MatrixFabProps) {
  const visible = count > 0;
  return (
    <div
      aria-hidden={!visible}
      className={`fixed bottom-6 right-6 z-50 transition-all duration-200 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <Button
        size="lg"
        className="bg-db-red hover:bg-db-red/90 text-base"
        tabIndex={visible ? 0 : -1}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        <Grid3x3 className="h-5 w-5" />
        {label}
      </Button>
    </div>
  );
}
