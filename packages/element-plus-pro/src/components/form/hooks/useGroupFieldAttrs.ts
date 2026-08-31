import { computed, inject, mergeProps, toValue, type ComputedRef } from 'vue';
import {
  formItemProps,
  gridItemProps,
  type FormItemProps,
  type GridItemProps,
} from '../../../shared/ui';
import { isPlainObject } from '../../../shared/core';
import { INJECT_CONFIG } from '../../component-provider/constants';
import { FORM_ITEM_SLOT_KEYS } from '../constants';
import type { Base, Field } from '../types';

const formItemPropKeys = Object.keys(formItemProps()).filter(
  k => k !== 'disabled'
);
const gridItemPropKeys = Object.keys(gridItemProps());
// 模块级 Set：字段循环内 O(1) 命中，替代数组 includes 线性扫描
const gridItemPropKeySet = new Set<string>(gridItemPropKeys);
const formItemPropKeySet = new Set<string>(formItemPropKeys);
const formItemSlotKeySet = new Set<string>(FORM_ITEM_SLOT_KEYS);

export interface GroupedField {
  path: string;
  gridItemProps: GridItemProps;
  formItemProps: FormItemProps;
  formItemSlots: Record<(typeof FORM_ITEM_SLOT_KEYS)[number], any>;
  componentProps: Record<string, any>;
  container?: Base['formItemContainer'];
  rawField: Field;
}

/**
 * 将 fields 配置数组逐个拆分为 grid / formItem / component / slots 分组。
 */
export function useGroupFieldAttrs(validFields: ComputedRef<Field[]>) {
  const config = INJECT_CONFIG['pro-form-item'];
  const injectFormItemProps = inject(config.injectionKey, config.default);

  return computed<GroupedField[]>(() => {
    const rawInjectProps = toValue(injectFormItemProps) || {};
    return validFields.value.map(field => {
      let gridItemProps: Record<string, any> = {};
      let formItemProps: Record<string, any> = {};
      const componentProps: Record<string, any> = { slots: {} };
      const formItemSlots: Record<string, any> = {};

      if (isPlainObject(field)) {
        // prettier-ignore
        const { path, name, fields, formItemClass, formItemStyle, formItemContainer, hidden, span, getFormItemRef, getComponentRef, getFormItemComputedProps, getComponentComputedProps, slots = {}, formItemDataAttrs = {}, componentDataAttrs = {}, extraProps, ...rest } =
          field as any;

        // prettier-ignore
        const { class: injectClassName, style: injectStyle, span: injectSpan, formItemContainer: injectFormItemContainer, xs, sm, md, lg, xl, ...injectRest } = rawInjectProps;

        // 字段显式 span 优先，否则回退注入配置的响应式断点
        const initGridItemProps =
          span || span === 0
            ? { span }
            : { xs, sm, md, lg, xl, span: injectSpan };

        gridItemProps = fields ? { span: span ?? 24 } : initGridItemProps;
        formItemProps = mergeProps(
          injectRest as any,
          { class: injectClassName, style: injectStyle },
          { class: toValue(formItemClass), style: toValue(formItemStyle) },
          formItemDataAttrs
        );
        const container = formItemContainer ?? injectFormItemContainer;

        Object.keys(rest).forEach(k => {
          if (gridItemPropKeySet.has(k)) {
            gridItemProps[k] = rest[k];
          } else if (formItemPropKeySet.has(k)) {
            (formItemProps as any)[k] = rest[k];
          } else {
            componentProps[k] = rest[k];
          }
        });

        Object.assign(componentProps, componentDataAttrs);
        Object.keys(slots).forEach(k => {
          if (formItemSlotKeySet.has(k)) {
            formItemSlots[k] = slots[k];
          } else {
            componentProps.slots[k] = slots[k];
          }
        });

        const raw = (toValue(name) ?? toValue(path)) as
          | string
          | number[]
          | undefined;
        return {
          path: Array.isArray(raw) ? raw.join('.') : (raw as string) || '',
          gridItemProps: gridItemProps as GridItemProps,
          formItemProps: formItemProps as any,
          formItemSlots,
          componentProps,
          container,
          rawField: field,
        };
      }

      const raw =
        toValue((field as any)?.name) ?? toValue((field as any)?.path);
      return {
        path: Array.isArray(raw) ? raw.join('.') : (raw as string) || '',
        gridItemProps: gridItemProps as GridItemProps,
        formItemProps: formItemProps as any,
        formItemSlots,
        componentProps,
        rawField: field,
      };
    });
  });
}
