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
import { FORM_ITEM_SLOT_KEYS } from '../constants';
import type { Base, Field } from '../types';

const formItemPropKeys = Object.keys(formItemProps()).concat([
  'formItemContainer',
]);
const gridItemPropKeys = Object.keys(gridItemProps());
const gridItemPropKeySet = new Set<string>(gridItemPropKeys);
const formItemPropKeySet = new Set<string>(formItemPropKeys);
const formItemSlotKeySet = new Set<string>(FORM_ITEM_SLOT_KEYS);

/** 单个字段拆解后的渲染分组 */
export interface GroupedField {
  /** 解析后的字段标识（`name` 优先于 `path`） */
  path: string;
  /** 透传给栅格容器（GridItem）的属性 */
  gridItemProps: GridItemProps;
  /** 透传给 FormItem 的属性 */
  formItemProps: FormItemProps;
  /** 归属 FormItem 的插槽 */
  formItemSlots: Record<(typeof FORM_ITEM_SLOT_KEYS)[number], any>;
  /** 透传给输入组件的属性（含组件插槽） */
  componentProps: Record<string, any>;
  /** 该字段的外层包裹容器 */
  formItemContainer?: Base['formItemContainer'];
  /** 字段原始对象，供实例登记与访问器挂载使用 */
  rawField: Field;
}

/** 将单个字段配置拆分为 grid / formItem / component / slots 分组 */
const groupField = (
  field: Field,
  rawInject: Record<string, any>
): GroupedField => {
  let gridItemProps: Record<string, any> = {};
  let formItemProps: Record<string, any> = {};
  const componentProps: Record<string, any> = { slots: {} };
  const formItemSlots: Record<string, any> = {};

  if (isPlainObject(field)) {
    // prettier-ignore
    const { path: _path, name: _name, fields, formItemClass, formItemStyle, hidden, span, getFormItemRef, getComponentRef, getFormItemComputedProps, getComponentComputedProps, slots = {}, formItemDataAttrs = {}, componentDataAttrs = {}, extraProps, formItemContainer, ...rest } =
      field as any;

    // prettier-ignore
    const { class: injectClassName, style: injectStyle, span: injectSpan, xs, sm, md, lg, xl, xxl, formItemContainer: injectFormItemContainer, ...injectRest } = rawInject;

    /*
     * 字段显式指定 span 时整体接管栅格，不再叠加注入的响应式断点；
     * 未指定 span 时使用注入的断点配置
     */
    const initGridItemProps =
      span || span === 0
        ? { span }
        : { xs, sm, md, lg, xl, xxl, span: injectSpan };

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

    return {
      path: resolveFieldIdentity(field),
      gridItemProps: gridItemProps as GridItemProps,
      formItemProps: formItemProps as any,
      formItemSlots,
      componentProps,
      formItemContainer: container,
      rawField: field,
    };
  }

  return {
    path: resolveFieldIdentity(field),
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
 * @param {ComputedRef<Field[]>} validFields - 已过滤隐藏字段的字段配置数组
 * @returns 字段渲染分组数组
 */
export function useGroupFieldAttrs(validFields: ComputedRef<Field[]>) {
  const config = INJECT_CONFIG['pro-form-item'];
  const injectFormItemProps = inject(config.injectionKey, config.default);

  return computed<GroupedField[]>(() => {
    const rawInject = toValue(injectFormItemProps) || {};
    return validFields.value.map(field => groupField(field, rawInject));
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
