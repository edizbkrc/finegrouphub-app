import type { Row } from "@tanstack/react-table";
import { IOpsTableService } from "./IOpsTableService";
import { IToolBarButtonProps } from "./IToolBarButtonProps";
import { ITableProps } from "./ITableProps";
import { ITableVisibilityProps } from "./ITableVisibilityProps";

export interface IOpsTableContainerProps {
  opsService: IOpsTableService<any>;
  actionIcons?: Array<(row: Row<unknown>) => React.ReactNode>;
  onRowClick?: (row: Row<unknown>) => void;
  toolBarButtons?: IToolBarButtonProps[];
  tableVisibility?: ITableVisibilityProps;
  tableProps?: ITableProps;
  customAppBar?: React.ReactNode;
  pageName?: string;
}
