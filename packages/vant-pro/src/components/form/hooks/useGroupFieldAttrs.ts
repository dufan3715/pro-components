import { computed, toValue, type ComputedRef } from 'vue';
import { isPlainObject } from '../../../shared/core';
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { path, name, fieldContainer: fc, fields, hidden, extraProps, ...rest } = field as any;
        componentProps = rest;
        fieldContainer = fc;
      }

      const raw = (toValue((field as any)?.name) ??
        toValue((field as any)?.path)) as string | number[] | undefined;
      return {
        path: Array.isArray(raw) ? raw.join('.') : (raw as string) || '',
        componentProps,
        fieldContainer,
        rawField: field,
      };
    });
  });
}
