<script lang="ts" setup>
/**
 * 字段级渲染组件，负责将 field 配置渲染为实际的输入组件
 *
 * @component BaseField
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
 * 内置组件映射（componentMap: field → Field, picker → Picker ...）
 *   ↓ 未匹配
 * 原始 component 值（可能是字符串或 Vue 组件对象）
 * ```
 *
 * @param {string | Component} [component] - 组件名或组件对象
 * @param {string} [path] - 字段路径，用于绑定表单数据
 * @param {boolean} [disabled] - 表单/字段禁用状态
 *
 * @slot default - 默认插槽（透传给组件）
 */
import {
  type Component,
  computed,
  getCurrentInstance,
  inject,
  mergeProps,
  onBeforeUnmount,
  ref,
  Teleport,
  toValue,
  useAttrs,
} from 'vue';
import { cloneDeep } from '../../../../shared/core';
import type { Field as FieldType } from '../../types';
import ContainerFragment from '../ContainerFragment/index.vue';
import SlotComponent from '../SlotComponent/index.vue';
import { componentMap, InjectionFormSlotsKey } from '../../constants';
import {
  INJECT_COMPONENTS,
  getInjectConfig,
} from '../../../component-provider/constants';
import { useForm } from '../../hooks/useForm';
import { getInitProps, warnUnknownComponent } from './utils';
import { dispatchListeners } from '../../utils/listeners';
import { useLocale } from '../../../../locale';
import { Field as VanField } from '../../../../shared/ui';

const cloneDeepIfObject = (val: unknown) =>
  // 原始值直接传递，引用值克隆快照
  typeof val === 'object' && val !== null ? cloneDeep(val) : val;

defineOptions({ name: 'BaseField', inheritAttrs: false });

const uiFieldPropsKeys = Object.keys(VanField.props || {});

type Props = {
  /** 组件名或组件对象 */
  component?: string | Component;
  /** 字段路径，用于绑定表单数据 */
  path?: string;
};
const props = withDefaults(defineProps<Props>(), {
  component: undefined,
  path: '',
});

const { t } = useLocale();

const form = useForm(false);
/**
 * 全局默认配置：按组件名解析注入描述符；
 * 组件名仅取 setup 期初始值，运行期变更不切换 Provider 的默认值预设。
 */
const config = getInjectConfig(props.component);
const rawInjectComponentProps = inject(config.injectionKey, config.default);

const componentRef = ref<any>();
const fieldRef = ref<any>();

const attrs: any = useAttrs();

// 双向绑定：读取经 valueFormatter.get，写入经 valueFormatter（或 .set）转换后落 formData
const value = computed({
  get() {
    let val = form?.getFormData?.(props.path);
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
      const setter =
        typeof valueFormatter === 'function'
          ? valueFormatter
          : typeof valueFormatter.set === 'function'
            ? valueFormatter.set
            : undefined;
      if (setter) {
        newVal =
          setter.length > 1
            ? setter(newVal, cloneDeepIfObject(form?.getFormData?.(props.path)))
            : setter(newVal);
      }
    }
    form?.setFormData?.(props.path, newVal);
    /*
     * 字段配置/attrs 传入的 onUpdate:* 监听器与内部写值组合回放，参数为组件原始 emit 值
     * popup 字段在 confirm 提交时经此 setter 触发，滚动选择过程的中间值不会误触监听器
     */
    dispatchListeners(groupedAttrs.value.onUpdateValue, val);
  },
});

// 字段实例唯一标识：复用组件实例 uid，用于弹层开启时的字段归属匹配
const fieldUid = getCurrentInstance()!.uid;

const popupCloseEventName = computed(() => {
  let confirm = 'onConfirm';
  let cancel = 'onCancel';
  if (props.component === 'cascader') {
    confirm = 'onFinish';
    cancel = 'onClose';
  } else if (props.component === 'signature') {
    confirm = 'onSubmit';
    cancel = 'onClear';
  }
  return { confirm, cancel };
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
    const customMap = toValue(customComponents) as any;
    const resolved =
      customMap?.[props.component] || (componentMap as any)[props.component];
    if (resolved) return resolved;
    warnUnknownComponent(props.component);
    return props.component;
  }
  return props.component;
});

/*
 * 原生元素回退（未注册的字符串 component，如 'input'）没有 props 声明面，
 * 按 DOM 属性名放行 Field 层同名键；字段层专有键（label/rules 等）仍从控件绑定中剔除
 */
