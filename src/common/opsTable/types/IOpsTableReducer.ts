import { ITableAggregations } from "./ITableAggregations";
import { ITableFilters } from "./ITableFilters";
import { DensityEnums } from "../constants/DensityEnums";
import type { ColumnDef, InitialTableState } from "@tanstack/react-table";
import { AccessorKeyColumnDef } from "@tanstack/react-table";
import { ITableResponse } from "./ITableResponse";
import { IListRequest } from "@common/types/IListRequest";

export interface IOpsTableReducer {
  tableRequest?: IListRequest;
  tableResponse?: ITableResponse<unknown>;
  initialTableState?: InitialTableState;
  columns?: ColumnDef<unknown, any>[] | AccessorKeyColumnDef<unknown, never>[];
  aggregations: ITableAggregations[];
  filters: ITableFilters[];
  density?: DensityEnums;
  showSelectionColumn?: boolean;
  isFilterSubmit?: boolean;
  tableLoading: boolean;
}
