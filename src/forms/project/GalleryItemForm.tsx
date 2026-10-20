"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";
import { projectFilter } from "@/features/project/ProjectContext";

interface IGalleryItemDetail {
  group?: { id: number; name?: string } | null;
}

/** Tek galeri görseli: resim + grup + sıra. Çoklu yükleme için MultiGalleryUploadDialog kullanılır. */
export default function GalleryItemForm({
  opsService,
  projectId,
  succesCallback,
}: {
  opsService: IOpsTableService<unknown>;
  projectId: number;
  succesCallback?: () => void;
}) {
  const t = useTranslations();
  const { opsModalData } = useOpsModal();

  const scheme: IFormItem[] = [
    { name: "image", label: "UploadImage", type: FormItemTypeEnum.S3_IMAGE, visibility: FormItemVisibilityEnum.Both },
    {
      name: "groupId",
      label: "GroupName",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 8 },
      autoCompleteProps: {
        lookUpParams: { entityName: "GalleryGroup", requestedPropertyNames: ["Name"], filtering: projectFilter(projectId) },
        getDefaultValue: (apiData) => {
          const group = (apiData as IGalleryItemDetail)?.group;
          return group ? { id: group.id, title: group.name ?? String(group.id) } : null;
        },
      },
    },
    { name: "displayOrder", label: "Order", type: FormItemTypeEnum.NUMBER, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 4 }, defaultValue: 0 },
  ];

  return (
    <OpsForm
      url={ApiRoutes.GalleryItemDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ProjectOperationManagement}
      title={t("Modal.AddGallery")}
      editTitle={t("Modal.EditGallery")}
      lastDisabledRowId={0}
      // Galeri kartları sayfa durumundan yenilenir; kayıttan sonra modalın düzenleme modunda
      // yeniden açılması (detay refetch) kullanıcıyı gereksiz yere bekletir.
      allowDetailRefetch={false}
      succesCallback={succesCallback}
      getAddExtraData={() => (opsModalData ? undefined : { projectId })}
    />
  );
}
