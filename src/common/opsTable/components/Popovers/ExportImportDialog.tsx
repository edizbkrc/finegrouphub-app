"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import * as XLSX from "xlsx";
import axiosInstance from "@network/axiosInstance";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { IOpsTableService } from "../../types/IOpsTableService";
import type { ITableExcelColumn } from "../../helpers/tableExcelColumns";

interface IParsedRow {
  rowNumber: number;
  values: Record<string, unknown>;
  errors: string[];
}

interface IImportResult {
  rowNumber: number;
  ok: boolean;
  message?: string;
}

interface IProps {
  open: boolean;
  onClose: () => void;
  columns: ITableExcelColumn[];
  opsService?: IOpsTableService<unknown>;
  title?: string;
}

/**
 * Export menüsünden açılan toplu içe aktarma diyaloğu.
 * Şablon başlıklarıyla eşleşen satırları CRUDUrl'e tek tek POST eder.
 */
export default function ExportImportDialog({ open, onClose, columns, opsService, title }: IProps) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<IParsedRow[]>([]);
  const [results, setResults] = useState<IImportResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [readError, setReadError] = useState("");

  const validRows = rows.filter((row) => row.errors.length === 0);
  const invalidRows = rows.filter((row) => row.errors.length > 0);
  const done = results.length > 0 && !busy;
  const successCount = results.filter((result) => result.ok).length;
  const failed = results.filter((result) => !result.ok);

  const reset = () => {
    setRows([]);
    setResults([]);
    setFileName("");
    setProgress(0);
    setReadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const parseFile = async (file: File) => {
    reset();
    setFileName(file.name);
    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const book = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = book.Sheets[book.SheetNames[0]];
      if (!sheet) {
        setReadError("Dosyada sayfa bulunamadı.");
        return;
      }

      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        blankrows: false,
        raw: false,
      });
      if (matrix.length < 2) {
        setReadError("Dosyada veri satırı yok. Önce şablonu indirip doldurun.");
        return;
      }

      const headers = (matrix[0] as unknown[]).map((cell) => String(cell ?? "").trim());
      const indexOf = new Map(headers.map((header, index) => [header, index]));

      const parsed: IParsedRow[] = matrix.slice(1).map((row, offset) => {
        const item: IParsedRow = { rowNumber: offset + 2, values: {}, errors: [] };
        columns.forEach((column) => {
          const index = indexOf.get(column.header);
          if (index === undefined) return;
          const raw = (row as unknown[])[index];
          if (raw === null || raw === undefined || raw === "") return;
          item.values[column.field] = typeof raw === "string" ? raw.trim() : raw;
        });
        return item;
      }).filter((row) => Object.keys(row.values).length > 0);

      if (parsed.length === 0) {
        setReadError("Dolu satır bulunamadı.");
        return;
      }
      setRows(parsed);
    } catch {
      setReadError("Dosya okunamadı. Excel (.xlsx) dosyası olduğundan emin olun.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!opsService?.CRUDUrl) {
      enqueueSnackbar(t("Table.ImportNotSupported"), { variant: "warning" });
      return;
    }

    setBusy(true);
    setResults([]);
    const collected: IImportResult[] = [];
    const total = validRows.length;

    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index];
      try {
        const response = await axiosInstance.post(
          opsService.CRUDUrl,
          { ...row.values, ...(opsService.extraParams ?? {}) },
          { withoutToast: true }
        );
        if (response?.data?.isSuccess) {
          collected.push({ rowNumber: row.rowNumber, ok: true });
        } else {
          collected.push({
            rowNumber: row.rowNumber,
            ok: false,
            message: response?.data?.messages?.[0]?.message ?? t("Toast.Error"),
          });
        }
      } catch (error: unknown) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String((error as { message?: string }).message)
            : t("Toast.Error");
        collected.push({ rowNumber: row.rowNumber, ok: false, message });
      }
      setResults([...collected]);
      setProgress(Math.round(((index + 1) / total) * 100));
    }

    setBusy(false);
    opsService.refresh?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        {t("Table.ImportFromExcel")}
        {title ? ` — ${title}` : ""}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {t("Table.ImportFromExcelHint")}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" variant="contained" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              {t("Table.ChooseFile")}
            </Button>
            {fileName && (
              <Typography variant="body2" color="text.secondary">
                {fileName}
              </Typography>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void parseFile(file);
              }}
            />
          </Stack>

          {readError && <Alert severity="warning">{readError}</Alert>}

          {rows.length > 0 && (
            <Stack direction="row" spacing={1}>
              <Chip size="small" color="success" variant="outlined" label={`${t("Table.ValidRows")}: ${validRows.length}`} />
              {invalidRows.length > 0 && (
                <Chip size="small" color="error" variant="outlined" label={`${t("Table.InvalidRows")}: ${invalidRows.length}`} />
              )}
            </Stack>
          )}

          {validRows.length > 0 && results.length === 0 && (
            <Box sx={{ overflowX: "auto" }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("Table.ImportPreview")}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("Table.Row")}</TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.field}>{column.header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validRows.slice(0, 5).map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      {columns.map((column) => (
                        <TableCell key={column.field}>{String(row.values[column.field] ?? "")}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {busy && results.length > 0 && <LinearProgress variant="determinate" value={progress} />}

          {done && (
            <Alert severity={failed.length === 0 ? "success" : "warning"}>
              {t("Table.ImportResult", { success: successCount, failed: failed.length })}
              {failed.length > 0 && (
                <Box component="ul" sx={{ pl: 2, m: 0, mt: 1 }}>
                  {failed.slice(0, 10).map((result) => (
                    <li key={result.rowNumber}>
                      <Typography variant="body2">
                        {result.rowNumber}. — {result.message}
                      </Typography>
                    </li>
                  ))}
                </Box>
              )}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy} color="tertiary">
          {done ? t("Button.Close") : t("Button.Cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleImport()}
          disabled={busy || validRows.length === 0 || done || !opsService?.CRUDUrl}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {validRows.length > 0 ? t("Table.ImportRows", { count: validRows.length }) : t("Table.ImportFromExcel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
