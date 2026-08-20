<script lang="ts" setup>
/**
 * @component BaseFormItem
 * @description 表单字段渲染引擎
 *
 * 负责将字段配置数组渲染为实际的表单项，支持：
 * - 字段分组（嵌套 fields 递归渲染）
 * - Field 包装（label、rules、校验等）
 * - 组件绑定（通过 BaseField 渲染具体组件，如 Popup 选择器等）
 * - 插槽透传（label 等 Field 插槽）
 *
 * ## 渲染流程
 *
 * 1. 遍历 fields 数组，过滤 hidden 字段
 * 2. 通过 useGroupFieldAttrs Hook 纯计算各字段属性与路径
 * 3. 递归渲染 BaseFormItem（嵌套表单）或 BaseField（输入组件）
 *
 * @param {Fields<D>} [fields] - 字段配置数组
 *
 * @internal
 */
import { computed, toValue } from 'vue';
import type { Fields } from '../../types';
import { BaseField, ContainerFragment } from '..';
import { useGroupFieldAttrs } from '../../hooks/useGroupFieldAttrs';

defineOptions({ name: 'BaseFormItem', inheritAttrs: false });

type Props = {
  fields?: Fields;
};

const props = defineProps<Props>();

const validFields = computed(() => {
  const f = toValue(props.fields);
  if (!Array.isArray(f)) return [];
  return f.filter(field => !toValue(field.hidden));
});

const groupedFields = useGroupFieldAttrs(validFields);
</script>

<template>
  <template v-for="(item, index) in groupedFields" :key="item.path || index">
    <template v-if="item.rawField.fields">
      <ContainerFragment
        :component="item.fieldContainer"
        :path="item.path"
        v-bind="item.componentProps"
      >
        <BaseFormItem :fields="item.rawField.fields" />
      </ContainerFragment>
    </template>
    <template v-else>
      <BaseField v-bind="item.componentProps" :path="item.path" />
    </template>
  </template>
</template>