const nativeElementAttrKeys = [
  'type',
  'name',
  'id',
  'value',
  'placeholder',
  'disabled',
  'readonly',
  'maxlength',
  'min',
  'max',
  'size',
  'title',
  'required',
  'autocomplete',
  'autocapitalize',
  'autocorrect',
  'inputmode',
  'spellcheck',
  'enterkeyhint',
  'autofocus',
  'rows',
];

/*
 * 内层控件声明的 props 键：对象式与数组式声明均取声明面；
 * 字符串目标（原生元素、未注册组件）按 DOM 属性名放行
 */
const getControlPropsKeys = (component: unknown): string[] => {
  if (typeof component === 'string') return nativeElementAttrKeys;
  const declaredProps = (component as { props?: unknown } | undefined)?.props;
  if (Array.isArray(declaredProps)) return declaredProps as string[];
  return Object.keys((declaredProps as Record<string, unknown>) || {});
};

/*
 * 将注入的默认 props、外部传入的 attrs、field 配置合并为最终属性
 * 属性分为多类：组件绑定属性、Field UI 属性等
 */
const groupedAttrs = computed(() => {
  const currentInjectProps = toValue(rawInjectComponentProps) || {};
  const initProps = getInitProps(
    {
      component: props.component,
      type: attrs.type,
    } as unknown as FieldType,
    currentInjectProps,
    t
  );
  // modelProp 取值：字段属性 > Provider 注入 > 默认 modelValue
  const modelPropName = attrs.modelProp ?? initProps.modelProp ?? 'modelValue';
  // 禁用取值：字段/表单下发的 attrs 优先，未提供时取 Provider 注入默认值
  const effectiveDisabled =
    attrs.disabled !== undefined
      ? Boolean(attrs.disabled)
      : Boolean(initProps.disabled);
  const mergedProps = mergeProps(
    initProps,
    attrs,
    { disabled: effectiveDisabled },
    { class: attrs.componentClass, style: attrs.componentStyle },
    { modelProp: modelPropName }
  ) as Required<FieldType>;

  // prettier-ignore
  const { valueFormatter, displayFormatter, modelProp, slots, fieldClass, fieldStyle, componentClass, componentStyle, componentContainer, popup, [modelPropName]: _modelVal, [`onUpdate:${modelPropName}`]: onUpdateValue, ...bindAttrs } = mergedProps as Record<string, any>;
  /*
   * 弹层提交语义：confirm 事件把 popupFieldValue 经 value setter 写入 formData 后关闭弹层
   * cancel 直接关闭不写值；confirm/cancel 事件名按组件映射并合并字段/attrs 上的同名监听器
   */
  if (popup) {
    const {
      [popupCloseEventName.value.confirm]: confirmEvent,
      [popupCloseEventName.value.cancel]: cancelEvent,
    } = bindAttrs as any;
    Object.assign(bindAttrs, {
      [popupCloseEventName.value.confirm]: (...args: any[]) => {
        // Signature 无 v-model，签名图经 submit 事件载荷传出；其余组件取弹层当前值
        const submitPayload = args[0];
        const nextValue =
          props.component === 'signature' && submitPayload?.image !== undefined
            ? submitPayload.image
            : form?.formPopup?.popupFieldValue?.value;
        value.value = nextValue;
        form?.formPopup?.close();
        dispatchListeners(confirmEvent, ...args);
      },
      [popupCloseEventName.value.cancel]: (...args: any[]) => {
        form?.formPopup?.close();
        dispatchListeners(cancelEvent, ...args);
      },
    });
  }

  const fieldAttrs = Object.keys(bindAttrs).reduce(
    (acc, key) => {
      // 事件仅绑内层组件（经 bindAttrs），不进外层 VanField；冒泡类事件不会在外层重复触发
      if (uiFieldPropsKeys.includes(key) && key !== 'type' && key !== 'name') {
        acc[key] = (bindAttrs as any)[key];
      }
      return acc;
    },
    { class: fieldClass, style: fieldStyle } as Record<string, any>
  );

  /*
   * Field 层专有键由 fieldAttrs 下发外层 Field；内层控件同样声明为 props 的键留在控件绑定中，
   * 内层控件未声明的 Field 层键从 bindAttrs 剔除，不参与控件绑定
   */
  const controlPropsKeys = getControlPropsKeys(is.value);
  Object.keys(bindAttrs).forEach(key => {
    if (uiFieldPropsKeys.includes(key) && !controlPropsKeys.includes(key)) {
      delete bindAttrs[key];
    }
  });

  return {
    attrs: bindAttrs,
    fieldAttrs,
    slots,
    componentContainer,
    modelProp,
    valueFormatter,
    displayFormatter,
    popup,
    onUpdateValue,
  };
});

