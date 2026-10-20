"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";

export interface IProjectSummary {
  id: number;
  name?: string;
  slogan?: string;
  slug?: string;
  state?: number;
  company?: { id: string; name?: string } | null;
  companyIsActive?: boolean;
  serviceEndDate?: string;
  lifeEndDate?: string;
  stageCount?: number;
  [key: string]: unknown;
}

interface IProjectContext {
  projectId: number;
  project: IProjectSummary | null;
  loading: boolean;
  notFound: boolean;
  reload: () => void;
}

const ProjectContext = createContext<IProjectContext | null>(null);

/** Proje alt sayfalarının (etap, blok, daire...) ortak bağlamı: proje özeti tek seferde yüklenir. */
export function ProjectProvider({ projectId, children }: { projectId: number; children: ReactNode }) {
  const [project, setProject] = useState<IProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    axiosInstance
      .get(ApiRoutes.ProjectDetail, { params: { projectId }, withoutToast: true })
      .then((res) => {
        if (res?.data?.isSuccess && res.data.data) {
          setProject(res.data.data as IProjectSummary);
          setNotFound(false);
        } else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return <ProjectContext.Provider value={{ projectId, project, loading, notFound, reload }}>{children}</ProjectContext.Provider>;
}

export const useProject = (): IProjectContext => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used inside <ProjectProvider>");
  return context;
};

/** Proje filtresi: lookup isteklerinde yalnızca bu projenin kayıtlarını getirir. */
export const projectFilter = (projectId: number) => ({
  criterias: [{ filterBy: "ProjectId", value: projectId, type: 5 }],
});
