<script lang="ts" setup>
/**
 * @component GroupedFieldAttrs
 * @description 字段属性分组器，将 field 配置对象拆分为多类属性
 *
 * ## 属性分发逻辑
 *
 * 单个 field 对象包含多种属性，需要分发到不同的渲染目标：
 *
 * 1. **fieldAttrs** — 字段包装层属性（label、rules、required 等），传递给 VanField
 * 2. **componentProps** — 组件属性（placeholder、clearable 等），传递给内部组件
 * 3. **fieldSlots** — VanField 的具名插槽
 *
 * 分组依据：
 * - 匹配 vant Field 的 props key → fieldAttrs
 * - 其余所有属性 → componentProps
 * - 属于 FIELD_SLOT_KEYS 的插槽 → fieldSlots
 * - 其余插槽 → componentProps.slots
 */
import { computed } from 'vue';
import type { Field } from '../../types';
import { isPlainObject } from '../../../../shared/core';

type Props = {
  field: Field;
};
const props = defineProps<Props>();

type GroupedFieldAttrs = {
  componentProps: Record<string, any>;
};

// 将 field 配置按 key 分发到各属性分组中
const groupedAttributes = computed<GroupedFieldAttrs>(() => {
  let componentProps: Record<string, any> = {};

  if (isPlainObject(props.field)) {
    // prettier-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path, formItemContainer, fields, hidden, extraProps, ...rest } =
    props.field as any;
    componentProps = rest;
  }

  return { componentProps };
});
</script>

<template>
  <slot v-bind="groupedAttributes"></slot>
</template>
