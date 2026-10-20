import type { ReactNode } from "react";
import ProjectShell from "@/features/project/ProjectShell";

export default async function ProjectLayout({ params, children }: { params: Promise<{ projectId: string }>; children: ReactNode }) {
  const { projectId } = await params;
  return <ProjectShell projectId={Number(decodeURIComponent(projectId))}>{children}</ProjectShell>;
}
