import type { Row } from "@tanstack/react-table";

export interface IBodyDeleteElemetProps {
  row: Row<unknown>;
  handleCancelDelete: () => void;
  handleCancel: () => void;
  rowHeigh: string;
  showSelectionColumn?: boolean;
  tableCellSize: "small" | "medium";
}
