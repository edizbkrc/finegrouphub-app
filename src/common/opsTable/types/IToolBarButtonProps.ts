import type { Row } from "@tanstack/react-table";

export interface IToolBarButtonProps {
  label: string;
  color?: "primary" | "secondary";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onClick: (rows: Row<unknown>[]) => void;
}
