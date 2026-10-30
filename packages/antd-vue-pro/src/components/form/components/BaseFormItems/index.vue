<script lang="ts" setup>
/**
 * 表单字段渲染引擎
 *
 * @component BaseFormItems
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
 * 2. 每个字段交由 BaseFormItem 拆分为 GridItem / FormItem / 组件 / 插槽并渲染
 * 3. 嵌套 fields 递归渲染下一层 BaseFormItems
 * 4. 渲染后字段对象上可读取 FormItem 与组件实例
 *
 * @param {Fields} [fields] - 字段配置数组
 * @param {boolean | GridProps} [grid] - 是否启用网格布局
 * @param {boolean} [disabled] - 是否禁用所有子字段
 *
 * @internal
 */
import {
  InjectionFormKey,
  getObject,
  isObjectItem,
} from '../../../../shared/core';
import type { GridProps } from '../../../../shared/ui';
import { Grid as AGrid, useProviderDisabled } from '../../../../shared/ui';
import { computed, inject, toRaw, toValue } from 'vue';
import type { Fields, Grid } from '../../types';
import BaseFormItem from '../BaseFormItem/index.vue';
import { getFieldDataKey } from '../../utils/fieldKey';
import { INJECT_CONFIG } from '../../../component-provider/constants';

defineOptions({ name: 'BaseFormItems', inheritAttrs: false });

type Props = {
  /** 是否启用网格布局 */
  grid?: Grid;
  /** 字段配置数组 */
  fields?: Fields;
  /** 是否禁用所有子字段 */
  disabled?: boolean;
};
const props = withDefaults(defineProps<Props>(), {
  grid: undefined,
  fields: () => [],
  disabled: undefined,
});

const validFields = computed(() =>
  // hidden 支持 Ref / ComputedRef 响应式形态（统一使用 toValue 取值）
  (props.fields ?? []).filter(
    field => isObjectItem(field) && !toValue((field as any).hidden)
  )
);

// 数组行按数据对象身份派生 key，字段配置重建后行实例保持复用
const injectedForm = inject(InjectionFormKey, undefined) as any;
const renderedFields = computed(() => {
  const rawFormData = injectedForm?.formData
    ? toRaw(injectedForm.formData)
    : undefined;
  const seen = new Map<string | number, number>();
  return validFields.value.map(field => {
    const baseKey = getFieldDataKey(field, rawFormData);
    const count = seen.get(baseKey) ?? 0;
    seen.set(baseKey, count + 1);
    return {
      field,
      key: count === 0 ? baseKey : `${String(baseKey)}#${count}`,
    };
  });
});

// 向下注入表单级禁用上下文，BaseField 经 useInjectDisabled 消费
useProviderDisabled(computed(() => props.disabled));

const config = INJECT_CONFIG['pro-form'];
const injectFormConfig = inject(config.injectionKey, config.default);
const injectGrid = computed(() => toValue(injectFormConfig)?.grid);

const enableGrid = computed(() => !!props.grid);

const computedGridProps = computed<GridProps>(() => {
  return enableGrid.value
    ? { ...getObject(injectGrid.value), ...getObject(props.grid) }
    : {};
});

/**
 * 以字段原始对象为 key 登记 FormItem / 控件实例，供 getFormItemRef / getComponentRef 读取；
 * 字段对象被回收后对应条目不再可读。
 */
const formItemInstanceMap = new WeakMap<object, any>();
const componentInstanceMap = new WeakMap<object, any>();

/** 已告警过的字段对象（不可写场景去重） */
const warnedFrozenFields = new WeakSet<object>();
const defineFieldAccessors = (
  raw: object,
  accessors: Record<string, () => any>
) => {
  try {
    for (const [key, getter] of Object.entries(accessors)) {
      // 访问器仅用于字段对象读取，不参与属性遍历与字段配置透传
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

const setFormItemRef = (field: any, el: any, getFormItemProps: () => any) => {
  if (!field || typeof field !== 'object') return;
  const raw = toRaw(field);
  if (el) {
    formItemInstanceMap.set(raw, el);
    defineFieldAccessors(raw, {
      getFormItemRef: () => formItemInstanceMap.get(raw),
      getFormItemComputedProps: getFormItemProps,
    });
  } else {
    formItemInstanceMap.delete(raw);
    delete raw.getFormItemRef;
    delete raw.getFormItemComputedProps;
  }
};

const setComponentRef = (field: any, el: any) => {
  if (!field || typeof field !== 'object') return;
  const raw = toRaw(field);
  if (el) {
    componentInstanceMap.set(raw, el);
    defineFieldAccessors(raw, {
      getComponentRef: () => componentInstanceMap.get(raw)?.getComponentRef(),
      getComponentComputedProps: () =>
        componentInstanceMap.get(raw)?.getComponentComputedProps(),
    });
  } else {
    componentInstanceMap.delete(raw);
    delete raw.getComponentRef;
    delete raw.getComponentComputedProps;
  }
};
</script>

<template>
  <AGrid v-if="enableGrid" v-bind="computedGridProps">
    <BaseFormItem
      v-for="item of renderedFields"
      :key="item.key"
      :field="item.field"
      :grid="props.grid"
      :disabled="props.disabled"
      :set-form-item-ref="setFormItemRef"
      :set-component-ref="setComponentRef"
    />
  </AGrid>
  <template v-else>
    <BaseFormItem
      v-for="item of renderedFields"
      :key="item.key"
      :field="item.field"
      :grid="props.grid"
      :disabled="props.disabled"
      :set-form-item-ref="setFormItemRef"
      :set-component-ref="setComponentRef"
    />
  </template>
</template>
