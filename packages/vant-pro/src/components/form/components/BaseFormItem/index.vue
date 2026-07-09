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
 * 2. 对每个字段：
 *    a. 通过 PathProvider 提供当前字段路径
 *    b. 通过 GroupedFieldAttrs 将 field 配置拆分
 *    c. 如果字段有 `fields` 子字段 → 递归渲染 BaseFormItem（嵌套表单）
 *    d. 否则 → 渲染 BaseField（输入组件）
 * 3. 通过 ref 回调收集 Field 实例，注入到 field 对象上
 *
 * @param {Fields<D>} [fields] - 字段配置数组
 *
 * @internal
 */
import { computed, toValue } from 'vue';
import { toPath } from '../../../../shared/core';
import type { Fields } from '../../types';
import {
  BaseField,
  ContainerFragment,
  GroupedFieldAttrs,
  PathProvider,
} from '..';

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
</script>

<template>
  <template
    v-for="(field, index) in validFields"
    :key="toPath(toValue(field.path || index)).join('.') || index"
  >
    <PathProvider :path="toValue(field.path) as any">
      <template #default="{ path }">
        <GroupedFieldAttrs :field="field">
          <template #default="{ componentProps }">
            <template v-if="field.fields">
              <ContainerFragment
                :component="field.fieldContainer"
                :path="path"
                v-bind="componentProps"
              >
                <BaseFormItem :fields="field.fields" />
              </ContainerFragment>
            </template>
            <template v-else>
              <BaseField v-bind="componentProps" :path="path" />
            </template>
          </template>
        </GroupedFieldAttrs>
      </template>
    </PathProvider>
  </template>
</template>
