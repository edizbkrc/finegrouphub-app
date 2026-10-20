"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import OpsForm from "@common/form/OpsForm";
import { useOpsModal } from "@hooks/useOpsModal";
import { OpsPageNames } from "@enums/OpsPageNames";
import { FormItemTypeEnum } from "@common/enums/FormItemTypeEnum";
import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import { diffFormObject } from "@common/helpers/diffFormObject";
import { uploadPendingFiles, type IUploadItem } from "@common/helpers/processFormUploads";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsTableService } from "@opsTable/types/IOpsTableService";
import { projectFilter, useProject } from "@/features/project/ProjectContext";
import type { IFeatureSpecification } from "@/features/offer/types";
import { prepareNestedImageItems } from "@forms/helpers/prepareNestedImageItems";
import { lookup } from "@forms/helpers/formHelpers";
import { hiddenAreaZeros, type UnitAreaFieldKey } from "@features/project/unitAreaFields";
import { useUnitAreaFields } from "@features/project/useUnitAreaFields";
import BalconyFormItems from "./BalconyFormItems";

export interface IFloorOption {
  id: number;
  number: number;
  templateName?: string | null;
}

interface IUnitDetail {
  floor?: { id: number; name?: string; number?: number } | null;
  templateSpecs?: { id: number; name?: string; unitType?: { id: number; name?: string } | null } | null;
  /** Daireye özel tip; null → şablonun tipi geçerli. */
  unitTypeId?: number | null;
  currentState?: { id: number; name?: string } | null;
  facades?: number[];
}

function hasUnitBalconyImage(features: IFeatureSpecification[] | undefined): boolean {
  const spec = features?.find((item) => item.featureAlias === "unit-balcony-image");
  if (!spec) return false;
  // unit-balcony-image adet tipinde (FeatureType.Count): değer satın alınan balkon sayısı
  // (112, 660…). Yalnız 1'e bakmak bölümü lisanslı projelerde de gizliyordu.
  return spec.value === true || Number(spec.value) > 0;
}

/**
 * Daire (mülk). Oluşturma blok sayfasından; düzenleme liste/arama detayından.
 */
