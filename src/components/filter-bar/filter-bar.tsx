import type { ReactNode } from "react";

interface FilterBarProps {
  children: ReactNode;
  actions?: ReactNode;
}

export function FilterBar({ children, actions }: FilterBarProps) {
  return (
    <div className="-mx-6 -mt-6 mb-4 sticky top-16 z-40 flex items-start gap-6 border-b border-border bg-db-white px-6 py-4 shadow-[var(--shadow-db-shadow)]">
      {children}
      {actions && (
        <>
          <div className="self-stretch w-px bg-border -mx-3 ml-auto" />
          <div className="flex items-end gap-8 self-stretch">{actions}</div>
        </>
      )}
    </div>
  );
}
