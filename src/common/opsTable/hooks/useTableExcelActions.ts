"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import moment from "moment";
import { useSnackbar } from "notistack";
import type { Table } from "@tanstack/react-table";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { setGeneralLoading } from "@redux/appSlice";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import showOpsApiMessages from "@helpers/Network/showOpsApiMessages";
import { getCommonErrorMessage } from "@helpers/Network/getCommonErrorMessage";
import { genericFormatString } from "@opsTable/helpers/genericFormatString";
import { formatObject } from "@opsTable/helpers/formatObjectString";
import { mapTypeToEnum } from "@opsTable/helpers/mapTypeToEnum";
import { TypeGroupEnum } from "@common/enums/TypeGroupEnum";
import { ExportTypeEnum } from "../constants/ExportTypeEnum";
import { resolveExcelColumns, type ITableExcelColumn } from "../helpers/tableExcelColumns";
import type { IOpsTableService } from "../types/IOpsTableService";

interface IUseTableExcelActionsArgs {
  table: Table<unknown>;
  exportType?: ExportTypeEnum;
  title?: string;
  opsService?: IOpsTableService<unknown>;
}

/** CSV dışa aktar, boş şablon ve içe aktar kolonları — toolbar butonları için. */
export function useTableExcelActions({
  table,
  exportType,
  title,
  opsService,
}: IUseTableExcelActionsArgs) {
  const t = useTranslations("Table");
  const dispatch = useAppDispatch();
  const { tableRequest } = useAppSelector((state) => state.TableReducer);
  const { enqueueSnackbar } = useSnackbar();

  const columns = useMemo(
    () => resolveExcelColumns(table, opsService?.metadatas),
    [table, opsService?.metadatas]
  );
  const fileBase = title || "export";
  const canImport = Boolean(opsService?.CRUDUrl);

  const exportCsv = useCallback(() => {
    if (exportType !== undefined) {
      dispatch(setGeneralLoading(true));
      const name = `${fileBase}-${moment().format("YYYY-MM-DD")}.csv`;

      axiosInstance
        .post(
          ApiRoutes.Export,
          {
            listRequest: {
              filtering: tableRequest?.filtering,
              sorting: tableRequest?.sorting,
              aggregation: tableRequest?.aggregation,
            },
            exportType,
          },
          { responseType: "blob", withoutToast: true, isMetaData: false }
        )
        .then(async (response) => {
          const contentType: string | undefined = response.headers["content-type"];
          const contentDisposition: string | undefined = response.headers["content-disposition"];
          const fileNameMatch = contentDisposition?.match(/filename\*?=['"]?([^;'"]+)/i);
          const fileName = fileNameMatch ? fileNameMatch[1] : name;

          if (contentType?.startsWith("application/json")) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const jsonData = JSON.parse(reader.result as string);
                if (jsonData) {
                  showOpsApiMessages(jsonData);
                } else {
                  enqueueSnackbar(getCommonErrorMessage(), { variant: "warning", autoHideDuration: 5000 });
                }
              } catch {
                enqueueSnackbar(getCommonErrorMessage(), { variant: "warning", autoHideDuration: 5000 });
              }
            };
            reader.readAsText(response.data);
            dispatch(setGeneralLoading(false));
            return;
          }

          if (contentType?.startsWith("application/")) {
            const blob = new Blob([response.data], { type: contentType });
            const downloadUrl = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.download = fileName;
            anchor.href = downloadUrl;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(downloadUrl);
          }

          dispatch(setGeneralLoading(false));
        })
        .catch(() => dispatch(setGeneralLoading(false)));
      return;
    }

    void (async () => {
      const XLSX = await import("xlsx");

      const formattedBody = table.getRowModel().rows.map((row) =>
        row.getVisibleCells().map((cell) => {
          const fullData = cell.row.original;
          const meta = cell.column.columnDef.meta as
            | { displayFormat?: string; defaultValue?: unknown; type?: string }
            | undefined;
          const value = cell.getValue();

          if (typeof value === "object") {
            if (!meta?.displayFormat) return "";
            return formatObject(fullData, meta.displayFormat) || meta?.defaultValue;
          }

          if (meta?.displayFormat) {
            return genericFormatString(fullData, meta.displayFormat) || meta?.defaultValue;
          }

          if (mapTypeToEnum(meta?.type ?? "") === TypeGroupEnum.Date) {
            return value ? getLocalizedMoment(value as string).format("LLL") : meta?.defaultValue;
          }

          return value || meta?.defaultValue;
        })
      );

      const header = table.getHeaderGroups()[0].headers.map((header) => header.column.columnDef.header);

      const worksheet = XLSX.utils.aoa_to_sheet([header, ...formattedBody]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      XLSX.writeFile(workbook, `${fileBase}-${moment().format("YYYY-MM-DD")}.csv`);
    })();
  }, [dispatch, enqueueSnackbar, exportType, fileBase, table, tableRequest]);

  /** Tüm kolon başlıkları + boş satırlar (veri yok). */
  const exportTemplate = useCallback(async () => {
    if (columns.length === 0) {
      enqueueSnackbar(t("ExportTemplateEmpty"), { variant: "warning" });
      return;
    }

    const XLSX = await import("xlsx");
    const headers = columns.map((column) => column.header);
    const emptyRows = Array.from({ length: 20 }, () => headers.map(() => ""));
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...emptyRows]);
    worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(14, String(header).length + 2) }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Veri");
    XLSX.writeFile(workbook, `${fileBase}-sablon.xlsx`, { bookType: "xlsx" });
  }, [columns, enqueueSnackbar, fileBase, t]);

  return { columns, canImport, exportCsv, exportTemplate };
}

export type { ITableExcelColumn };
