import WorkspaceScreen from "@/features/workspace/WorkspaceScreen";

/**
 * Çizim alanı tam ekran açılır — proje kabuğunun (sekmeler/sağ ray) dışında,
 * çünkü editör tüm genişliği kullanıyor.
 */
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <WorkspaceScreen projectId={Number(projectId)} />;
}
