import { computed, type ComputedRef } from 'vue';
import { getFieldKey } from '../utils/fieldKey';
import { isPlainObject, resolveFieldIdentity } from '../../../shared/core';
import type { Field } from '../types';

/** 单个字段拆解后的渲染分组 */
export interface GroupedField {
  /** 解析后的字段标识（`name` 优先于 `path`） */
  path: string;
  /** 除分组键外的其余字段配置，作为 BaseField 属性下发 */
  componentProps: Record<string, any>;
  /** 该字段的外层包裹容器 */
  fieldContainer?: any;
  /** 字段原始对象，供实例登记与访问器挂载使用 */
  rawField: Field;
  /** 渲染 key，取自字段对象身份 */
  renderKey: string | number;
}

/**
 * 将 fields 配置数组逐个拆分为字段属性与容器分组
 *
 * @description
 * 1. 解构剥离 `path` / `name` / `fieldContainer` / `fields` / `hidden` / `extraProps`，其余键作为字段属性下发；
 * 2. `extraProps` 保留在字段原始对象上供业务层存取，不落入字段属性；
 * 3. `hidden` 字段由调用方在上游过滤。
 *
 * @param validFields - 已过滤隐藏字段的字段配置数组
 * @returns 字段渲染分组数组
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
        renderKey: getFieldKey(field),
      };
    });
  });
}
