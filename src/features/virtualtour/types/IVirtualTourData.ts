// Virtual Tour Data Structure Types

export interface VirtualTourTranslation {
  name: string | null;
  languageId: number;
}

export interface VirtualTourImage {
  id: string | null;
  url: string | null;
  filePath: string | null;
  fileName: string | null;
  fileVersion: number;
  order: number;
  altText: string | null;
}

export interface HotspotTranslation {
  title: string | null;
  content: string | null;
  text: string | null;
  languageId: number;
}

export interface SceneTranslation {
  name: string | null;
  description: string | null;
  languageId: number;
}

export interface InitialViewParameters {
  yaw: number;
  pitch: number;
  fov: number;
}

export interface Hotspot {
  id: string;
  translations: HotspotTranslation[];
  type: string; // "1 -> Link"
  yaw: number;
  pitch: number;
  rotation: number | null;
  targetScene: string;
}

export interface Scene {
  id: string;
  translations: SceneTranslation[];
  image: VirtualTourImage;
  nightImage?: VirtualTourImage | null;
  tilesBaseUrl: string | null;
  tileConfigUrl: string | null;
  fileName: string | null;
  faceSize: number | null;
  hotspots: Hotspot[];
  initialViewParameters: InitialViewParameters;
}

export interface ViewerSettings {
  mouseViewMode: string; // "1 -> Drag"
  autorotateEnabled: boolean;
  fullscreenButton: boolean;
  viewControlButtons: boolean;
  initialSceneId: string | null;
}

export interface AuditInfo {
  creationDate: string | null;
  creatorUserName: string | null;
  lastModificationDate: string | null;
  lastModifierUserName: string | null;
}

export interface IVirtualTourData {
  id: string;
  translations: VirtualTourTranslation[];
  imagesBasePath: string | null;
  scenes: Scene[];
  viewerSettings: ViewerSettings;
  entityId: number;
  entityType: number;
  auditInfo: AuditInfo;
}
