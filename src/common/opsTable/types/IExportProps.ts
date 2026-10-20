import { ExportTypeEnum } from "../constants/ExportTypeEnum";
import { IBaseTableProps } from "./IBaseTableProps";
import type { IOpsTableService } from "./IOpsTableService";

export interface IExportProps extends IBaseTableProps {
  exportType?: ExportTypeEnum;
  title?: string;
  /** İçe aktarma için CRUD uç bilgisi (yoksa içe aktar pasif). */
  opsService?: IOpsTableService<unknown>;
}
