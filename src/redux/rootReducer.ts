import { combineReducers } from "@reduxjs/toolkit";
import AppReducer from "./appSlice";
import TableReducer from "@opsTable/redux/opsTableSlice";

// DrawReducer (Faz 17) workspace feature'ı ile birlikte eklenecek.
export default combineReducers({
  AppReducer,
  TableReducer,
});
