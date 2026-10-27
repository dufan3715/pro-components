<script lang="ts" setup>
/**
 * 字段级渲染组件
 *
 * @component BaseField
 * @description 负责将 field 配置渲染为实际的输入组件
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
  toValue,
} from 'vue';
import {
  cloneDeep,
  getObject,
  useReactiveAttrs,
} from '../../../../shared/core';
import { useDisabledContext } from '../../../../shared/ui';
import type { Field } from '../../types';
import ContainerFragment from '../ContainerFragment/index.vue';
import SlotComponent from '../SlotComponent/index.vue';
import { componentMap, InjectionFormSlotsKey } from '../../constants';
import {
  INJECT_COMPONENT_VARS,
  INJECT_COMPONENTS,
  getInjectConfig,
} from '../../../component-provider/constants';
import { useForm } from '../../hooks/useForm';
import { getInitProps, warnUnknownComponent } from './utils';
import { resolveEffectiveDisabled } from '../../utils/disabled';
import { useLocale } from '../../../../locale';

const cloneDeepIfObject = (val: unknown) =>
  // 原始值直接传递，引用值克隆快照
  typeof val === 'object' && val !== null ? cloneDeep(val) : val;

defineOptions({ name: 'BaseField', inheritAttrs: false });

type Props = {
  component?: string | Component;
  path?: string;
};
const props = withDefaults(defineProps<Props>(), {
  component: undefined,
  path: '',
});

const { t } = useLocale();

const form = useForm(false);

const componentRef = ref<any>();

const attrs: any = useReactiveAttrs();

/**
 * 全局默认配置注入：key = 组件名 + type 修饰段，inject 须在 setup 同步期调用。
 * 组件名与 `type` 仅取 setup 期初始值——运行期变更不会切换 Provider 的默认值预设
 * （`date-picker.month` 等子类型预设需在初始渲染前确定）。
 */
const typeVal = attrs.type;
const injectConfigKey =
  typeof props.component === 'string'
    ? [props.component, typeVal].filter(Boolean).join('.')
    : '';
const componentInjectConfig = injectConfigKey
  ? getInjectConfig(injectConfigKey)
  : undefined;
const rawInjectComponentProps = componentInjectConfig
  ? inject(componentInjectConfig.injectionKey, componentInjectConfig.default)
  : undefined;
// 全量 componentVars：运行期新增的自定义组件键由此兜底读取
const componentVars = inject(INJECT_COMPONENT_VARS, undefined);

// setter: 向 formData 写入值，支持 valueFormatter / valueFormatter.set 转换
const value = computed({
  get() {
    let val = form.getFormData?.(props.path);
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
    const setFormatter =
      typeof valueFormatter === 'function'
        ? valueFormatter
        : typeof valueFormatter === 'object' &&
            typeof valueFormatter?.set === 'function'
          ? valueFormatter.set
          : undefined;

    if (setFormatter) {
      // 仅当 set 转换函数需要旧值参数时，才获取旧值上下文
      const oldVal =
        setFormatter.length > 1
          ? cloneDeepIfObject(form.getFormData?.(props.path))
          : undefined;
      newVal = setFormatter(val, oldVal);
    }
    form.setFormData?.(props.path, newVal);
    // 字段配置/attrs 传入的 onUpdate:* 监听器与内部写值组合回放，参数为组件原始 emit 值
    const { onUpdateValue } = groupedAttrs.value;
    if (typeof onUpdateValue === 'function') {
      onUpdateValue(val);
    } else if (Array.isArray(onUpdateValue)) {
      onUpdateValue.forEach(listener => listener(val));
    }
  },
});

const parentDisabled = useDisabledContext();

/*
 * 将注入的默认 props、外部传入的 attrs、field 配置合并为最终属性
 * 属性分为三类：绑定属性（v-model）、组件属性（传递给组件）、插槽（动态渲染）
 */
const groupedAttrs = computed(() => {
  const currentInjectProps = {
    ...(toValue(rawInjectComponentProps) || {}),
    ...getObject(toValue(componentVars)?.[injectConfigKey]),
  };
  const initProps = getInitProps(
    {
      component: props.component,
      type: attrs.type,
    } as unknown as Field,
    currentInjectProps,
    t
  );
  const modelPropName = attrs.modelProp ?? initProps.modelProp ?? 'modelValue';
  const effectiveDisabled = resolveEffectiveDisabled(
    attrs.disabled,
    parentDisabled.value,
    initProps.disabled
  );
  const mergedProps = mergeProps(
    initProps,
    attrs,
    { class: attrs.componentClass, style: attrs.componentStyle },
    { disabled: effectiveDisabled },
    { modelProp: modelPropName }
  ) as Required<Field>;

  // prettier-ignore
  const { valueFormatter, modelProp, slots, componentClass, componentStyle, componentContainer, [modelPropName]: _modelVal, [`onUpdate:${modelPropName}`]: onUpdateValue, ...bindAttrs } = mergedProps as any;

  return {
    attrs: bindAttrs,
    slots,
    componentContainer,
    modelProp: modelPropName,
    valueFormatter,
    onUpdateValue,
  };
});

// 从 ProForm 插槽注入的 slots 集合（优先级最高）
const injectedFormSlots = inject(InjectionFormSlotsKey, undefined);

// 从 ProComponentProvider 注入的自定义组件映射
const customComponents = inject(INJECT_COMPONENTS, {});

/*
 * 按优先级解析最终要渲染的组件：
 * ProForm 插槽 → 自定义组件映射 → 内置组件映射 → 原始 component 值
 */
const is = computed(() => {
  const teleportSlot = props.path && injectedFormSlots?.value?.[props.path];
  if (teleportSlot) return teleportSlot;
  if (typeof props.component === 'string') {
    const resolved =
      toValue(customComponents as any)?.[props.component] ||
      (componentMap as any)[props.component];
    if (resolved) return resolved;
    warnUnknownComponent(props.component);
    return props.component;
  }
  return props.component;
});

defineExpose({
  getComponentRef: () => componentRef.value,
  getComponentComputedProps: () => groupedAttrs.value.attrs as any,
});
</script>

<template>
  <ContainerFragment
    :component="groupedAttrs.componentContainer"
    :path="props.path"
  >
    <component
      :is="is"
      v-if="is"
      v-bind="groupedAttrs.attrs"
      ref="componentRef"
      v-model:[`${groupedAttrs.modelProp}`]="value"
      :path="props.path"
    >
      <template
        v-for="(slot, name) in groupedAttrs.slots"
        :key="name"
        #[name]="scoped"
      >
        <SlotComponent :path="props.path" v-bind="scoped" :component="slot" />
      </template>
    </component>
  </ContainerFragment>
</template>
