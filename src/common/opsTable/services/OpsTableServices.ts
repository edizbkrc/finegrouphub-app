import moment from "moment";
import {
  createColumnHelper,
  type InitialTableState,
  type Row,
} from "@tanstack/react-table";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { CRUD_KEY, toListRequest, fromListResponse } from "@network/adapters";
import { AppDispatch } from "@redux/store";
import { setOpsModalData, setOpsModalVisible } from "@redux/appSlice";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import { genericFormatString } from "@opsTable/helpers/genericFormatString";
import { formatObject } from "@opsTable/helpers/formatObjectString";
import { mapTypeToEnum } from "@opsTable/helpers/mapTypeToEnum";
import { sortByPinned } from "@opsTable/helpers/sortByPinned";
import { listRequestToQueryString } from "@opsTable/helpers/listRequestToQueryString";
import { queryStringToListRequest } from "@opsTable/helpers/queryStringToListRequest";
import { updateQueryParams } from "@opsTable/helpers/updateQueryParams";
import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";
import { SortTypeEnum } from "@common/enums/SortTypeEnum";
import { FilterTypeEnum } from "@common/enums/FilterTypeEnum";
import type { IMetadata } from "@common/types/IMetadata";
import type { IListRequest } from "@common/types/IListRequest";
import type { IFilterCriteria } from "@common/types/IFilterCriteria";
import { resetTableState, setTableState } from "../redux/opsTableSlice";
import type { ITableResponse } from "../types/ITableResponse";
import type { ITableAggregations } from "../types/ITableAggregations";
import type { ITableFilters } from "../types/ITableFilters";
import type { IOpsTableService } from "../types/IOpsTableService";
import type { IAggregationResult } from "../types/IAggregationResult";
import type { IOpsTableReducer } from "../types/IOpsTableReducer";

const DEFAULT_PARAMS = { pageNumber: 1, rowCount: 10 };

/** Filtre değerlerinin kabul edilen tarih formatları. */
const DATE_FORMATS = [
  "YYYY-MM-DDTHH:mm:ss",
  "YYYY-MM-DD hh:mm:ss A",
  "YYYY-MM-DDTHH:mm",
  "YYYY-MM-DD",
];

/**
 * Metadata-güdümlü tablo motoru.
 *
 * Tek satırla tam bir tablo sayfası doğar:
 *   new TableService(ApiRoutes.Users, ApiRoutes.UserDetail)
 *
 * Kolonlar, filtre tipleri, görünürlük ve formatlama TAMAMEN API'nin
 * döndürdüğü `metadatas[]`'tan üretilir — kodda sabit kolon tanımı yoktur.
 */
export class TableService<T> implements IOpsTableService<T> {
  url: string;
  CRUDUrl?: string;
  crudPropertyName: string;
  /**
   * Bazı modüllerde GET-detay ve DELETE farklı sorgu parametresi adı bekliyor
   * (örn. Tenants: detay `tenantId`, silme `id` — bkz. docs/API_ADAPTER.md §7).
   * Verilmezse `crudPropertyName` ile aynı davranır (önceki tüm modüller).
   */
  deletePropertyName: string;
  metadatas?: IMetadata[];
  multipleDelete?: boolean;
  multipleDeletePropertyName?: string;
  extraParams?: Record<string, unknown>;
  defaultQuery?: string;
  /**
   * Kolon metadata'sını tabloya girmeden önce değiştirmek için (ör. projeye özel kolon adı,
   * gizli kolon). Başlıklar API metadata'sından geliyor ve proje bazlı değil; proje bazlı
   * ayarı API'ye taşımak yerine istemcide uyguluyoruz. Atanabilir alan: servis memoize
   * edildiği için ayar değişince servisi yeniden kurmadan güncellenebilsin.
   */
  metadataTransform?: (metadatas: IMetadata[]) => IMetadata[];

