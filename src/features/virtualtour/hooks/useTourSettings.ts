import { useState } from "react";
import { TourSettings } from "../types";

export const useTourSettings = () => {
  const [tourSettings, setTourSettings] = useState<TourSettings>({
    name: "",
    initialSceneId: null,
    autorotateEnabled: false,
    fullscreenButton: true,
    viewControlButtons: true,
    mouseViewMode: 1,
  });

  const updateTourSettings = (updates: Partial<TourSettings>) => {
    setTourSettings((prev) => ({ ...prev, ...updates }));
  };

  const resetTourSettings = () => {
    setTourSettings({
      name: "",
      initialSceneId: null,
      autorotateEnabled: false,
      fullscreenButton: true,
      viewControlButtons: true,
      mouseViewMode: 1,
    });
  };

  return {
    tourSettings,
    setTourSettings,
    updateTourSettings,
    resetTourSettings,
  };
};
