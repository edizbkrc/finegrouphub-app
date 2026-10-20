import type { Row } from "@tanstack/react-table";
import { IBaseTablePropsWithSerice } from "./IBaseTablePropsWithSerice";
import { ITableProps } from "./ITableProps";

export interface ITableHeaderProps extends IBaseTablePropsWithSerice {
  tableProps: ITableProps;
  actionIcons?: Array<(row: Row<unknown>) => React.ReactNode>;
}
