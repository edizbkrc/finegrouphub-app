import { InitialTableState, Row } from "@tanstack/react-table";
import { ITableResponse } from "./ITableResponse";
import { IMetadata } from "@common/types/IMetadata";
import { ITableAggregations } from "./ITableAggregations";
import { ITableFilters } from "./ITableFilters";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { IListRequest } from "@common/types/IListRequest";
import { IAggregationResult } from "./IAggregationResult";
import { IFilterCriteria } from "@common/types/IFilterCriteria";
import { IOpsTableReducer } from "./IOpsTableReducer";

/**
 * Interface representing a service for handling operations on a table.
 *
 * @template T - The type of data the table handles.
 */
export interface IOpsTableService<T> {
  /**
   * The URL endpoint for the table service.
   */
  url: string;

  /**
   * Optional URL endpoint for CRUD operations.
   */
  CRUDUrl?: string;

  crudPropertyName: string;

  /** Verilmezse `crudPropertyName` ile aynı davranır (bkz. OpsTableServices.ts). */
  deletePropertyName: string;

  multipleDelete?: boolean;

  multipleDeletePropertyName?: string;

  defaultQuery?: string;

  extraParams?: any;

  metadatas?: IMetadata[];

  /**
   * Initializes the table with an optional default query.
   *
   * @param defaultQuery - The default query to initialize the table with.
   */
  initialProcess: (defaultQuery?: string) => void;

  /**
   * Sets the loading state of the table.
   *
   * @param tableLoading - Boolean indicating if the table is loading.
   */
  setTableLoading: (tableLoading: boolean) => void;

  /**
   * Fetches data for the table.
   *
   * @param requestData - The data required for the request.
   * @param successCallback - Optional callback function to handle successful response.
   * @param errorCallback - Optional callback function to handle errors.
   */
  getdata: (
    requestData: any,
    successCallback?: (response: ITableResponse<T>) => void,
    errorCallback?: (error: any) => void
  ) => void;

  /**
   * Generates the initial state of the table from the response.
   *
   * @param response - The response data to generate the initial state.
   * @returns The initial state of the table.
   */
  generateInitiaTableState: (response: ITableResponse<T>) => InitialTableState;

  /**
   * Generates columns for the table based on metadata.
   *
   * @param metadatas - The metadata to generate columns from.
   * @returns The generated columns.
   */
  generateColumns: (metadatas: IMetadata[]) => any;

  /**
   * Generates aggregations for the table based on aggregation results.
   *
   * @param aggResult - The aggregation results to generate aggregations from.
   * @returns The generated aggregations.
   */
  generateAggregations: (aggResult?: IAggregationResult[]) => any;

  /**
   * Generates filters for the table based on filter criteria.
   *
   * @param criterias - Optional filter criteria to generate filters from.
   * @returns The generated filters.
   */
  generateFilters: (criterias?: IFilterCriteria[]) => ITableFilters[];

  /**
   * Prepares the table data from the response and current request.
   *
   * @param response - The response data to prepare the table data from.
   * @param currentRequest - The current request data.
   * @returns The prepared table data.
   */
  prepareTableData: (
    response: ITableResponse<T>,
    currentRequest: IListRequest
  ) => IOpsTableReducer;

  /**
   * Handles page change in the table.
   *
   * @param pageIndex - The new page index.
   * @param pageSize - The size of the page.
   * @param callback - Optional callback function to execute after page change.
   */
  onChangePage: (
    pageIndex: number,
    pageSize: number,
    callback?: () => void
  ) => void;

  /**
   * Handles filtering of the table.
   *
   * @param filters - The filters to apply.
   * @param callback - Optional callback function to execute after filtering.
   */
  handleFilter: (filters: ITableFilters[], callback?: () => void) => void;

  /**
   * Handles aggregation of the table.
   *
   * @param aggregations - The aggregations to apply.
   * @param callback - Optional callback function to execute after aggregation.
   */
  handleAggregation: (
    aggregations: ITableAggregations[],
    callback?: () => void
  ) => void;

  /**
   * Handles sorting of the table.
   *
   * @param sortBy - The field to sort by.
   * @param type - The type of sorting (ascending or descending).
   * @param callback - Optional callback function to execute after sorting.
   */
  handleSort: (
    sortBy: string,
    type: SortTypeEnum,
    callback?: () => void
  ) => void;

  /**
   * Handles editing of a row in the table.
   *
   * @param row - The row to edit.
   */
  handleEdit: (row: Row<unknown>, useTableData?: boolean) => void;

  /**
   * Handles deletion of a row in the table.
   *
   * @param row - The row to delete.
   * @param callback - Optional callback function to execute after deletion.
   */
  handleDelete: (row: Row<unknown>, callback?: () => void) => void;
  /**
   *  Refreshes the table data.
   *
   */
  refresh: () => void;
}