// popup 字段的弹层可用性与挂载容器
const popupAble = computed(() => !!groupedAttrs.value.popup);
const popupContainer = computed(() =>
  typeof groupedAttrs.value.popup === 'boolean'
    ? undefined
    : groupedAttrs.value.popup?.container
);

// 展示文本：应用 displayFormatter 后的字段值
const displayValue = computed(() => {
  const { displayFormatter } = groupedAttrs.value;
  if (displayFormatter && typeof displayFormatter === 'function') {
    return displayFormatter(value.value);
  }
  return value.value;
});

const onFieldClick = () => {
  const { disabled, readonly } = groupedAttrs.value.fieldAttrs as any;
  if (!popupAble.value || disabled || readonly) return;

  const popupProps =
    typeof groupedAttrs.value.popup === 'object'
      ? groupedAttrs.value.popup
      : {};
  // 弹层初值与内联分支同为控件侧取值（已应用 valueFormatter.get）
  form?.formPopup?.open(props.path, value.value, popupProps, fieldUid);
};

// 字段被隐藏或删除导致组件卸载时，关闭其自身开启的弹层
onBeforeUnmount(() => {
  const popup = form?.formPopup;
  if (popup?.activeFieldId?.value === fieldUid) {
    popup.close();
  }
});

const teleportTarget = computed(() => {
  return form?.formPopup?.teleportTo?.value || '#pro-form-popup-content';
});

defineExpose({
  getComponentRef: () => componentRef.value || fieldRef.value,
  getComponentComputedProps: () => groupedAttrs.value.attrs as any,
});
</script>

<template>
  <ContainerFragment
    :component="groupedAttrs.componentContainer"
    :path="props.path"
  >
    <template v-if="popupAble">
      <!-- name 使 vant Form 能按 name 寻址到本字段 -->
      <VanField
        ref="fieldRef"
        v-bind="{
          readonly: true,
          clickable: true,
          isLink: true,
          ...groupedAttrs.fieldAttrs,
        }"
        :model-value="displayValue"
        :name="props.path"
        @click="onFieldClick"
      />
      <ContainerFragment
        v-if="
          form?.formPopup?.popupFieldPath?.value === props.path &&
          form?.formPopup?.activeFieldId?.value === fieldUid
        "
        :component="Teleport"
        :to="teleportTarget"
        defer
      >
        <ContainerFragment :component="popupContainer" :path="props.path">
          <component
            :is="is"
            v-if="is"
            v-bind="groupedAttrs.attrs"
            v-model:[`${groupedAttrs.modelProp}`]="
              form.formPopup.popupFieldValue.value
            "
          >
            <template
              v-for="(slot, name) in groupedAttrs.slots"
              :key="name"
              #[name]="scoped"
            >
              <SlotComponent
                :path="props.path"
                v-bind="scoped"
                :component="slot"
              />
            </template>
          </component>
        </ContainerFragment>
      </ContainerFragment>
    </template>

    <template v-else-if="typeof props.component === 'string'">
      <component
        :is="is"
        v-if="props.component === 'field'"
        v-bind="groupedAttrs.attrs"
        ref="componentRef"
        v-model:[`${groupedAttrs.modelProp}`]="value"
        :class="groupedAttrs.fieldAttrs.class"
        :style="groupedAttrs.fieldAttrs.style"
        :name="props.path"
      >
        <template
          v-for="(slot, name) in groupedAttrs.slots"
          :key="name"
          #[name]="scoped"
        >
          <SlotComponent :path="props.path" v-bind="scoped" :component="slot" />
        </template>
      </component>

      <VanField
        v-else
        ref="fieldRef"
        v-bind="groupedAttrs.fieldAttrs"
        :model-value="displayValue"
        :name="props.path"
      >
        <template #input>
          <component
            :is="is"
            v-if="is"
            v-bind="groupedAttrs.attrs"
            ref="componentRef"
            v-model:[`${groupedAttrs.modelProp}`]="value"
          >
            <template
              v-for="(slot, name) in groupedAttrs.slots"
              :key="name"
              #[name]="scoped"
            >
              <SlotComponent
                :path="props.path"
                v-bind="scoped"
                :component="slot"
              />
            </template>
          </component>
        </template>
      </VanField>
    </template>

    <template v-else>
      <component
        :is="is"
        v-if="is"
        v-bind="groupedAttrs.attrs"
        ref="componentRef"
        v-model:[`${groupedAttrs.modelProp}`]="value"
      >
        <template
          v-for="(slot, name) in groupedAttrs.slots"
          :key="name"
          #[name]="scoped"
        >
          <SlotComponent :path="props.path" v-bind="scoped" :component="slot" />
        </template>
      </component>
    </template>
  </ContainerFragment>
</template>
