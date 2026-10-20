/** Workspace (çizim alanı) API tipleri — `WorkspaceDto` / `WorkspaceItemDto` karşılıkları. */

export interface ILookupOption {
  id: number;
  name: string;
}

export interface IFileInformation {
  url?: string | null;
  altText?: string | null;
  fileName?: string | null;
}

/** Editörün ürettiği poligon. Alan adları editörün `exportJson()` çıktısıyla birebir. */
export interface ISvgPolygon {
  id?: string;
  type?: number;
  typeDescription?: string | null;
  shapeType?: number;
  shapeTypeDescription?: string | null;
  entityType?: number | null;
  entityTypeDescription?: string | null;
  relatedEntityId?: number | string | null;
  relatedEntity?: unknown;
  navigationType?: number;
  navigationTypeDescription?: string | null;
  navigationId?: number | string | null;
  navigationValue?: string | null;
  customFillColor?: string | null;
  customFillOpacity?: number | null;
  customStrokeColor?: string | null;
  customStrokeWidth?: number | null;
  isLocked?: boolean;
  /** Fine3D blok/etap yazısı — poligon tepesine göre kaydırma (çizim uzayı, 1920×1080). */
  labelOffsetX?: number | null;
  labelOffsetY?: number | null;
  points?: { x: number; y: number; cp?: { x: number; y: number } | null }[];
}

export interface IWorkspaceItem {
  /** API Guid string veya sayısal id dönebilir (minimap vb.). */
  id: number | string;
  order: number;
  mainFrame: boolean;
  compassDegree: number;
  presentationType?: number | null;
  image?: IFileInformation | null;
  /** Aynı karedeki bağlı gece görseli; poligonlar paylaşılır. */
  nightImage?: IFileInformation | null;
  polygons?: ISvgPolygon[] | null;
}

export interface IWorkspace {
  /**
   * API düz enum değeri döndürüyor (`[0,1,2,3,5,6,7]`), `{id,name}` değil —
   * adlar panelin `EntityType.*` çevirilerinden geliyor.
   */
  entityTypes: number[];
  polygonTypes?: ILookupOption[] | null;
  polygonEntityTypes?: ILookupOption[] | null;
  navigationTypes?: ILookupOption[] | null;
  /** API düz enum değeri döndürüyor (`[1,2,3]`); eski `{id,name}` biçimi de kabul edilir. */
  presentationTypes?: Array<number | ILookupOption> | null;
  stageCount: number;
  itemLimit: number;
  mainFrameLimit: number;
  /** Entity seçilmeden çağrıldığında API `null` döner (boş dizi değil). */
  items?: IWorkspaceItem[] | null;
}