export default function UnitForm({
  opsService,
  projectId,
  stageId,
  floors = [],
}: {
  opsService: IOpsTableService<unknown>;
  projectId: number;
  stageId?: number;
  floors?: IFloorOption[];
}) {
  const t = useTranslations();
  const { enqueueSnackbar } = useSnackbar();
  const { opsModalData, closeOpsModal } = useOpsModal();
  const { project } = useProject();
  const filter = projectFilter(projectId);
  const isEdit = !!opsModalData;
  const features = (project?.featureSpecifications as IFeatureSpecification[] | undefined) ?? [];
  const showBalconies = hasUnitBalconyImage(features);

  const areaFields = useUnitAreaFields();

  // Şablon formuyla aynı kural (unitTemplateScheme.ts): gizli alan şemaya girmez, create'te
  // 0 gider, update'te hiç gönderilmez; görünür alan projeye özel adı taşır.
  const area = (name: UnitAreaFieldKey, label: string): IFormItem[] => {
    const resolved = areaFields[name];
    if (resolved.hidden) return [];
    return [
      {
        name,
        label,
        labelText: resolved.label,
        placeholder: t("Form.PlaceHolderValue", { value: resolved.label }),
        type: FormItemTypeEnum.Decimal,
        visibility: FormItemVisibilityEnum.Both,
        gridSize: { xs: 12, md: 4 },
        registerOptions: { required: t("Form.Required") },
      },
    ];
  };

  const scheme: IFormItem[] = [
    {
      name: "unitNumber",
      label: "UnitNumber",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required"), maxLength: { value: 50, message: t("Form.MaxLength", { max: 50 }) } },
    },
    {
      name: "floorId",
      label: "Floor",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: floors.length ? FormItemVisibilityEnum.Both : FormItemVisibilityEnum.Edit,
      handleDisabled: () => floors.length === 0,
      gridSize: { xs: 12, md: 6 },
      registerOptions: floors.length ? { required: t("Form.Required") } : undefined,
      autoCompleteProps: {
        getOptions: (setLoading, setOptions) => {
          setLoading(false);
          setOptions(
            [...floors]
              .sort((a, b) => a.number - b.number)
              .map((floor) => ({ id: floor.id, title: `${t("Project.FloorNumber", { number: floor.number })} · ${floor.templateName ?? ""}` }))
          );
        },
        getDefaultValue: (apiData) => {
          const floor = (apiData as IUnitDetail)?.floor;
          return floor ? { id: floor.id, title: `${t("Project.FloorNumber", { number: floor.number ?? 0 })} · ${floor.name ?? ""}` } : null;
        },
      },
    },
    {
      name: "templateId",
      label: "ApartmentPlan",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { required: t("Form.Required") },
      autoCompleteProps: {
        lookUpParams: { entityName: "UnitTemplate", requestedPropertyNames: ["Name", "GrossArea", "NetArea", "IndoorArea"], filtering: filter },
        getDefaultValue: (apiData) => {
          const template = (apiData as IUnitDetail)?.templateSpecs;
          return template ? { id: template.id, title: template.name ?? String(template.id) } : null;
        },
      },
    },
    {
      // Opsiyonel: boş bırakılırsa şablonun tipi geçerli. Aynı şablonu paylaşan daireler
      // (ör. aynı plan, biri ofis) farklı tipte olabilsin diye daire bazında tutuluyor.
      name: "unitTypeId",
      label: "UnitType",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      placeholder: t("Form.UnitTypeFromTemplate"),
      autoCompleteProps: {
        lookUpParams: lookup("UnitType"),
        getDefaultValue: (apiData) => {
          const detail = apiData as IUnitDetail;
          const type = detail?.templateSpecs?.unitType;
          return detail?.unitTypeId && type ? { id: type.id, title: type.name ?? String(type.id) } : null;
        },
      },
    },
    {
      name: "currentStateId",
      label: "State",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      autoCompleteProps: {
        lookUpParams: { entityName: "UnitState", requestedPropertyNames: ["Name"], filtering: filter },
        getDefaultValue: (apiData) => {
          const state = (apiData as IUnitDetail)?.currentState;
          return state ? { id: state.id, title: state.name ?? String(state.id) } : null;
        },
      },
    },
    ...area("grossArea", "GrossArea"),
    ...area("netArea", "NetArea"),
    ...area("indoorArea", "IndoorArea"),
    {
      name: "price",
      label: "Price",
      type: FormItemTypeEnum.Decimal,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { setValueAs: (value: unknown) => (value === "" || value === undefined || value === null ? undefined : String(value)) },
    },
    { name: "showInFine3d", label: "ShowInFine3d", type: FormItemTypeEnum.SWITCH, visibility: FormItemVisibilityEnum.Both, gridSize: { xs: 12, md: 6 }, defaultValue: true },
    {
      name: "entrance",
      label: "Entrance",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      registerOptions: { maxLength: { value: 100, message: t("Form.MaxLength", { max: 100 }) } },
    },
    {
      name: "facades",
      label: "Facades",
      type: FormItemTypeEnum.AUTO_COMPLETE,
      visibility: FormItemVisibilityEnum.Both,
      gridSize: { xs: 12, md: 6 },
      autoCompleteProps: {
        enumName: "Facade",
        isMultiple: true,
        getDefaultValue: (apiData) => {
          const facades = (apiData as IUnitDetail)?.facades;
          return Array.isArray(facades)
            ? facades.map((item) => ({ id: item, title: t(`Facades.${item}`) }))
            : [];
        },
      },
    },
    {
      name: "tags",
      label: "Tags",
      type: FormItemTypeEnum.TEXT,
      visibility: FormItemVisibilityEnum.Both,
      registerOptions: { maxLength: { value: 500, message: t("Form.MaxLength", { max: 500 }) } },
    },
  ];

  const customSubmit = (formData: Record<string, any>, setSubmitLoading: (v: boolean) => void) => {
    setSubmitLoading(true);
    const uploadItems: IUploadItem[] = [];

    if (showBalconies) {
      prepareNestedImageItems(formData.balconies, uploadItems, opsModalData?.balconies);
      prepareNestedImageItems(formData.balconies, uploadItems, opsModalData?.balconies, "nightImage");
    } else {
      delete formData.balconies;
    }

    // AutoSelect çoklu seçimde nesne dizisi dönebilir → id listesine çevir.
    if (Array.isArray(formData.facades)) {
      formData.facades = formData.facades.map((item: unknown) =>
        item && typeof item === "object" && "id" in (item as object) ? (item as { id: number }).id : item
      );
    }

    const payload = isEdit
      ? diffFormObject(opsModalData, formData)
      : {
          ...formData,
          projectId,
          projectStageId: stageId,
          facades: formData.facades ?? [],
          balconies: formData.balconies ?? [],
          ...hiddenAreaZeros(areaFields),
        };

    if (Object.keys(payload).length === 0 && uploadItems.length === 0) {
      setSubmitLoading(false);
      enqueueSnackbar(t("Toast.NotChangedData"), { variant: "warning", autoHideDuration: 5000 });
      return;
    }

    axiosInstance
      .request({
        url: ApiRoutes.UnitDetail,
        method: isEdit ? "PUT" : "POST",
        data: { ...payload, ...(isEdit && { id: opsModalData?.id }) },
      })
      .then(async (res) => {
        if (!res?.data?.isSuccess) {
          setSubmitLoading(false);
          return;
        }
        await uploadPendingFiles(res.data, uploadItems, () =>
          enqueueSnackbar(t("Toast.ImageUploadError"), { variant: "error", autoHideDuration: 5000 })
        );
        closeOpsModal();
        opsService.initialProcess();
        setSubmitLoading(false);
      })
      .catch(() => setSubmitLoading(false));
  };

  return (
    <OpsForm
      url={ApiRoutes.UnitDetail}
      opsService={opsService}
      scheme={scheme}
      pageName={OpsPageNames.ProjectOperationManagement}
      title={t("Modal.AddUnit")}
      editTitle={t("Modal.EditUnit")}
      lastDisabledRowId={0}
      customSubmit={customSubmit}
      getAddExtraData={() =>
        opsModalData ? undefined : { projectId, projectStageId: stageId, facades: [], balconies: [], ...hiddenAreaZeros(areaFields) }
      }
      renderExtra={
        showBalconies
          ? (apiData, formState) => <BalconyFormItems apiData={apiData} formState={formState} />
          : undefined
      }
    />
  );
}
