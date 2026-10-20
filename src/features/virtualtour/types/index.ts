import * as Marzipano from "marzipano";

// Virtual Tour Types
export interface VirtualTour {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  modifiedAt?: string;
  sceneCount?: number;
  entityName?: string;
  translations?: Translation[];
  viewerSettings?: ViewerSettings;
  scenes?: VirtualTourScene[];
  projectId?: number;
  entityId?: number;
  entityType?: number;
}

export interface Translation {
  languageId: number;
  languageCode?: string;
  name?: string;
  description?: string;
  title?: string;
  content?: string;
  text?: string;
  value?: string;
}

export interface VirtualTourTranslation {
  languageId: number;
  value: string;
}

export interface ViewerSettings {
  mouseViewMode?: number;
  autorotateEnabled?: boolean;
  fullscreenButton?: boolean;
  viewControlButtons?: boolean;
  initialSceneId?: string;
}

export interface VirtualTourScene {
  id: string;
  nameTranslations: VirtualTourTranslation[];
  descriptionTranslations: VirtualTourTranslation[];
  // Legacy fields for backward compatibility
  name?: string;
  description?: string;
  imageUrl?: string;
  fileName?: string;
  nightImageUrl?: string;
  nightFileName?: string;
  _nightScene?: Marzipano.Scene;
  faceSize?: number;
  initialView?: CameraView;
  linkHotspots?: LinkHotspot[];
  infoHotspots?: InfoHotspot[];
  _scene?: Marzipano.Scene;
  _view?: Marzipano.RectilinearView;
  translations?: Translation[];
  initialViewParameters?: InitialViewParameters;
  hotspots?: Hotspot[];
  image?: SceneImage;
}

export interface CameraView {
  yaw: number;
  pitch: number;
  fov: number;
}

export interface InitialViewParameters {
  yaw: number;
  pitch: number;
  fov: number;
}

export interface Hotspot {
  id: string;
  type: number; // 0: info, 1: link
  yaw: number;
  pitch: number;
  targetScene?: string;
  translations?: Translation[];
}

export interface InfoHotspot {
  id: string;
  title: string;
  content?: string;
  yaw: number;
  pitch: number;
}

export interface LinkHotspot {
  id: string;
  title: string;
  targetScene: string;
  yaw: number;
  pitch: number;
}

export interface SceneImage {
  fileName: string;
  fileExtension: string;
  fileSizeInBytes: number;
  altText: string;
  order: number;
  url?: string;
}

export interface EditingScene {
  id: string;
  name: string;
  description: string;
  yaw: string;
  pitch: string;
  fov: string;
  faceSize: string; // Keep as string for form handling
}

export interface HotspotForm {
  type: "info" | "link";
  title: string;
  content?: string;
  targetScene?: string;
  position: { yaw: number; pitch: number } | null;
}

export interface TourSettings {
  name: string;
  initialSceneId: string | null;
  autorotateEnabled: boolean;
  fullscreenButton: boolean;
  viewControlButtons: boolean;
  mouseViewMode: number;
}

export interface SceneChanges {
  created: VirtualTourScene[];
  updated: VirtualTourScene[];
  deleted: VirtualTourScene[];
}

export interface CameraInfo {
  fov: string;
  yaw: string;
  pitch: string;
  sceneName: string;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "info" | "success" | "warning" | "error";
}

// API Response Types
export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  statusCode?: number;
}

// Scene DTO for API calls
export interface SceneDto {
  id: string;
  translations: Translation[];
  faceSize: number;
  initialViewParameters: InitialViewParameters;
  hotspots: Hotspot[];
  image?: SceneImage;
}

// Scene DTO for updates (wrapped values)
export interface SceneDtoUpdate {
  id: string;
  translations: {
    value: Translation[];
    isUpdated: boolean;
  };
  faceSize: {
    value: number;
    isUpdated: boolean;
  };
  initialViewParameters: {
    value: InitialViewParameters;
    isUpdated: boolean;
  };
  hotspots: {
    value: Hotspot[];
    isUpdated: boolean;
  };
  image?: {
    value: SceneImage;
    isUpdated: boolean;
  };
}
