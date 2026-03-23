import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  id?: string;
  className?: string;
}

function ComboboxInput({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
  className,
}: ComboboxInputProps) {
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const listRef = React.useRef<HTMLUListElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!value) return [];
    const lower = value.toLowerCase();
    return suggestions.filter(
      (s) => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower,
    );
  }, [value, suggestions]);

  const showDropdown = open && filtered.length > 0;

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered]);

  const select = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          select(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  React.useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const listboxId = `${id ?? "combobox"}-listbox`;
  const activeDescendant =
    highlightedIndex >= 0
      ? `${id ?? "combobox"}-option-${highlightedIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto border border-border bg-popover text-popover-foreground shadow-md"
        >
          {filtered.map((item, index) => (
            <li
              key={item}
              id={`${id ?? "combobox"}-option-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              className={cn(
                "relative flex w-full cursor-default items-center gap-2 border-t border-input bg-db-white p-2 text-sm outline-hidden select-none first:border-t-0 hover:bg-hover",
                index === highlightedIndex && "bg-hover",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                select(item);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { ComboboxInput };
export type { ComboboxInputProps };
