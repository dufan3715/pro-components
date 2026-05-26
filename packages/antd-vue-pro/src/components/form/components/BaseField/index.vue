<script lang="ts" setup>
/**
 * @component BaseField
 * @description @qin-ui/antd-vue-pro 字段组件渲染器（内部组件）
 *
 * 负责将字段配置中的 component 属性渲染为实际的 UI 组件，支持：
 * - 字符串组件名映射（如 'input' → Ant Design Vue 的 Input 组件）
 * - 直接传入组件对象（自定义组件）
 * - Teleport 组件替换（通过插槽以 path 命名提供组件）
 * - 值双向绑定（v-model 绑定到表单数据）
 * - 值格式化（valueFormatter 处理输入/输出值）
 * - 组件容器包装（componentContainer 包裹组件）
 * - 禁用状态继承（从父级 FormItem 继承）
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

  const bindAttrs = omit(rest, [modelProp, `onUpdate:${modelProp}`]);

  return {
    attrs: bindAttrs,
    slots,
    componentContainer,
    modelProp,
    valueFormatter,
  };
});

const teleportComponent = inject(
  `${TeleportComponentNamePrefix}${path}`,
  undefined
);

const customComponents = inject(INJECT_COMPONENTS, {});

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
