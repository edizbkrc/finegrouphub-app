/** Çalışma alanı varlık tipi — API WorkspaceEntity ile aynı. */
export enum EntityTypeEnum {
  Project = 0,
  ProjectStage = 1,
  Block = 2,
  Floor = 3,
  Unit = 4,
  Dollhouse = 5,
  UnitTemplate = 6,
  ProjectMinimap = 7,
}

export type LookupOption = { id: number | string; title: string };
