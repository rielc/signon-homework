import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageContentWrapProps {
  children: ReactNode;
  className?: string;
}

export function PageContentWrap({ children, className }: PageContentWrapProps) {
  return (
    <div
      className={cn(
        "relative min-h-0 flex-1 overflow-auto bg-white rounded-sm shadow-md overscroll-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
