<script lang="ts" setup>
/**
 * @component BaseField
 * @description 字段级渲染组件，负责将 field 配置渲染为实际的输入组件
 *
 * ## 核心职责
 *
 * 1. **组件解析**：按优先级解析要渲染的组件（teleport 插槽 > 自定义组件 > 内置组件映射 > 原始值）
 * 2. **v-model 双向绑定**：通过 computed getter/setter 将组件值与 formData 的深层路径绑定
 * 3. **valueFormatter 处理**：支持 get/set 格式化函数，用于数据转换（如日期格式化）
 * 4. **属性合并**：将注入的默认 props、组件传入的 attrs 合并为最终属性
 *
 * ## 组件解析优先级
 *
 * ```
 * teleport 组件（ProForm 插槽注入）
 *   ↓ 未匹配
 * 自定义组件（ProComponentProvider 的 componentMap）
 *   ↓ 未匹配
 * 内置组件映射（componentMap: input → Input, select → Select ...）
 *   ↓ 未匹配
 * 原始 component 值（可能是字符串或 Vue 组件对象）
 * ```
 *
 * @param {string | Component} [component] - 组件名或组件对象
 * @param {string} [path] - 字段路径，用于绑定表单数据
 *
 * @slot default - 默认插槽（透传给组件）
 */
import {
  type Component,
  computed,
  inject,
  mergeProps,
  ref,
  useAttrs,
} from 'vue';
import { cloneDeep, omit } from '../../../../shared/core';
import {
  useInjectDisabled,
  useInjectFormItemContext,
} from '../../../../shared/ui';
import type { Field } from '../../types';
import { ContainerFragment, SlotComponent } from '..';
import { componentMap, TeleportComponentNamePrefix } from '../../constants';
import { INJECT_COMPONENTS } from '../../../component-provider/constants';
import { useForm } from '../../hooks/useForm';
import { getInitProps } from './utils';

defineOptions({ name: 'BaseField', inheritAttrs: false });

type Props = {
  component?: string | Component;
  path?: string;
};
const { component = undefined, path = '' } = defineProps<Props>();

const form = useForm(false);
const { getFormData, setFormData } = form;

const componentRef = ref<any>();

const formItemContext = useInjectFormItemContext();
const triggerFormItemChange = () => {
  formItemContext.onFieldChange();
};

const attrs: any = useAttrs();

function getOldValue() {
  return cloneDeep(getFormData?.(path));
}

// setter: 向 formData 写入值，支持 valueFormatter / valueFormatter.set 转换
const value = computed({
  get() {
    let val = getFormData?.(path);
    const { valueFormatter } = groupedAttrs.value;
    if (
      typeof valueFormatter === 'object' &&
      typeof valueFormatter.get === 'function'
    ) {
      val = valueFormatter.get(val);
    }
    return val;
  },
  set(val) {
    let newVal = val;
    const { valueFormatter } = groupedAttrs.value;
    if (valueFormatter) {
      if (typeof valueFormatter === 'function') {
        newVal = valueFormatter(val, getOldValue());
      } else if (typeof valueFormatter.set === 'function') {
        newVal = valueFormatter.set(val, getOldValue());
      }
    }
    setFormData?.(path, newVal);
    triggerFormItemChange();
  },
});

const parentDisabled = useInjectDisabled();

/*
 * 将注入的默认 props、外部传入的 attrs、field 配置合并为最终属性
 * 属性分为三类：绑定属性（v-model）、组件属性（传递给组件）、插槽（动态渲染）
 */
const groupedAttrs = computed(() => {
  const initProps = getInitProps({
    component: component,
    picker: attrs.picker,
  } as Field);
  const mergedProps = mergeProps(
    initProps,
    attrs,
    { class: attrs.componentClass, style: attrs.componentStyle },
    { class: initProps.componentClass, style: initProps.componentStyle },
    { disabled: attrs.disabled ?? parentDisabled.value ?? initProps.disabled },
    { modelProp: attrs.modelProp ?? initProps.modelProp ?? 'value' }
  ) as Required<Field>;

  // prettier-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { valueFormatter, modelProp, slots, componentClass, componentStyle, componentContainer, ...rest } = mergedProps

  // 从剩余属性中移除 v-model 绑定属性，避免重复绑定
  const bindAttrs = omit(rest, [modelProp, `onUpdate:${modelProp}`]);

  return {
    attrs: bindAttrs,
    slots,
    componentContainer,
    modelProp,
    valueFormatter,
  };
});

// 从 ProForm 插槽注入的 teleport 组件（优先级最高）
const teleportComponent = inject(
  `${TeleportComponentNamePrefix}${path}`,
  undefined
);

// 从 ProComponentProvider 注入的自定义组件映射
const customComponents = inject(INJECT_COMPONENTS, {});

/*
 * 按优先级解析最终要渲染的组件：
 * teleport 插槽 → 自定义组件映射 → 内置组件映射 → 原始 component 值
 */
const is = computed(() => {
  if (teleportComponent) return teleportComponent;
  if (typeof component === 'string') {
    return (
      (customComponents as any)[component] ||
      (componentMap as any)[component] ||
      component
    );
  }
  return component;
});

defineExpose({
  getComponentRef: () => componentRef.value,
  getComponentComputedProps: () => groupedAttrs.value.attrs as any,
});
</script>

<template>
  <ContainerFragment :component="groupedAttrs.componentContainer" :path="path">
    <component
      :is="is"
      v-if="is"
      v-bind="groupedAttrs.attrs"
      ref="componentRef"
      v-model:[`${groupedAttrs.modelProp}`]="value"
      :path="path"
    >
      <template
        v-for="(slot, name) in groupedAttrs.slots"
        :key="name"
        #[name]="scoped"
      >
        <SlotComponent :path="path" v-bind="scoped" :component="slot" />
      </template>
    </component>
  </ContainerFragment>
</template>
