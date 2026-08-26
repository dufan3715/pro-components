<script lang="ts" setup>
/**
 * @component BaseFormItem
 * @description 表单字段渲染引擎
 *
 * 负责将字段配置数组渲染为实际的表单项，支持：
 * - 字段分组（嵌套 fields 递归渲染，嵌套字段 path 须为完整点分路径）
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
 *
 * @internal
 */
import { getObject, normalizePathKey } from '../../../../shared/core';
import {
  FormItem,
  Grid as ElGrid,
  GridItem as ElGridItem,
  GridProps,
} from '../../../../shared/ui';
import { computed, inject, toRaw, toValue } from 'vue';
import type { Fields, Grid } from '../../types';
import { BaseField, SlotComponent, ContainerFragment } from '..';
import { useGroupFieldAttrs } from '../../hooks/useGroupFieldAttrs';
import { INJECT_CONFIG } from '../../../component-provider/constants';

defineOptions({ name: 'BaseFormItem', inheritAttrs: false });

type Props = {
  grid?: Grid;
  fields?: Fields;
};
const props = withDefaults(defineProps<Props>(), {
  grid: undefined,
  fields: () => [],
});

const validFields = computed(() =>
  (props.fields ?? []).filter(field => !field.hidden)
);

const config = INJECT_CONFIG['pro-form'];
const injectFormConfig = inject(config.injectionKey, config.default);
const injectGrid = computed(() => toValue(injectFormConfig)?.grid);

const enableGrid = computed(() => {
  if (props.grid !== undefined) return !!props.grid;
  return !!injectGrid.value;
});

const computedGridProps = computed<GridProps>(() => {
  return enableGrid.value
    ? { ...getObject(injectGrid.value), ...getObject(props.grid) }
    : {};
});

/**
 * 以字段原始对象为 key 登记 FormItem / 控件实例，供 getFormItemRef / getComponentRef 读取；
 * WeakMap 不参与响应式追踪，条目随字段对象回收自动释放。
 */
const formItemInstanceMap = new WeakMap<object, any>();
const componentInstanceMap = new WeakMap<object, any>();

const setFormItemRef = (field: any, el: any, formItemProps?: any) => {
  if (!field || typeof field !== 'object') return;
  const raw = toRaw(field);
  if (el) {
    formItemInstanceMap.set(raw, el);
    raw.getFormItemRef = () => formItemInstanceMap.get(raw);
    raw.getFormItemComputedProps = () => formItemProps;
  } else {
    formItemInstanceMap.delete(raw);
  }
};

const setComponentRef = (field: any, el: any) => {
  if (!field || typeof field !== 'object') return;
  const raw = toRaw(field);
  if (el) {
    componentInstanceMap.set(raw, el);
    raw.getComponentRef = () =>
      componentInstanceMap.get(raw)?.getComponentRef();
    raw.getComponentComputedProps = () =>
      componentInstanceMap.get(raw)?.getComponentComputedProps();
  } else {
    componentInstanceMap.delete(raw);
  }
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
            :ref="el => setFormItemRef(item.rawField, el, item.formItemProps)"
            :prop="normalizePathKey(item.path)"
            :path="item.path"
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
                :grid="(item.rawField as any).grid ?? props.grid"
                :fields="item.rawField.fields"
              />
            </template>
            <template v-else>
              <BaseField
                :ref="el => setComponentRef(item.rawField, el)"
                v-bind="item.componentProps"
                :path="item.path"
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
