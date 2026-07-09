<script lang="ts" setup>
/**
 * @component GroupedFieldAttrs
 * @description 字段属性分组器，将 field 配置对象拆分为三类属性
 *
 * ## 属性分发逻辑
 *
 * 单个 field 对象包含多种属性，需要分发到不同的渲染目标：
 *
 * 1. **gridItemProps** — 网格布局属性（span、xs、sm、md、lg、xl、xxl 等），传递给 GridItem
 * 2. **formItemProps** — 表单项属性（label、rules、required 等），传递给 FormItem
 * 3. **componentProps** — 组件属性（placeholder、allowClear 等），传递给输入组件
 * 4. **formItemSlots** — FormItem 的具名插槽（label、help、extra 等）
 *
 * 分组依据：
 * - 匹配 antd-vue GridItem 的 props key → gridItemProps
 * - 匹配 antd-vue FormItem 的 props key → formItemProps
 * - 其余所有属性 → componentProps
 * - 属于 FORM_ITEM_SLOT_KEYS 的插槽 → formItemSlots
 * - 其余插槽 → componentProps.slots
 */
import { computed, inject, mergeProps, toValue } from 'vue';
import {
  GridItemProps,
  FormItemProps,
  gridItemProps,
  formItemProps,
} from '../../../../shared/ui';
import { INJECT_CONFIG } from '../../../component-provider/constants';
import type { Base, Field } from '../../types';
import { FORM_ITEM_SLOT_KEYS } from '../../constants';
import { isPlainObject } from '../../../../shared/core';

const formItemPropKeys = Object.keys(formItemProps()).concat([
  'formItemContainer',
]);
const gridItemPropKeys = Object.keys(gridItemProps());

type Props = {
  field: Field;
};
const props = defineProps<Props>();

const config = INJECT_CONFIG['pro-form-item'];
const injectFormItemProps = inject(config.injectionKey, config.default);

type GroupedFieldAttrs = {
  gridItemProps: GridItemProps;
  formItemProps: FormItemProps & Pick<Base, 'formItemContainer'>;
  formItemSlots: Record<(typeof FORM_ITEM_SLOT_KEYS)[number], any>;
  componentProps: Record<string, any>;
};

// 将 field 配置按 key 分发到三类属性分组中
const groupedAttributes = computed<GroupedFieldAttrs>(() => {
  let gridItemProps: Record<string, any> = {};
  let formItemProps: Record<string, any> = {};
  const componentProps: Record<string, any> = { slots: {} };
  const formItemSlots: Record<string, any> = {};

  if (isPlainObject(props.field)) {
    // prettier-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path, name, fields, formItemClass, formItemStyle, hidden, span, getFormItemRef, getComponentRef, getFormItemComputedProps, getComponentComputedProps, slots = {}, formItemDataAttrs = {}, componentDataAttrs = {}, extraProps, ...rest } =
    props.field as any;
    const {
      class: injectClassName,
      style: injectStyle,
      span: injectSpan,
      xs,
      sm,
      md,
      lg,
      xl,
      xxl,
      ...injectRest
    } = injectFormItemProps;

    const initGridItemProps =
      span || span === 0
        ? { span }
        : { xs, sm, md, lg, xl, xxl, span: injectSpan };

    gridItemProps = fields ? { span: span ?? 24 } : initGridItemProps;
    formItemProps = mergeProps(
      injectRest,
      { class: injectClassName, style: injectStyle },
      { class: toValue(formItemClass), style: toValue(formItemStyle) },
      formItemDataAttrs
    );

    Object.keys(rest).forEach(k => {
      if (gridItemPropKeys.includes(k)) {
        gridItemProps[k] = rest[k];
      } else if (formItemPropKeys.includes(k)) {
        formItemProps[k as keyof FormItemProps] = rest[k];
      } else {
        componentProps[k] = rest[k];
      }
    });

    Object.assign(componentProps, componentDataAttrs);
    Object.keys(slots).forEach(k => {
      if (FORM_ITEM_SLOT_KEYS.includes(k as any)) {
        formItemSlots[k] = slots[k];
      } else {
        componentProps['slots'][k] = slots[k];
      }
    });
  }

  return { gridItemProps, formItemProps, componentProps, formItemSlots };
});
</script>

<template>
  <slot v-bind="groupedAttributes"></slot>
</template>
