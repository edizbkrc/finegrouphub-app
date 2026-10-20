import { configureStore } from "@reduxjs/toolkit";
import RootReducer from "./rootReducer";

export const store = configureStore({
  reducer: RootReducer,
});

export type AppStoreType = typeof store;
export type RootState = ReturnType<AppStoreType["getState"]>;
export type AppDispatchType = AppStoreType["dispatch"];

export const AppDispatch = store.dispatch;
export const AppStore = store;
