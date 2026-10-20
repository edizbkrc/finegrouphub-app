import { IBaseTablePropsWithSerice } from "./IBaseTablePropsWithSerice";

export interface IAggregationPopoverProps extends IBaseTablePropsWithSerice {
  handlePopoverClose?: () => void;
}
