import { Routes } from "@enums/Routes";

/** Proje içi ve tam ekran sanal tur rotaları (locale öneki yok). */
export const ProjectEndpoint = {
  Project: (projectId: number | string) => `${Routes.Project}/${projectId}`,
  UnitTemplates: (projectId: number | string) => `${Routes.Project}/${projectId}/unit-templates`,
  /** Geri dönüş için şablon listesi (detay sayfası modal). */
  UnitTemplate: (projectId: number | string, _unitTemplateId?: number | string) =>
    `${Routes.Project}/${projectId}/unit-templates`,
  ProjectVirtualTours: (projectId: number | string) => `${Routes.Project}/${projectId}/virtual-tours`,
  VirtualTourCreate: (projectId: number | string) => `${Routes.VirtualTours}/project/${projectId}/new`,
  VirtualTourDetail: (projectId: number | string, tourId: number | string) =>
    `${Routes.VirtualTours}/project/${projectId}/${tourId}`,
  VirtualTourEntityCreate: (
    projectId: number | string,
    entityId: number | string,
    entityType: number | string,
    name: string
  ) =>
    `${Routes.VirtualTours}/project/${projectId}/entity/${entityId}/${entityType}/${encodeURIComponent(name)}/virtual`,
  VirtualTourEntityDetail: (
    projectId: number | string,
    entityId: number | string,
    entityType: number | string,
    name: string,
    tourId: number | string
  ) =>
    `${Routes.VirtualTours}/project/${projectId}/entity/${entityId}/${entityType}/${encodeURIComponent(name)}/virtual/${tourId}`,
  UnitSearchDetail: (projectId: number | string, unitId: number | string) =>
    `${Routes.Project}/${projectId}/units/search/unit/${unitId}`,
  InfoCards: (projectId: number | string) => `${Routes.Project}/${projectId}/info-cards`,
  AddInfoCard: (projectId: number | string) => `${Routes.Project}/${projectId}/info-cards/info-card`,
  InfoCard: (projectId: number | string, infoCardId: number | string) =>
    `${Routes.Project}/${projectId}/info-cards/info-card/${infoCardId}`,
};