  constructor(
    url: ApiRoutes | string,
    CRUDUrl?: ApiRoutes | string,
    // D1: varsayılan her modülde "id" (docs/API_ADAPTER.md §4)
    crudPropertyName: string = CRUD_KEY,
    multipleDelete = false,
    multipleDeletePropertyName = "ids",
    defaultQuery?: string,
    extraParams?: Record<string, unknown>,
    deletePropertyName?: string
  ) {
    this.url = url;
    this.CRUDUrl = CRUDUrl;
    this.crudPropertyName = crudPropertyName || CRUD_KEY;
    this.deletePropertyName = deletePropertyName || this.crudPropertyName;
    this.multipleDelete = multipleDelete;
    this.multipleDeletePropertyName = multipleDeletePropertyName || "ids";
    this.defaultQuery = defaultQuery;
    this.extraParams = extraParams;
  }

  // ── Veri çekme ──────────────────────────────────────────────────────

  /**
   * Liste isteğini gönderir ve tablo durumunu günceller.
   *
   * Referansta `initialProcess`, `refresh` ve `getdata` neredeyse birebir aynı
   * gövdeyi üç kez tekrarlıyordu; tek yerde toplandı.
   */
  private fetch(
    request: IListRequest,
    onSuccess?: (response: ITableResponse<T>) => void,
    onError?: (error: unknown) => void
  ) {
    this.setTableLoading(true);

    return axiosInstance
      .patch<ITableResponse<T>>(this.url, toListRequest(request, this.extraParams), {
        withoutToast: true,
        isMetaData: true,
      })
      .then((response) => {
        // Tablo durumu query string'de yaşar; kullanıcılar filtreli URL paylaşıyor.
        updateQueryParams(listRequestToQueryString(request));

        const fromApi = fromListResponse(response?.data);
        const normalized =
          this.metadataTransform && fromApi.metadatas
            ? { ...fromApi, metadatas: this.metadataTransform(fromApi.metadatas) }
            : fromApi;
        AppDispatch(setTableState(this.prepareTableData(normalized, request)));
        onSuccess?.(normalized);
      })
      .catch((error) => {
        this.setTableLoading(false);
        onError?.(error);
      });
  }

  initialProcess(defaultQuery?: string) {
    AppDispatch(resetTableState());

    const query = defaultQuery || this.defaultQuery || window?.location?.search;

    this.fetch(queryStringToListRequest(query), undefined, () => {
      AppDispatch(resetTableState());
    });
  }

  refresh() {
    this.fetch(queryStringToListRequest(window?.location?.search), undefined, () => {
      AppDispatch(resetTableState());
    });
  }

  getdata(
    requestData: IListRequest,
    successCallback?: (response: ITableResponse<T>) => void,
    errorCallback?: (error: unknown) => void
  ) {
    const currentRequest = queryStringToListRequest(window.location.search);
    const mergedRequest = this.mergeRequest(currentRequest, requestData);

    this.fetch(mergedRequest, successCallback, errorCallback);
  }

  setTableLoading(tableLoading: boolean) {
    AppDispatch(setTableState({ tableLoading }));
  }

  // ── Durum üretimi ───────────────────────────────────────────────────

  generateInitiaTableState(response: ITableResponse<T>): InitialTableState {
    const columnVisibility = (response.metadatas ?? []).reduce<
      Record<string, boolean>
    >((acc, meta) => {
      acc[meta.name] = meta.display;
      return acc;
    }, {});

    return {
      pagination: {
        pageSize: 10,
        pageIndex: Math.max((response.currentPageNumber ?? 1) - 1, 0),
      },
      columnVisibility,
    };
  }

