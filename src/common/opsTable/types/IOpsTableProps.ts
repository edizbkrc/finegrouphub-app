import {
  type ColumnDef,
  AccessorKeyColumnDef,
  type Row,
  type InitialTableState,
} from "@tanstack/react-table";
import { IOpsTableService } from "./IOpsTableService";
import { IToolBarButtonProps } from "./IToolBarButtonProps";
import { ITableProps } from "./ITableProps";
import { ITableVisibilityProps } from "./ITableVisibilityProps";

export interface IOpsTableProps {
  opsService: IOpsTableService<any>;
  data: unknown[];
  columns: ColumnDef<unknown, any>[] | AccessorKeyColumnDef<unknown, never>[];
  actionIcons?: Array<(row: Row<unknown>) => React.ReactNode>;
  onRowClick?: (row: Row<unknown>) => void;
  toolBarButtons?: IToolBarButtonProps[];
  tableVisibility?: ITableVisibilityProps;
  initialTableState?: InitialTableState;
  tableProps: ITableProps;
  customAppBar?: React.ReactNode;
  title?: string;
}
