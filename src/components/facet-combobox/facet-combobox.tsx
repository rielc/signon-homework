import * as React from "react";
import { deburr } from "lodash-es";
import { X } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FacetOption {
  value: string;
  label: string;
  count?: number;
}

export interface FacetDef {
  key: string;
  label: string;
  options: FacetOption[];
}

export interface FacetSelection {
  facetKey: string;
  value: string;
}

export interface FacetComboboxHandle {
  seedQuery: (char: string) => void;
  clearQuery: () => void;
}

interface FacetComboboxProps {
  facets: FacetDef[];
  selected: FacetSelection[];
  onChange: (next: FacetSelection[]) => void;
  placeholder?: string;
  className?: string;
}

const MAX_RESULTS = 10;

export const FacetCombobox = React.forwardRef<
  FacetComboboxHandle,
  FacetComboboxProps
>(function FacetCombobox(
  { facets, selected, onChange, placeholder = "Filter...", className },
  ref,
) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => ({
    seedQuery: (char: string) => {
      setQuery(char);
      setOpen(true);
      inputRef.current?.focus();
    },
    clearQuery: () => {
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
  }));

  const selectedSet = React.useMemo(
    () => new Set(selected.map((s) => `${s.facetKey}::${s.value}`)),
    [selected],
  );

  const candidates = React.useMemo(() => {
    const all: {
      facetKey: string;
      facetLabel: string;
      value: string;
      optionLabel: string;
      count?: number;
    }[] = [];
    for (const f of facets) {
      for (const opt of f.options) {
        if (selectedSet.has(`${f.key}::${opt.value}`)) continue;
        all.push({
          facetKey: f.key,
          facetLabel: f.label,
          value: opt.value,
          optionLabel: opt.label,
          count: opt.count,
        });
      }
    }
    return all;
  }, [facets, selectedSet]);

  const matches = React.useMemo(() => {
    if (!query) return [];
    const s = deburr(query).toLowerCase();
    const scored: {
      score: number;
      length: number;
      c: (typeof candidates)[number];
    }[] = [];
    for (const c of candidates) {
      const label = deburr(c.optionLabel).toLowerCase();
      let score = 0;
      if (label === s) score = 3;
      else if (label.startsWith(s)) score = 2;
      else if (label.includes(s)) score = 1;
      if (score > 0) scored.push({ score, length: label.length, c });
    }
    scored.sort((a, b) => b.score - a.score || a.length - b.length);
    return scored.slice(0, MAX_RESULTS).map((x) => x.c);
  }, [candidates, query]);

  const facetLabelByKey = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const f of facets) map.set(f.key, f.label);
    return map;
  }, [facets]);

  const optionLabelByKeyValue = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const f of facets) {
      for (const opt of f.options) map.set(`${f.key}::${opt.value}`, opt.label);
    }
    return map;
  }, [facets]);

  const select = (facetKey: string, value: string) => {
    onChange([...selected, { facetKey, value }]);
    setQuery("");
    setOpen(false);
  };

  const remove = (facetKey: string, value: string) => {
    onChange(
      selected.filter((s) => !(s.facetKey === facetKey && s.value === value)),
    );
  };

  const showDropdown = open && query.length > 0;

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <Popover open={showDropdown} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="w-full">
            <Command
              shouldFilter={false}
              className="overflow-visible bg-transparent"
            >
              <CommandInput
                ref={inputRef}
                placeholder={placeholder}
                value={query}
                onValueChange={(v) => {
                  setQuery(v);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQuery("");
                    setOpen(false);
                    inputRef.current?.blur();
                  }
                }}
                className="h-9"
              />
              {showDropdown && (
                <PopoverContent
                  align="start"
                  sideOffset={4}
                  className="w-(--radix-popover-trigger-width) rounded-none border-border bg-popover p-0 shadow-md"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <CommandList className="max-h-72">
                    {matches.length === 0 && (
                      <div className="py-6 text-center text-sm">
                        Keine Treffer
                      </div>
                    )}
                    {matches.map((c) => (
                      <CommandItem
                        key={`${c.facetKey}::${c.value}`}
                        value={`${c.facetKey}::${c.value}`}
                        onSelect={() => select(c.facetKey, c.value)}
                      >
                        <span className="flex-1 font-bold">
                          {c.optionLabel}
                        </span>
                        {typeof c.count === "number" && (
                          <span className="ml-2 text-xs text-db-muted tabular-nums">
                            {c.count}
                          </span>
                        )}
                        <span className="ml-2 text-xs text-db-muted">
                          {c.facetLabel}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </PopoverContent>
              )}
            </Command>
          </div>
        </PopoverAnchor>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => {
            const facetLabel = facetLabelByKey.get(s.facetKey) ?? s.facetKey;
            const optionLabel =
              optionLabelByKeyValue.get(`${s.facetKey}::${s.value}`) ?? s.value;
            return (
              <Badge
                key={`${s.facetKey}::${s.value}`}
                className="gap-1 pr-1"
              >
                <span className="opacity-80">{facetLabel}:</span>
                <span>{optionLabel}</span>
                <button
                  type="button"
                  aria-label={`${facetLabel}: ${optionLabel} entfernen`}
                  onClick={() => remove(s.facetKey, s.value)}
                  className="rounded-sm hover:bg-primary-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
});
