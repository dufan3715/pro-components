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
 * 2. useGroupFieldAttrs 将字段配置纯计算拆分为 gridItemProps / formItemProps / componentProps / slots
 * 3. 递归渲染 BaseFormItem（嵌套表单）或 BaseField（输入组件）
 * 4. 通过 ref 回调收集 FormItem 和 Component 实例，注入到 field 对象上
 *
 * @param {Fields<D>} [fields] - 字段配置数组
 * @param {boolean | GridProps} [grid] - 是否启用网格布局
 * @param {boolean} [disabled] - 是否禁用所有子字段
 *
 * @internal
 */

import { getObject, isObjectItem, toPath } from '../../../../shared/core';
import type { GridProps } from '../../../../shared/ui';
import {
  FormItem,
  Grid as AGrid,
  GridItem as AGridItem,
  useDisabledContext,
  useDisabledContextProvider,
} from '../../../../shared/ui';
import { computed, inject, toRaw, toValue } from 'vue';
import type { Fields, Grid } from '../../types';
import BaseField from '../BaseField/index.vue';
import SlotComponent from '../SlotComponent/index.vue';
import ContainerFragment from '../ContainerFragment/index.vue';
import { useGroupFieldAttrs } from '../../hooks/useGroupFieldAttrs';
import { INJECT_CONFIG } from '../../../component-provider/constants';

defineOptions({ name: 'BaseFormItem', inheritAttrs: false });

type Props = {
  grid?: Grid;
  fields?: Fields;
  disabled?: boolean;
};
const props = withDefaults(defineProps<Props>(), {
  grid: undefined,
  fields: () => [],
  disabled: undefined,
});

// 过滤掉 hidden 字段；hidden 支持 Ref/ComputedRef/getter 等响应式形态（统一使用 toValue 取值）
const validFields = computed(() =>
  (props.fields ?? []).filter(
    field => isObjectItem(field) && !toValue((field as any).hidden)
  )
);

// 向子组件提供 disabled 上下文（优先使用自身的 props.disabled，无显式指定时继承父级上下文）
const parentDisabled = useDisabledContext();
useDisabledContextProvider(
  computed(() => props.disabled ?? parentDisabled.value) as any
);

const config = INJECT_CONFIG['pro-form'];
const injectFormConfig = inject(config.injectionKey, config.default);
const injectGrid = computed(() => toValue(injectFormConfig)?.grid);

// 网格布局：优先使用当前层级的 grid 配置，否则使用注入的全局配置
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
const formItemRefMap = new WeakMap<object, any>();
const componentRefMap = new WeakMap<object, any>();

/** 已告警过的字段对象（不可写场景去重） */
const warnedFrozenFields = new WeakSet<object>();
const defineFieldAccessors = (
  raw: object,
  accessors: Record<string, () => any>
) => {
  try {
    for (const [key, getter] of Object.entries(accessors)) {
      // 不可枚举：不进入 Object.keys / spread，不随字段配置透传
      Object.defineProperty(raw, key, {
        value: getter,
        enumerable: false,
        configurable: true,
        writable: true,
      });
    }
  } catch {
    if (!warnedFrozenFields.has(raw)) {
      warnedFrozenFields.add(raw);
      console.warn(
        '[pro-components] 字段配置对象不可写（如被 Object.freeze），getFormItemRef / getComponentRef 等实例访问器挂载失败。'
      );
    }
  }
};

const setFormItemRef = (field: any, el: any, formItemProps: any) => {
  const raw = toRaw(field);
  if (!raw || typeof raw !== 'object') return;

  if (el) {
    formItemRefMap.set(raw, el);
    defineFieldAccessors(raw, {
      getFormItemRef: () => formItemRefMap.get(raw),
      getFormItemComputedProps: () => formItemProps,
    });
  } else {
    formItemRefMap.delete(raw);
    delete raw.getFormItemRef;
    delete raw.getFormItemComputedProps;
  }
};

const setComponentRef = (field: any, el: any) => {
  const raw = toRaw(field);
  if (!raw || typeof raw !== 'object') return;

  if (el) {
    componentRefMap.set(raw, el);
    defineFieldAccessors(raw, {
      getComponentRef: () => componentRefMap.get(raw)?.getComponentRef?.(),
      getComponentComputedProps: () =>
        componentRefMap.get(raw)?.getComponentComputedProps?.(),
    });
  } else {
    componentRefMap.delete(raw);
    delete raw.getComponentRef;
    delete raw.getComponentComputedProps;
  }
};

const groupedFields = useGroupFieldAttrs(validFields);
</script>

<template>
  <ContainerFragment
    :component="enableGrid ? AGrid : undefined"
    v-bind="computedGridProps"
  >
    <template v-for="item of groupedFields" :key="item.renderKey">
      <ContainerFragment
        :component="enableGrid ? AGridItem : undefined"
        v-bind="item.gridItemProps"
      >
        <ContainerFragment
          :component="item.formItemContainer"
          :path="item.path"
        >
          <FormItem
            v-bind="item.formItemProps"
            :ref="
              (el: any) => setFormItemRef(item.rawField, el, item.formItemProps)
            "
            :name="toPath(item.path)"
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
                v-bind="scoped as any"
              />
            </template>
            <template v-if="item.rawField.fields">
              <BaseFormItem
                :grid="(item.rawField as any).grid ?? props.grid"
                :fields="item.rawField.fields"
                :disabled="toValue(item.rawField.disabled)"
              />
            </template>
            <template v-else>
              <BaseField
                :ref="(el: any) => setComponentRef(item.rawField, el)"
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
