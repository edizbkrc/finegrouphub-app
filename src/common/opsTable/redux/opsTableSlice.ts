import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DensityEnums } from "../constants/DensityEnums";
import type { ITableAggregations } from "../types/ITableAggregations";
import type { ITableFilters } from "../types/ITableFilters";
import type { IOpsTableReducer } from "../types/IOpsTableReducer";

const createInitialState = (): IOpsTableReducer => ({
  tableLoading: false,
  showSelectionColumn: false,
  filters: [],
  aggregations: [],
  tableRequest: undefined,
  tableResponse: undefined,
  columns: [],
  initialTableState: {
    pagination: { pageSize: 10, pageIndex: 0 },
  },
});

export const tableSlice = createSlice({
  name: "tableReducer",
  initialState: createInitialState(),
  reducers: {
    /** TableService'in ürettiği kısmi durumu birleştirir. */
    setTableState: (state, action: PayloadAction<Partial<IOpsTableReducer>>) => {
      Object.assign(state, action.payload);
    },
    resetTableState: () => createInitialState(),
    setShowSelectionColumn: (state, action: PayloadAction<boolean>) => {
      state.showSelectionColumn = action.payload;
    },
    setDensity: (state, action: PayloadAction<DensityEnums>) => {
      state.density = action.payload;
    },
    setFilters: (state, action: PayloadAction<ITableFilters[]>) => {
      state.filters = action.payload;
    },
    setAggregations: (state, action: PayloadAction<ITableAggregations[]>) => {
      state.aggregations = action.payload;
    },
    setTableLoading: (state, action: PayloadAction<boolean>) => {
      state.tableLoading = action.payload;
    },
  },
});

export const {
  setTableState,
  resetTableState,
  setShowSelectionColumn,
  setDensity,
  setFilters,
  setAggregations,
  setTableLoading,
} = tableSlice.actions;

export default tableSlice.reducer;
