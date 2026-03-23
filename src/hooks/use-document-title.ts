import { createContext, useContext, useCallback, useRef, useEffect } from "react";

type SetTitle = (...parts: string[]) => void;

// Carries the push function from the nearest provider to useDocumentTitle consumers.
export const DocumentTitleContext = createContext<SetTitle>(() => {});

// Creates a stack-based title manager. Place its return value into DocumentTitleContext.Provider.
// Each push adds a title layer; the returned cleanup pops it. The topmost layer wins.
export function useDocumentTitleManager() {
  const stackRef = useRef<string[][]>([]);

  const apply = useCallback(() => {
    const top = stackRef.current[stackRef.current.length - 1];
    document.title = ["KeyLock", ...(top ?? [])].join(" / ");
  }, []);

  const push = useCallback(
    (...parts: string[]) => {
      stackRef.current.push(parts);
      apply();
      return () => {
        const idx = stackRef.current.lastIndexOf(parts);
        if (idx !== -1) stackRef.current.splice(idx, 1);
        apply();
      };
    },
    [apply],
  );

  return push;
}

// Sets document.title to "KeyLock / ...parts" while the component is mounted.
// When the component unmounts, the previous title layer is restored automatically.
export function useDocumentTitle(...parts: string[]) {
  const push = useContext(DocumentTitleContext);
  const key = parts.join("/");

  useEffect(() => {
    return push(...parts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [push, key]);
}
