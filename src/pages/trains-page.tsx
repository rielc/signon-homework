import { Suspense, useCallback, useRef } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useDocumentTitle } from "../hooks/use-document-title";
import { useQuickJump } from "../hooks/use-quick-jump";
import { TrainsFilterBar } from "@/components/trains-page/trains-filter-bar";
import { TrainsTable } from "@/components/trains-page/trains-table";
import { type FacetComboboxHandle } from "@/components/facet-combobox";
import { loadingContainer, loadingSpinner } from "@/lib/mixins";

export default function TrainsPage() {
  const comboboxRef = useRef<FacetComboboxHandle>(null);

  useDocumentTitle("Züge");

  const onClear = useCallback(() => comboboxRef.current?.clearQuery(), []);
  const onChar = useCallback(
    (char: string) => comboboxRef.current?.seedQuery(char),
    [],
  );

  useQuickJump({ onClear, onChar });

  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={null}>
        <TrainsFilterBar comboboxRef={comboboxRef} />
      </Suspense>

      <Suspense
        fallback={
          <div className={loadingContainer}>
            <Loader2 className={loadingSpinner} />
            <span className="text-xl text-db-muted">Lade Züge...</span>
          </div>
        }
      >
        <TrainsTable />
      </Suspense>

      <Outlet />
    </div>
  );
}
