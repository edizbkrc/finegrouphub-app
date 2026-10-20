import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { ITableAggregations } from "../types/ITableAggregations";
import { setAggregations } from "../redux/opsTableSlice";

export const useTableAggregations = () => {
  const dispatch = useAppDispatch();
  const aggregations = useAppSelector((s) => s.TableReducer.aggregations);

  const setValue = (aggregations: ITableAggregations[]) => {
    dispatch(setAggregations(aggregations));
  };

  return {
    aggregations,
    setAggregations: setValue,
  };
};
