import { ExportTypeEnum } from "../constants/ExportTypeEnum";
import { IBaseTablePropsWithSerice } from "./IBaseTablePropsWithSerice";
import { ITableVisibilityProps } from "./ITableVisibilityProps";
import { IToolBarButtonProps } from "./IToolBarButtonProps";

export interface ITableToolbarProps extends IBaseTablePropsWithSerice {
  toolBarButtons?: IToolBarButtonProps[];
  tableVisibility?: ITableVisibilityProps;
  exportType?: ExportTypeEnum;
  title?: string;
}
