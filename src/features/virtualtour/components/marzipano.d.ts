declare module "marzipano" {
  export interface ViewerOptions {
    stage?: any;
    controls?: any;
  }

  export interface SceneConfig {
    source: any;
    geometry: any;
    view: any;
  }

  export interface ViewParameters {
    yaw?: number;
    pitch?: number;
    fov?: number;
  }

  export interface Coordinates {
    yaw: number;
    pitch: number;
  }

  export interface ScreenCoordinates {
    x: number;
    y: number;
  }

  export class Viewer {
    constructor(element: HTMLElement, options?: ViewerOptions);
    createScene(config: SceneConfig): Scene;
    switchScene(scene: Scene): void;
    view(): RectilinearView;
  }

  export class Scene {
    hotspotContainer(): HotspotContainer;
  }

  export class HotspotContainer {
    createHotspot(element: HTMLElement, coordinates: Coordinates): void;
    destroyAllHotspots(): void;
  }

  export class RectilinearView {
    constructor(parameters?: ViewParameters);
    setParameters(parameters: ViewParameters): void;
    setFov(fov: number): void;
    yaw(): number;
    pitch(): number;
    fov(): number;
    screenToCoordinates(screen: ScreenCoordinates): Coordinates;
  }

  export class EquirectGeometry {
    constructor(levelList: Array<{ width: number }>);
  }

  export class ImageUrlSource {
    static fromString(url: string, options?: any): ImageUrlSource;
  }
}
