import { computed, inject, mergeProps, toValue, type ComputedRef } from 'vue';
import { getFieldKey } from '../utils/fieldKey';
import {
  formItemProps,
  gridItemProps,
  type FormItemProps,
  type GridItemProps,
} from '../../../shared/ui';
import { isPlainObject, resolveFieldIdentity } from '../../../shared/core';
import { INJECT_CONFIG } from '../../component-provider/constants';
import { ELEMENT_FIELD_IDENTITY_KEYS, FORM_ITEM_SLOT_KEYS } from '../constants';
import type { Base, Field } from '../types';

const formItemPropKeys = Object.keys(formItemProps());
const gridItemPropKeys = Object.keys(gridItemProps());
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
  renderKey: string | number;
}

/**
 * 将 fields 配置数组逐个拆分为 grid / formItem / component / slots 分组。
 *
 * @description
 * 1. 响应式集成 ProComponentProvider 的 `pro-form-item` 全局变量配置；
 * 2. 剥离 `extraProps`（用户自定义字段标识袋）：保留在字段原始对象上供业务层存取，渲染层经解构剥离，不落入 componentProps 透传。
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
        const { path: _path, prop: _prop, fields, formItemClass, formItemStyle, formItemContainer, hidden, span, getFormItemRef, getComponentRef, getFormItemComputedProps, getComponentComputedProps, slots = {}, formItemDataAttrs = {}, componentDataAttrs = {}, extraProps, ...rest } =
          field as any;

        // prettier-ignore
        const { class: injectClassName, style: injectStyle, span: injectSpan, formItemContainer: injectFormItemContainer, xs, sm, md, lg, xl, ...injectRest } = rawInjectProps;

        /*
         * 字段显式指定 span 时整体接管栅格，不再叠加注入的响应式断点；
         * 未指定 span 时使用注入的断点配置
         */
        const initGridItemProps =
          span || span === 0
            ? { span }
            : { xs, sm, md, lg, xl, span: injectSpan };

        // 分组字段未指定 span 时整行渲染（span 兜底 24），注入的响应式断点保持生效
        gridItemProps = fields
          ? { ...initGridItemProps, span: span ?? 24 }
          : initGridItemProps;
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

        // 字段标识经统一解析（prop 优先，path 兜底）；name 作为控件自身属性经 rest 透传
        return {
          path: resolveFieldIdentity(field, ELEMENT_FIELD_IDENTITY_KEYS),
          gridItemProps: gridItemProps as GridItemProps,
          formItemProps: formItemProps as any,
          formItemSlots,
          componentProps,
          container,
          rawField: field,
          renderKey: getFieldKey(field),
        };
      }

      return {
        path: resolveFieldIdentity(field, ELEMENT_FIELD_IDENTITY_KEYS),
        gridItemProps: gridItemProps as GridItemProps,
        formItemProps: formItemProps as any,
        formItemSlots,
        componentProps,
        rawField: field,
        renderKey: getFieldKey(field),
      };
    });
  });
}
