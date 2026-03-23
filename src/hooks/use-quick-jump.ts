import { useEffect } from "react";

interface UseQuickJumpOptions {
  onClear: () => void;
  onChar?: (char: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function isDialogOpen(): boolean {
  return !!document.querySelector('[data-state="open"][role="dialog"]');
}

export function useQuickJump({ onClear, onChar, inputRef }: UseQuickJumpOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape: clear when a tracked input is focused, or when any input is focused
      if (e.key === "Escape") {
        const active = document.activeElement;
        const trackedFocused = inputRef?.current && active === inputRef.current;
        const anyInputFocused = active instanceof HTMLInputElement;
        if (trackedFocused || anyInputFocused) {
          onClear();
          (active as HTMLElement).blur();
        }
        return;
      }

      if (isDialogOpen()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        if (inputRef?.current) {
          inputRef.current.focus();
        } else {
          onChar?.("/");
        }
        return;
      }

      if (e.key.length === 1) {
        e.preventDefault();
        onChar?.(e.key);
        inputRef?.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [inputRef, onClear, onChar]);
}
