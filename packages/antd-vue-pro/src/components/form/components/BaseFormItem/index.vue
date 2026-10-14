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
 * 2. 将字段属性分流为 GridItem / FormItem / 组件 / 插槽四类
 * 3. 递归渲染 BaseFormItem（嵌套表单）或 BaseField（输入组件）
 * 4. 渲染后字段对象上可读取 FormItem 与组件实例
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
  useProviderDisabled,
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

const validFields = computed(() =>
  // hidden 支持 Ref / ComputedRef 响应式形态（统一使用 toValue 取值）
  (props.fields ?? []).filter(
    field => isObjectItem(field) && !toValue((field as any).hidden)
  )
);

// 向下注入表单级禁用上下文，BaseField 经 useInjectDisabled 消费
useProviderDisabled(computed(() => props.disabled));

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

/*
 * 字段值变更经 BaseField 的 field-value-change 事件回传，由 FormItem 暴露的 onFieldChange 触发校验；
 * autoLink 为 false 时保持用户自行校验的语义
 */
const onFieldValueChange = (item: any) => {
  if (item.formItemProps?.autoLink === false) return;
  const instance = formItemInstanceMap.get(toRaw(item.rawField));
  instance?.onFieldChange?.();
};

const setFormItemRef = (field: any, el: any, formItemProps?: any) => {
  if (!field || typeof field !== 'object') return;
  const raw = toRaw(field);
  if (el) {
    formItemInstanceMap.set(raw, el);
    defineFieldAccessors(raw, {
      getFormItemRef: () => formItemInstanceMap.get(raw),
      getFormItemComputedProps: () => formItemProps,
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
            :ref="el => setFormItemRef(item.rawField, el, item.formItemProps)"
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
                v-bind="scoped"
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
                :ref="el => setComponentRef(item.rawField, el)"
                v-bind="item.componentProps"
                :path="item.path"
                @field-value-change="onFieldValueChange(item)"
              />
            </template>
          </FormItem>
        </ContainerFragment>
      </ContainerFragment>
    </template>
  </ContainerFragment>
</template>
