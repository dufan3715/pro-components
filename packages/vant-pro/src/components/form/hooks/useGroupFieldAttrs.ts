import { computed, type ComputedRef } from 'vue';
import { isPlainObject, resolveFieldIdentity } from '../../../shared/core';
import type { Field } from '../types';

export interface GroupedField {
  path: string;
  componentProps: Record<string, any>;
  fieldContainer?: any;
  rawField: Field;
}

/**
 * 将 fields 配置数组拆分为 componentProps 等分组。
 */
export function useGroupFieldAttrs(validFields: ComputedRef<Field[]>) {
  return computed<GroupedField[]>(() => {
    return validFields.value.map(field => {
      let componentProps: Record<string, any> = {};
      let fieldContainer: any = undefined;

      if (isPlainObject(field)) {
        // prettier-ignore
        const { path: _path, name: _name, fieldContainer: fc, fields, hidden, extraProps, ...rest } = field as any;
        componentProps = rest;
        fieldContainer = fc;
      }

      const raw = resolveFieldIdentity(field);
      return {
        path: raw,
        componentProps,
        fieldContainer,
        rawField: field,
      };
    });
  });
}
