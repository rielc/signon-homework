import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";

interface RowActionsProps {
  children: React.ReactNode;
}

export function RowActions({ children }: RowActionsProps) {
  return (
    <ButtonGroup>
      {children}
    </ButtonGroup>
  );
}

export { ButtonGroupSeparator as RowActionsSeparator };
