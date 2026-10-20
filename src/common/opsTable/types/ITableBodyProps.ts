import type { Row } from "@tanstack/react-table";
import { IBaseTablePropsWithSerice } from "./IBaseTablePropsWithSerice";
import { ITableProps } from "./ITableProps";

export interface ITableBodyProps extends IBaseTablePropsWithSerice {
  actionIcons?: Array<(row: Row<unknown>) => React.ReactNode>;
  onRowClick?: (row: Row<unknown>) => void;
  tableProps: ITableProps;
}
