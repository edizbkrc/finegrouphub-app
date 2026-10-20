"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import axiosInstance from "@network/axiosInstance";
import useSupportedLanguages from "@hooks/useSupportedLanguages";
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
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";
import {
  buildTemplateWorkbook,
  downloadWorkbook,
  dropEmptyRows,
  parseWorkbook,
  rowToPayload,
  schemeToColumns,
  type IParsedRow,
} from "./excelSchema";

interface IExcelBulkImportProps {
  /** Formun şeması — Excel sütunları buradan türetilir. */
  scheme: IFormItem[];
  /** POST edilecek uç (formun kullandığı detay URL'i). */
  url: string;
  /** Yükleme bitince tablo yenilenir. */
  opsService?: IOpsTableService<unknown>;
  /** Her satıra eklenecek sabit alanlar (projectId gibi). */
  extraData?: Record<string, unknown>;
  /** Dosya adında kullanılır: "daire-sablonu.xlsx". */
  fileBaseName: string;
  /** Tablo yerine kendi listesini tutan sayfalar (kart ızgarası) için yenileme. */
  onImported?: () => void;
}

interface IImportResult {
  rowNumber: number;
  ok: boolean;
  message?: string;
}

/**
 * Şemadan boş Excel şablonu indirir ve doldurulmuş dosyayı satır satır API'ye
 * gönderir. Satırlar tek tek gönderilir: biri hata verse de diğerleri geçer ve
 * kullanıcı hangi satırın neden geçmediğini görür.
 */
export default function ExcelBulkImport({ scheme, url, opsService, extraData, fileBaseName, onImported }: IExcelBulkImportProps) {
  const t = useTranslations();
  const { supportedLanguage } = useSupportedLanguages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<IParsedRow[]>([]);
  const [results, setResults] = useState<IImportResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [readError, setReadError] = useState<string>("");

  const columns = useMemo(
    () => schemeToColumns(scheme, (key) => t(key), supportedLanguage),
    [scheme, t, supportedLanguage]
  );

  const validRows = rows.filter((row) => row.errors.length === 0);
  const invalidRows = rows.filter((row) => row.errors.length > 0);

  const reset = () => {
    setRows([]);
    setResults([]);
    setFileName("");
    setProgress(0);
    setReadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTemplate = () => {
    downloadWorkbook(buildTemplateWorkbook(columns), `${fileBaseName}-sablon.xlsx`);
  };

  const handleFile = async (file: File) => {
    reset();
    setFileName(file.name);
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const parsed = dropEmptyRows(parseWorkbook(book, columns));
      if (parsed.length === 0) setReadError("Dosyada veri satırı bulunamadı.");
      setRows(parsed);
    } catch {
      setReadError("Dosya okunamadı. Excel (.xlsx) dosyası olduğundan emin olun.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    setProgress(0);
    const collected: IImportResult[] = [];

    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index];
      const payload = { ...rowToPayload(row, scheme, supportedLanguage), ...(extraData ?? {}) };

      try {
        // withoutToast: satır başına bildirim yerine sonunda tek özet gösterilir.
        const response = await axiosInstance.request({
          url,
          method: "POST",
          data: payload,
          withoutToast: true,
        });
        const body = response?.data;
        collected.push(
          body?.isSuccess
            ? { rowNumber: row.rowNumber, ok: true }
            : { rowNumber: row.rowNumber, ok: false, message: body?.messages?.[0]?.message ?? "Kaydedilemedi" }
        );
      } catch (error) {
        collected.push({
          rowNumber: row.rowNumber,
          ok: false,
          message: error instanceof Error ? error.message : "Sunucuya ulaşılamadı",
        });
      }

      setProgress(Math.round(((index + 1) / validRows.length) * 100));
      setResults([...collected]);
    }

    setBusy(false);
    opsService?.initialProcess();
    onImported?.();
  };

  const successCount = results.filter((result) => result.ok).length;
  const failed = results.filter((result) => !result.ok);
  const done = results.length > 0 && !busy;

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="outlined" onClick={handleTemplate}>
          {t("Table.ExportTemplate")}
        </Button>
        <Button size="small" variant="outlined" onClick={() => setOpen(true)}>
          {t("Table.ImportFromExcel")}
        </Button>
      </Stack>

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Excel&apos;den toplu ekleme</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Önce boş şablonu indirip doldurun. Yalnızca <strong>Veri</strong> sayfası okunur ve başlık satırı
              değiştirilmemelidir.
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button size="small" variant="outlined" onClick={handleTemplate}>
                Boş şablon indir
              </Button>
              <Button size="small" variant="contained" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                Dosya seç
              </Button>
              {fileName && (
                <Typography variant="body2" color="text.secondary">
                  {fileName}
                </Typography>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </Stack>

            {readError && <Alert severity="warning">{readError}</Alert>}

            {rows.length > 0 && (
              <Stack direction="row" spacing={1}>
                <Chip size="small" color="success" variant="outlined" label={`Geçerli: ${validRows.length}`} />
                {invalidRows.length > 0 && (
                  <Chip size="small" color="error" variant="outlined" label={`Hatalı: ${invalidRows.length}`} />
                )}
              </Stack>
            )}

            {invalidRows.length > 0 && (
              <Alert severity="error">
                <Typography variant="subtitle2">Bu satırlar gönderilmeyecek:</Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {invalidRows.slice(0, 10).map((row) => (
                    <li key={row.rowNumber}>
                      <Typography variant="body2">
                        {row.rowNumber}. satır — {row.errors.join("; ")}
                      </Typography>
                    </li>
                  ))}
                </Box>
                {invalidRows.length > 10 && (
                  <Typography variant="caption">…ve {invalidRows.length - 10} satır daha</Typography>
                )}
              </Alert>
            )}

            {validRows.length > 0 && results.length === 0 && (
              <Box sx={{ overflowX: "auto" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Önizleme (ilk 5 satır)
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Satır</TableCell>
                      {columns.map((column) => (
                        <TableCell key={column.header}>{column.header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validRows.slice(0, 5).map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.rowNumber}</TableCell>
                        {columns.map((column) => (
                          <TableCell key={column.header}>
                            {String(
                              row.values[`${column.field}${column.languageCode ? `::${column.languageCode}` : ""}`] ?? ""
                            )}
                          </TableCell>
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
                {successCount} satır eklendi{failed.length > 0 ? `, ${failed.length} satır eklenemedi` : ""}.
                {failed.length > 0 && (
                  <Box component="ul" sx={{ pl: 2, m: 0, mt: 1 }}>
                    {failed.slice(0, 10).map((result) => (
                      <li key={result.rowNumber}>
                        <Typography variant="body2">
                          {result.rowNumber}. satır — {result.message}
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
          <Button onClick={() => setOpen(false)} disabled={busy} color="tertiary">
            {done ? "Kapat" : t("Button.Cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={busy || validRows.length === 0 || done}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {validRows.length > 0 ? `${validRows.length} satırı ekle` : "Ekle"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
