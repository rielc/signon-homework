import { Suspense, useCallback, useRef } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useDocumentTitle } from "../hooks/use-document-title";
import { useQuickJump } from "../hooks/use-quick-jump";
import { RBCsFilterBar } from "@/components/rbcs-page/rbcs-filter-bar";
import { RBCsTable } from "@/components/rbcs-page/rbcs-table";
import { type FacetComboboxHandle } from "@/components/facet-combobox";
import { loadingContainer, loadingSpinner } from "@/lib/mixins";

export default function RBCsPage() {
  const comboboxRef = useRef<FacetComboboxHandle>(null);

  useDocumentTitle("RBCs");

  const onClear = useCallback(() => comboboxRef.current?.clearQuery(), []);
  const onChar = useCallback(
    (char: string) => comboboxRef.current?.seedQuery(char),
    [],
  );

  useQuickJump({ onClear, onChar });

  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={null}>
        <RBCsFilterBar comboboxRef={comboboxRef} />
      </Suspense>

      <Suspense
        fallback={
          <div className={loadingContainer}>
            <Loader2 className={loadingSpinner} />
            <span className="text-xl text-db-muted">Lade RBCs...</span>
          </div>
        }
      >
        <RBCsTable />
      </Suspense>

      <Outlet />
    </div>
  );
}
