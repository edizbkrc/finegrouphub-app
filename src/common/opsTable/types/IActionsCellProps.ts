import type { Row } from "@tanstack/react-table";
import { ITableProps } from "./ITableProps";

export interface IActionsCellProps {
  row: Row<unknown>;
  actionIcons?: Array<(row: Row<unknown>) => React.ReactNode>;
  handleDeleteIconClick: () => void;
  handleEditIconClick: (row: Row<unknown>) => void;
  tableProps: ITableProps;
}