  /**
   * Metadata'dan TanStack kolonları üretir.
   *
   * Hücre render sırası (sözleşme):
   *   nesne + displayFormat → displayFormat → Date (LLL) → decimalPrecision
   *   → ham değer → defaultValue
   */
  generateColumns(metadatas: IMetadata[]) {
    this.metadatas = metadatas;

    const columnHelper = createColumnHelper<Record<string, unknown>>();

    return sortByPinned(metadatas)
      .filter((meta) => meta.display)
      .map((meta) =>
        columnHelper.accessor(meta.name, {
          id: meta.name,
          meta: {
            ...meta,
            filterType: mapTypeToEnum(meta.type, meta.filterComponentType),
          },
          header: meta.localizedName || meta.name,
          enableColumnFilter: meta.filterable,
          cell: (info) => {
            const value = info.getValue();
            const fullRow = info.row.original;

            if (typeof value === "object" && value !== null) {
              if (!meta.displayFormat) return "-";
              return formatObject(fullRow, meta.displayFormat) || meta.defaultValue;
            }

            if (meta.displayFormat) {
              return value !== null
                ? genericFormatString(fullRow, meta.displayFormat)
                : meta.defaultValue;
            }

            if (mapTypeToEnum(meta.type) === TypeGroupEnum.Date) {
              return value ? getLocalizedMoment(value as string).format("LLL") : meta.defaultValue;
            }

            if (meta.decimalPrecision) {
              return Number(value).toFixed(meta.decimalPrecision.scale || 2);
            }

            if (value === 0) return 0;

            return value || meta.defaultValue;
          },
        })
      );
  }

  generateAggregations(aggResult?: IAggregationResult[]): ITableAggregations[] {
    return (aggResult ?? []).map((agg) => ({
      column: agg.aggregatedBy.toLowerCase(),
      type: agg.type,
      value: agg.result,
    })) as ITableAggregations[];
  }

  generateFilters(criterias?: IFilterCriteria[]): ITableFilters[] {
    return (criterias ?? []).map((criteria) => ({
      column: criteria?.filterBy as string,
      operator: criteria?.type,
      type: (criteria as { filterType?: TypeGroupEnum })?.filterType,
      value: criteria?.value,
      otherValue: criteria?.otherValue,
    })) as ITableFilters[];
  }

  prepareTableData(
    data: ITableResponse<T>,
    mergedRequest: IListRequest
  ): IOpsTableReducer {
    return {
      initialTableState: this.generateInitiaTableState(data),
      aggregations: this.generateAggregations(data?.aggregationResults),
      filters: this.generateFilters(mergedRequest?.filtering?.criterias),
      tableResponse: data,
      tableLoading: false,
      tableRequest: mergedRequest,
    };
  }

  /** Mevcut (URL'deki) istek ile yeni parçayı birleştirir. */
  mergeRequest(
    currentRequest: IListRequest,
    newRequestData?: IListRequest
  ): IListRequest {
    const merged: IListRequest = {
      pageNumber: newRequestData?.pageNumber ?? currentRequest.pageNumber,
      rowCount: newRequestData?.rowCount ?? currentRequest.rowCount,
    };

    if (newRequestData?.filtering || currentRequest?.filtering) {
      merged.filtering = {
        ...currentRequest.filtering,
        mergeType:
          newRequestData?.filtering?.mergeType ??
          currentRequest?.filtering?.mergeType,
        criterias: (
          newRequestData?.filtering?.criterias ??
          currentRequest?.filtering?.criterias ??
          []
        ).filter(Boolean),
      };

      if (!merged.filtering.criterias.length && !merged.filtering.mergeType) {
        delete merged.filtering;
      }
    }

    if (newRequestData?.sorting || currentRequest?.sorting) {
      merged.sorting = newRequestData?.sorting ?? currentRequest.sorting;
      if (!merged.sorting?.sortBy) delete merged.sorting;
    }

    if (newRequestData?.aggregation || currentRequest?.aggregation) {
      merged.aggregation = {
        ...currentRequest.aggregation,
        criterias: (
          newRequestData?.aggregation?.criterias ??
          currentRequest?.aggregation?.criterias ??
          []
        ).filter(Boolean),
      };

      if (!merged.aggregation.criterias.length) delete merged.aggregation;
    }

    return merged;
  }

  // ── Kullanıcı aksiyonları ───────────────────────────────────────────

  /**
   * @param pageNumber 1 tabanlı sayfa numarası (MUI Pagination ve API ile aynı).
   *   Referansta parametre adı `pageIndex` idi ama değer 1 tabanlıydı — yanıltıcı.
   */
  onChangePage(pageNumber: number, pageSize: number, callback?: () => void) {
    this.getdata({ pageNumber, rowCount: pageSize }, callback, callback);
  }

