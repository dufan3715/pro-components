<script lang="ts" setup>
/**
 * @component BaseFormItem
 * @description 表单字段渲染引擎
 *
 * 负责将字段配置数组渲染为实际的表单项，支持：
 * - 字段分组（嵌套 fields 递归渲染）
 * - 网格布局（grid 属性控制）
 * - FormItem 包装（label、rules、校验等）
 * - 组件绑定（通过 BaseField 渲染具体组件）
 * - 插槽透传（label、extra、help 等 FormItem 插槽）
 *
 * ## 渲染流程
 *
 * 1. 遍历 fields 数组，过滤 hidden 字段
 * 2. 对每个字段：
 *    a. 通过 PathProvider 提供当前字段路径
 *    b. 通过 GroupedFieldAttrs 将 field 配置拆分为 gridItemProps / formItemProps / componentProps
 *    c. 如果字段有 `fields` 子字段 → 递归渲染 BaseFormItem（嵌套表单）
 *    d. 否则 → 渲染 BaseField（输入组件）
 * 3. 通过 ref 回调收集 FormItem 和 Component 实例，注入到 field 对象上
 *
 * @param {Fields<D>} [fields] - 字段配置数组
 * @param {boolean | GridProps} [grid] - 是否启用网格布局
 * @param {boolean} [disabled] - 是否禁用所有子字段
 *
 * @internal
 */
import { getObject, toPath } from '../../../../shared/core';
import {
  FormItem,
  Grid as AGrid,
  GridItem as AGridItem,
  GridProps,
  useProviderDisabled,
} from '../../../../shared/ui';
import { computed, inject, toValue } from 'vue';
import type { Fields, Grid } from '../../types';
import { BaseField, SlotComponent, ContainerFragment } from '..';
import PathProvider from '../PathProvider/index.vue';
import GroupedFieldAttrs from '../GroupedFieldAttrs/index.vue';
import { INJECT_CONFIG } from '../../../component-provider/constants';

defineOptions({ name: 'BaseFormItem', inheritAttrs: false });

type Props = {
  grid?: Grid;
  fields?: Fields;
  disabled?: boolean;
};
const {
  grid = undefined,
  fields = [],
  disabled = undefined,
} = defineProps<Props>();

const validFields = computed(() => fields.filter?.(field => !field.hidden));

useProviderDisabled(computed(() => disabled));

const config = INJECT_CONFIG['pro-form'];

const { grid: injectGrid } = inject(config.injectionKey, config.default);

const enableGrid = computed(() => {
  if (grid !== undefined) return !!grid;
  return !!injectGrid;
});

const computedGridProps = computed<GridProps>(() => {
  return enableGrid.value
    ? { ...getObject(injectGrid), ...getObject(grid) }
    : {};
});

const formItemRefs: any[] = [];
const componentRefs: any[] = [];

const onFormItemMounted = (index: number, formItemProps?: any) => {
  const field = validFields.value[index];
  Object.assign(field, {
    getFormItemRef: () => formItemRefs[index],
    getFormItemComputedProps: () => formItemProps,
  });
};

const onComponentMounted = (index: number) => {
  const field = validFields.value[index];
  Object.assign(field, {
    getComponentRef: () => componentRefs[index]?.getComponentRef(),
    getComponentComputedProps: () =>
      componentRefs[index]?.getComponentComputedProps(),
  });
};
</script>

<template>
  <ContainerFragment
    :component="enableGrid ? AGrid : undefined"
    v-bind="computedGridProps"
  >
    <PathProvider
      v-for="({ path: _path, name: _name, ...field }, index) of validFields"
      :key="toPath(toValue((_name ?? _path) as any)).join('.') || index"
      v-bind="{ path: (_name ?? _path) as any }"
    >
      <template #default="{ path }">
        <GroupedFieldAttrs :field="field">
          <template
            #default="{
              gridItemProps,
              formItemProps: { formItemContainer, ...formItemProps },
              componentProps,
              formItemSlots,
            }"
          >
            <ContainerFragment
              :component="enableGrid ? AGridItem : undefined"
              v-bind="gridItemProps"
            >
              <ContainerFragment :component="formItemContainer" :path="path">
                <FormItem
                  v-bind="formItemProps"
                  :ref="el => (formItemRefs[index] = el)"
                  :name="toPath(path)"
                  :path="path"
                  @vue:mounted="onFormItemMounted(index, formItemProps)"
                >
                  <template
                    v-for="(slot, name) in formItemSlots"
                    :key="name"
                    #[name]="scoped"
                  >
                    <SlotComponent
                      :path="path"
                      :component="slot"
                      v-bind="scoped"
                    />
                  </template>
                  <template v-if="field.fields">
                    <BaseFormItem
                      :grid="(field as any).grid ?? grid"
                      :fields="field.fields"
                      :disabled="toValue(field.disabled)"
                    />
                  </template>
                  <template v-else>
                    <BaseField
                      :ref="el => (componentRefs[index] = el)"
                      v-bind="componentProps"
                      :path="path"
                      @vue:mounted="onComponentMounted(index)"
                    />
                  </template>
                </FormItem>
              </ContainerFragment>
            </ContainerFragment>
          </template>
        </GroupedFieldAttrs>
      </template>
    </PathProvider>
  </ContainerFragment>
</template>
