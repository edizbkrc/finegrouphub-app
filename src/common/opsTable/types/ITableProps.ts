import type { Row } from "@tanstack/react-table";
import { ExportTypeEnum } from "../constants/ExportTypeEnum";

export interface ITableProps {
  showEditIcon?: boolean;
  handleEditIconClick?: (row: Row<unknown>) => void;
  getEditUrl?: (row: Row<unknown>) => string;
  showDeleteIcon?: boolean;
  handleDeleteIconClick?: (row: Row<unknown>) => void;
  handleDeleteSuccessCallBack?: () => void;
  headerBackgroundColor?: string;
  useTableData?: boolean;
  lastDisabledRowId?: number;
  exportType?: ExportTypeEnum;
}
