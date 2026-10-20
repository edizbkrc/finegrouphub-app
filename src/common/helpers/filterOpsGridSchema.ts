import { FormItemVisibilityEnum } from "@common/enums/FormItemVisibilityEnum";
import type { IFormItem } from "@common/types/IFormItem";
import type { IOpsPageFormItem } from "@common/types/IOpsPageFormItem";

const isVisibleFor = (formItem: IFormItem, isEdit: boolean): boolean => {
  const isEditVisible = formItem.visibility === FormItemVisibilityEnum.Edit || formItem.visibility === FormItemVisibilityEnum.Both;
  const isAddVisible = formItem.visibility === FormItemVisibilityEnum.Add || formItem.visibility === FormItemVisibilityEnum.Both;
  return isEdit ? isEditVisible : isAddVisible;
};

const shouldRenderComponent = (item: IOpsPageFormItem, isEdit: boolean): boolean =>
  !!item.renderComponent &&
  (item.renderComponentVisiblitity === FormItemVisibilityEnum.Both ||
    (isEdit && item.renderComponentVisiblitity === FormItemVisibilityEnum.Edit) ||
    (!isEdit && item.renderComponentVisiblitity === FormItemVisibilityEnum.Add));

/**
 * Tam sayfa form şemasını (kartlar + iç içe multiSchema) ekleme/düzenleme
 * moduna göre filtreler; boş kalan kartları da eler.
 */
export function filterOpsGridSchema(schema: IOpsPageFormItem[], isEdit: boolean): IOpsPageFormItem[] {
  return (schema ?? [])
    .map((gridItem) => {
      const filteredInnerSchema = gridItem.schema?.filter((formItem) => isVisibleFor(formItem, isEdit));

      const filteredMultiSchema = gridItem.multiSchema
        ?.map((multiGridItem) => {
          if (shouldRenderComponent(multiGridItem, isEdit)) return multiGridItem;

          return {
            ...multiGridItem,
            schema: multiGridItem.schema?.filter((formItem) => isVisibleFor(formItem, isEdit)),
          };
        })
        .filter((multiGridItem) => (multiGridItem?.schema && multiGridItem.schema.length > 0) || multiGridItem.renderComponent);

      return {
        ...gridItem,
        schema: filteredInnerSchema,
        multiSchema: filteredMultiSchema,
        renderComponent: shouldRenderComponent(gridItem, isEdit) ? gridItem.renderComponent : undefined,
      };
    })
    .filter(
      (gridItem) =>
        (gridItem?.schema && gridItem.schema.length > 0) ||
        (gridItem?.multiSchema && gridItem.multiSchema.length > 0) ||
        gridItem.renderComponent
    );
}
