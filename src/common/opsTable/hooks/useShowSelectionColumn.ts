import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { setShowSelectionColumn as setValue } from "../redux/opsTableSlice";

export function useShowSelectionColumn() {
  const showSelectionColumn = useAppSelector(
    (state) => state.TableReducer.showSelectionColumn
  );
  const dispatch = useAppDispatch();

  const setShowSelectionColumn = (value: boolean) => {
    dispatch(setValue(value));
  };

  return {
    showSelectionColumn,
    setShowSelectionColumn,
  };
}
