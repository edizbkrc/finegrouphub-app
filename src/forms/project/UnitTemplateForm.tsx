"use client";

import { useTranslations } from "next-intl";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";
import { VirtualTourEntityTypeEnum } from "@features/virtualtour/types/VirtualTourEntityTypeEnum";
import EntityVirtualTourList from "@/features/project/virtual-tours/EntityVirtualTourList";
import { hiddenAreaZeros } from "@features/project/unitAreaFields";
import { useUnitAreaFields } from "@features/project/useUnitAreaFields";
import { buildUnitTemplateScheme } from "./unitTemplateScheme";
import UnitTemplateFormSpecifications from "./UnitTemplateFormSpecifications";

/** Daire (mülk) şablonu: tip, alanlar, teknik özellikler ve (düzenlemede) sanal turlar. */
export default function UnitTemplateForm({
  opsService,
  projectId,
  succesCallback,
}: {
  opsService: IOpsTableService<unknown>;
  projectId: number;
  /** Kart ızgarası tablo kullanmadığı için kayıttan sonra listeyi kendisi yeniler. */
  succesCallback?: () => void;
}) {
  const t = useTranslations();
  const { opsModalData } = useOpsModal();
  const areaFields = useUnitAreaFields();
  const scheme = buildUnitTemplateScheme(t, areaFields);
  const templateId = opsModalData?.id as number | undefined;
  const templateName =
    (opsModalData as { name?: string; translations?: Array<{ name?: string }> })?.name ||
    (opsModalData as { translations?: Array<{ name?: string }> })?.translations?.[0]?.name ||
    "template";

  return (
    <OpsForm
      url={ApiRoutes.UnitTemplateDetail}
      opsService={opsService}
      succesCallback={succesCallback}
      scheme={scheme}
      pageName={OpsPageNames.ProjectOperationManagement}
      title={t("Modal.AddApartmentPlan")}
      editTitle={t("Modal.EditApartmentPlan")}
      lastDisabledRowId={0}
      // extraData OpsForm'da form verisinin ÜSTÜNE yayılıyor; eskiden burada sabit
      // `specifications: []` vardı (Excel'in extraData'sından kopya) ve yeni şablonda girilen
      // ya da içe aktarılan özellikleri her POST'ta siliyordu. Formdakini aynen taşıyoruz.
      // Gizli alanlar şemada olmadığı için create gövdesine 0 olarak buradan ekleniyor.
      getAddExtraData={(formData?: Record<string, unknown>) =>
        opsModalData
          ? undefined
          : { projectId, specifications: formData?.specifications ?? [], ...hiddenAreaZeros(areaFields) }
      }
      renderExtra={(apiData, formState) => (
        <>
          <UnitTemplateFormSpecifications apiData={apiData} formState={formState} projectId={projectId} />
          {templateId ? (
            <EntityVirtualTourList
              projectId={projectId}
              entityId={templateId}
              entityType={VirtualTourEntityTypeEnum.UnitTemplate}
              entityName={String(templateName)}
            />
          ) : null}
        </>
      )}
    />
  );
}
