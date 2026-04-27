import { useMemo, useState } from 'react';
import type {
  Product,
  ProductCustomizationGroup,
  ProductOption
} from '../../../domain/products/product.types';
import type { SelectedOption } from '../../../domain/cart/cart.types';

const isOptionSelected = (groupId: string, optionId: string, selected: SelectedOption[]) =>
  selected.some((item) => item.groupId === groupId && item.optionId === optionId);

export const useCustomization = (product: Product) => {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [notes, setNotes] = useState('');

  const toggleOption = (group: ProductCustomizationGroup, option: ProductOption) => {
    const current = isOptionSelected(group.id, option.id, selectedOptions);

    if (group.type === 'single') {
      const filtered = selectedOptions.filter((item) => item.groupId !== group.id);
      if (!current) {
        filtered.push({
          groupId: group.id,
          optionId: option.id,
          label: option.label,
          priceDelta: option.priceDelta
        });
      }
      setSelectedOptions(filtered);
      return;
    }

    if (current) {
      setSelectedOptions(
        selectedOptions.filter(
          (item) => !(item.groupId === group.id && item.optionId === option.id)
        )
      );
      return;
    }

    const groupCount = selectedOptions.filter((item) => item.groupId === group.id).length;
    if (groupCount >= group.maxSelect) {
      return;
    }

    setSelectedOptions([
      ...selectedOptions,
      {
        groupId: group.id,
        optionId: option.id,
        label: option.label,
        priceDelta: option.priceDelta
      }
    ]);
  };

  const validationErrors = useMemo(() => {
    if (!product.customization.enabled) {
      return [];
    }

    const errors: string[] = [];

    for (const group of product.customization.groups) {
      const selectedCount = selectedOptions.filter((item) => item.groupId === group.id).length;

      if (group.required && selectedCount < group.minSelect) {
        errors.push(`Selecciona al menos ${group.minSelect} opcion(es) en ${group.label}.`);
      }

      if (selectedCount > group.maxSelect) {
        errors.push(`Solo puedes seleccionar hasta ${group.maxSelect} opcion(es) en ${group.label}.`);
      }
    }

    return errors;
  }, [product, selectedOptions]);

  return {
    selectedOptions,
    notes,
    setNotes,
    toggleOption,
    validationErrors
  };
};
