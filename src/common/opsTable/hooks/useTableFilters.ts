import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { ITableFilters } from "../types/ITableFilters";
import { setFilters as setValue } from "../redux/opsTableSlice";

export const useTableFilters = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.TableReducer.filters);

  const setFilters = (filters: ITableFilters[], isSubmit?: boolean) => {
    dispatch(setValue(filters));
  };

  return {
    filters,
    setFilters,
  };
};
