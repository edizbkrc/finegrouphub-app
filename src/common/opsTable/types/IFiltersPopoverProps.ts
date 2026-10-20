import { IBaseTablePropsWithSerice } from "./IBaseTablePropsWithSerice";

export interface IFiltersPopoverProps extends IBaseTablePropsWithSerice {
  handlePopoverClose?: () => void;
}
