import {
  computed,
  inject,
  mergeProps,
  toValue,
  type ComputedRef,
  type MaybeRefOrGetter,
} from 'vue';
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

/** 单个字段的分组结果：栅格 / FormItem / 组件属性与插槽 */
export interface GroupedField {
  path: string;
  gridItemProps: GridItemProps;
  formItemProps: FormItemProps;
  formItemSlots: Record<(typeof FORM_ITEM_SLOT_KEYS)[number], any>;
  componentProps: Record<string, any>;
  container?: Base['formItemContainer'];
  rawField: Field;
}

/** 将单个字段配置拆分为 grid / formItem / component / slots 分组 */
const groupField = (
  field: Field,
  rawInjectProps: Record<string, any>
): GroupedField => {
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
      span || span === 0 ? { span } : { xs, sm, md, lg, xl, span: injectSpan };

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
    // 字段级容器优先，回退注入级配置
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
    };
  }

  return {
    path: resolveFieldIdentity(field, ELEMENT_FIELD_IDENTITY_KEYS),
    gridItemProps: gridItemProps as GridItemProps,
    formItemProps: formItemProps as any,
    formItemSlots,
    componentProps,
    rawField: field,
  };
};

/**
 * 将 fields 配置数组逐个拆分为 grid / formItem / component / slots 分组。
 *
 * @description
 * 1. 响应式集成 ProComponentProvider 的 `pro-form-item` 全局变量配置；
 * 2. 剥离 `extraProps`（用户自定义字段标识袋）：保留在字段原始对象上供业务层存取，渲染层经解构剥离，不落入 componentProps 透传。
 *
 * @param {ComputedRef<Field[]>} validFields - 已过滤的字段配置数组
 * @returns {ComputedRef<GroupedField[]>} 分组后的字段属性数组
 */
export function useGroupFieldAttrs(validFields: ComputedRef<Field[]>) {
  const config = INJECT_CONFIG['pro-form-item'];
  const injectFormItemProps = inject(config.injectionKey, config.default);

  return computed<GroupedField[]>(() => {
    const rawInjectProps = toValue(injectFormItemProps) || {};
    return validFields.value.map(field => groupField(field, rawInjectProps));
  });
}

/**
 * 将单个字段配置拆分为 grid / formItem / component / slots 分组
 *
 * @description 拆分规则与 `useGroupFieldAttrs` 一致，结果依赖该字段自身配置与 Provider 的 `pro-form-item` 默认值。
 *
 * @param {MaybeRefOrGetter<Field>} field - 待拆分的字段配置
 * @returns {ComputedRef<GroupedField>} 单字段渲染分组
 */
export function useGroupedField(field: MaybeRefOrGetter<Field>) {
  const config = INJECT_CONFIG['pro-form-item'];
  const injectFormItemProps = inject(config.injectionKey, config.default);

  return computed<GroupedField>(() =>
    groupField(toValue(field), toValue(injectFormItemProps) || {})
  );
}