  handleFilter(filters: ITableFilters[], callback?: () => void) {
    const convert = (filter: ITableFilters, key: "value" | "otherValue") => {
      const raw = filter[key];

      if (filter?.type === TypeGroupEnum.Number) return Number(raw);

      if (filter?.type === TypeGroupEnum.Date) {
        const parsed = moment(raw as string, DATE_FORMATS, true);
        return key === "value" && filter?.operator === FilterTypeEnum.DateEqualTo
          ? parsed.startOf("day").format()
          : parsed.format();
      }

      return raw;
    };

    const criterias = (filters ?? []).map((filter) => ({
      filterBy: filter.column,
      filterType: filter.type,
      type: filter.operator,
      value: convert(filter, "value"),
      ...(filter.operator === FilterTypeEnum.Between
        ? { otherValue: convert(filter, "otherValue") }
        : {}),
    }));

    this.getdata(
      { ...DEFAULT_PARAMS, filtering: { criterias } },
      callback,
      callback
    );
  }

  handleAggregation(aggregations: ITableAggregations[], callback?: () => void) {
    this.getdata(
      {
        ...DEFAULT_PARAMS,
        aggregation: {
          criterias: aggregations.map((agg) => ({
            aggregateBy: agg.column,
            type: agg.type,
          })),
        },
      },
      callback,
      callback
    );
  }

  handleSort(sortBy: string, type: SortTypeEnum, callback?: () => void) {
    this.getdata(
      { ...DEFAULT_PARAMS, sorting: { sortBy, type } } as IListRequest,
      callback,
      callback
    );
  }

  handleEdit(row: Row<unknown>, useTableData = false) {
    // Detay çağrısı yapmadan satırdaki veriyle düzenle (hafif modüller).
    if (useTableData && row.original) {
      const rowData = { ...(row.original as Record<string, unknown>) };

      const formatted = Object.keys(rowData).reduce<Record<string, unknown>>(
        (acc, key) => {
          const meta = this.metadatas?.find((item) => item.name === key);

          acc[key] =
            meta && mapTypeToEnum(meta.type) === TypeGroupEnum.Date && rowData[key]
              ? moment(rowData[key] as string).format()
              : rowData[key];

          return acc;
        },
        {}
      );

      AppDispatch(setOpsModalData(formatted));
      AppDispatch(setOpsModalVisible(true));
      return;
    }

    if (!this.CRUDUrl || !this.crudPropertyName) return;

    const rowId = (row?.original as { id?: unknown })?.id;
    if (rowId === undefined) return;

    this.setTableLoading(true);

    axiosInstance
      .get(this.CRUDUrl, {
        params: { [this.crudPropertyName]: rowId },
        withoutToast: true,
      })
      .then((response) => {
        this.setTableLoading(false);
        if (!response?.data?.isSuccess) return;

        AppDispatch(setOpsModalData(response.data.data));
        AppDispatch(setOpsModalVisible(true));
      })
      .catch(() => this.setTableLoading(false));
  }

  handleDelete(row: Row<unknown>, callback?: () => void) {
    if (!this.CRUDUrl || !this.crudPropertyName) return;

    const rowId = (row?.original as { id?: unknown })?.id;
    if (rowId === undefined) return;

    // Toplu silme uçları gövdede `{ ids: [] }`, tekil uçlar query param bekler.
    const config = this.multipleDelete
      ? { data: { [this.multipleDeletePropertyName ?? "ids"]: [rowId] } }
      : { params: { [this.deletePropertyName]: rowId } };

    this.setTableLoading(true);

    axiosInstance
      .delete(this.multipleDelete ? this.url : this.CRUDUrl, config)
      .then(() => {
        callback?.();
        // refresh() kendi loading döngüsünü yönetir; burada false'a çekmek
        // referansta yarış yaratıyordu.
        this.refresh();
      })
      .catch(() => {
        callback?.();
        this.setTableLoading(false);
      });
  }
}

export default TableService;
