import { IBaseTableProps } from "./IBaseTableProps";
import { IOpsTableService } from "./IOpsTableService";

export interface IBaseTablePropsWithSerice extends IBaseTableProps {
  opsService: IOpsTableService<any>;
}
