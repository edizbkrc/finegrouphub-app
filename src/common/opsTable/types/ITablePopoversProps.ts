import { ExportTypeEnum } from "../constants/ExportTypeEnum";
import { IBaseTablePropsWithSerice } from "./IBaseTablePropsWithSerice";
import { ITableVisibilityProps } from "./ITableVisibilityProps";

export interface ITablePopoversProps extends IBaseTablePropsWithSerice {
  tableVisibility?: ITableVisibilityProps;
  exportType?: ExportTypeEnum;
  title?: string;
}
