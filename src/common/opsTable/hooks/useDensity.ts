import { useAppDispatch, useAppSelector } from "@redux/hooks";
import { setDensity } from "../redux/opsTableSlice";
import { DensityEnums } from "../constants/DensityEnums";

export function useDensity() {
  const density = useAppSelector((state) => state.TableReducer.density);
  const dispatch = useAppDispatch();

  const setDensityValue = (density: DensityEnums) => {
    dispatch(setDensity(density));
  };

  return {
    density,
    setDensity: setDensityValue,
  };
}
