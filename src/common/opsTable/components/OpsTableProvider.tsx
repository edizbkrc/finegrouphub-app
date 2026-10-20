import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { usePageInformation } from "@hooks/usePageInformation";
import type { ITableProps } from "../types/ITableProps";
import type { IOpsTableContainerProps } from "../types/IOpsTableContainerProps";
import { resetTableState } from "../redux/opsTableSlice";
import OpsTable from "./OpsTable";
import OpsTableContainerSkeleton from "./Loading/OpsTableContainerSkeleton";

/**
 * Tek satırla tam bir tablo sayfası doğurur:
 *
 *   <OpsTableProvider opsService={new TableService(ApiRoutes.Users, ApiRoutes.UserDetail)} />
 *
 * Kolonları metadata'dan üretir, izinlere göre düzenle/sil ikonlarını açar.
 */
export default function OpsTableProvider({
  opsService,
  actionIcons,
  tableVisibility,
  toolBarButtons,
  tableProps: tableDefaultProps,
  customAppBar,
  onRowClick,
  pageName,
}: IOpsTableContainerProps) {
  const dispatch = useAppDispatch();
  const pageInfo = usePageInformation(pageName);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<ColumnDef<unknown, unknown>[]>([]);

  const tableResponse = useAppSelector((state) => state.TableReducer?.tableResponse);

  useEffect(() => {
    const metadatas = tableResponse?.metadatas;
    if (!metadatas) return;

    // ⚠️ Referansta yalnızca `newColumns.length > 0` kontrol ediliyordu;
    // metadata gelip görünür kolon üretmezse (tüm alanlar display:false)
    // `loading` sonsuza kadar true kalıyordu. Metadata varlığı kontrol edilir.
    setColumns(opsService.generateColumns(metadatas));
    setLoading(false);
  }, [opsService, tableResponse?.metadatas]);

  useEffect(() => {
    return () => {
      dispatch(resetTableState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tableDefaultPropsWithInfo: ITableProps = {
    showEditIcon: !!(pageInfo?.hasDetail && pageInfo?.userCanDetail),
    showDeleteIcon: !!(pageInfo?.hasDelete && pageInfo?.userCanDelete),
    ...tableDefaultProps,
  };

  if (loading) return <OpsTableContainerSkeleton />;

  return (
    <OpsTable
      customAppBar={customAppBar}
      opsService={opsService}
      actionIcons={actionIcons}
      tableVisibility={tableVisibility}
      toolBarButtons={toolBarButtons}
      onRowClick={onRowClick}
      tableProps={tableDefaultPropsWithInfo}
      columns={columns}
      data={tableResponse?.data || []}
      title={pageInfo?.localizedName}
    />
  );
}
