<script lang="ts" setup>
/**
 * @component BaseFormItem
 * @description 表单字段渲染引擎
 *
 * ## 渲染流程
 *
 * 1. 遍历 fields 数组，过滤 hidden 字段
 * 2. 通过 useGroupFieldAttrs Hook 纯计算将 field 配置拆分为 gridItemProps / formItemProps / componentProps / slots
 * 3. 递归渲染 BaseFormItem（嵌套表单）或 BaseField（输入组件）
 * 4. 通过 ref 回调收集 FormItem 和 Component 实例，注入到 field 对象上
 */

import { getObject, toPath } from '../../../../shared/core';
import {
  FormItem,
  Grid as AGrid,
  GridItem as AGridItem,
  GridProps,
  useDisabledContextProvider,
} from '../../../../shared/ui';
import { computed, inject, toValue } from 'vue';
import type { Fields, Grid } from '../../types';
import { BaseField, SlotComponent, ContainerFragment } from '..';
import { useGroupFieldAttrs } from '../../hooks/useGroupFieldAttrs';
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

// 过滤掉 hidden 字段，隐藏字段不渲染
const validFields = computed(() => fields.filter?.(field => !field.hidden));

// 向子组件提供 disabled 上下文
useDisabledContextProvider(computed(() => disabled) as any);

const config = INJECT_CONFIG['pro-form'];

const { grid: injectGrid } = inject(config.injectionKey, config.default);

// 网格布局：优先使用当前层级的 grid 配置，否则使用注入的全局配置
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

// FormItem 挂载回调：将 FormItem 实例和计算属性注入到 field 对象上
// 外部可通过 field.getFormItemRef() 获取 FormItem 实例
const onFormItemMounted = (index: number, formItemProps?: any) => {
  const field = validFields.value[index];
  Object.assign(field, {
    getFormItemRef: () => formItemRefs[index],
    getFormItemComputedProps: () => formItemProps,
  });
};

// 组件挂载回调：将输入组件实例注入到 field 对象上
// 外部可通过 field.getComponentRef() 获取底层输入组件实例
const onComponentMounted = (index: number) => {
  const field = validFields.value[index];
  Object.assign(field, {
    getComponentRef: () => componentRefs[index]?.getComponentRef(),
    getComponentComputedProps: () =>
      componentRefs[index]?.getComponentComputedProps(),
  });
};

const groupedFields = useGroupFieldAttrs(validFields);
</script>

<template>
  <ContainerFragment
    :component="enableGrid ? AGrid : undefined"
    v-bind="computedGridProps"
  >
    <template v-for="(item, index) of groupedFields" :key="item.path || index">
      <ContainerFragment
        :component="enableGrid ? AGridItem : undefined"
        v-bind="item.gridItemProps"
      >
        <ContainerFragment :component="item.container" :path="item.path">
          <FormItem
            v-bind="item.formItemProps"
            :ref="el => (formItemRefs[index] = el)"
            :name="toPath(item.path)"
            :path="item.path"
            @vue:mounted="onFormItemMounted(index, item.formItemProps)"
          >
            <template
              v-for="(slot, name) in item.formItemSlots"
              :key="name"
              #[name]="scoped"
            >
              <SlotComponent
                :path="item.path"
                :component="slot"
                v-bind="scoped"
              />
            </template>
            <template v-if="item.rawField.fields">
              <BaseFormItem
                :grid="(item.rawField as any).grid ?? grid"
                :fields="item.rawField.fields"
                :disabled="toValue(item.rawField.disabled)"
              />
            </template>
            <template v-else>
              <BaseField
                :ref="el => (componentRefs[index] = el)"
                v-bind="item.componentProps"
                :path="item.path"
                @vue:mounted="onComponentMounted(index)"
              />
            </template>
          </FormItem>
        </ContainerFragment>
      </ContainerFragment>
    </template>
  </ContainerFragment>
</template>
