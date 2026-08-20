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
 * - 插槽透传（label、error 等 FormItem 插槽）
 *
 * ## 渲染流程
 *
 * 1. 遍历 fields 数组，过滤 hidden 字段
 * 2. 通过 useGroupFieldAttrs Hook 纯计算将 field 配置拆分为 gridItemProps / formItemProps / componentProps / slots
 * 3. 递归渲染 BaseFormItem（嵌套表单）或 BaseField（输入组件）
 * 4. 通过 ref 回调收集 FormItem 和 Component 实例，注入到 field 对象上
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
  Grid as ElGrid,
  GridItem as ElGridItem,
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

const validFields = computed(() => fields.filter?.(field => !field.hidden));

useDisabledContextProvider(computed(() => disabled) as any);

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

const groupedFields = useGroupFieldAttrs(validFields);
</script>

<template>
  <ContainerFragment
    :component="enableGrid ? ElGrid : undefined"
    v-bind="computedGridProps"
    style="width: 100%"
  >
    <template v-for="(item, index) of groupedFields" :key="item.path || index">
      <ContainerFragment
        :component="enableGrid ? ElGridItem : undefined"
        v-bind="item.gridItemProps"
      >
        <ContainerFragment :component="item.container" :path="item.path">
          <FormItem
            v-bind="item.formItemProps"
            :ref="el => (formItemRefs[index] = el)"
            :prop="toPath(item.path).join('.')"
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

<style scoped lang="less">
[class*='-form-item'] [class*='-form-item'] {
  margin-bottom: 18px;
}
</style>
