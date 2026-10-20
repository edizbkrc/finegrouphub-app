import type { Table } from "@tanstack/react-table";
import type { IMetadata } from "@common/types/IMetadata";

/** Seçim / aksiyon gibi veri taşımayan kolonlar şablona ve içe aktarıma girmez. */
const SKIP_IDS = new Set(["select", "selection", "actions", "mrt-row-select", "mrt-row-actions"]);

export interface ITableExcelColumn {
  /** Excel başlığı (kullanıcının gördüğü ad). */
  header: string;
  /** API alan adı — kolon `id` / accessor. */
  field: string;
}

/**
 * Önce API metadata (tüm display kolonlar), yoksa tablo leaf kolonları.
 * Şablonda "her kolon boş" olsun diye görünürlük filtresi uygulanmaz.
 */
export const resolveExcelColumns = <T>(
  table: Table<T>,
  metadatas?: IMetadata[] | null
): ITableExcelColumn[] => {
  const fromMeta = (metadatas ?? [])
    .filter((meta) => meta.display !== false && meta.name)
    .map((meta) => ({
      header: String(meta.localizedName || meta.name),
      field: meta.name,
    }));

  if (fromMeta.length > 0) return fromMeta;
  return getTableExcelColumns(table);
};

/** Tablodaki leaf veri kolonları (metadata yoksa yedek). */
export const getTableExcelColumns = <T>(table: Table<T>): ITableExcelColumn[] => {
  return table
    .getAllLeafColumns()
    .filter((column) => {
      const id = column.id ?? "";
      if (!id || SKIP_IDS.has(id)) return false;
      if (id.toLowerCase().includes("select")) return false;
      return true;
    })
    .map((column) => {
      const headerRaw = column.columnDef.header;
      const header =
        typeof headerRaw === "string" && headerRaw.trim()
          ? headerRaw
          : column.id;
      return { header: String(header), field: column.id };
    });
};
