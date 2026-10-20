import { useDispatch, useSelector, useStore } from "react-redux";
import type { RootState, AppDispatchType, AppStoreType } from "./store";

// Düz `useDispatch` / `useSelector` yerine bunlar kullanılır.
export const useAppDispatch = useDispatch.withTypes<AppDispatchType>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStoreType>();
