<script lang="ts" setup>
import {
  type Component,
  computed,
  inject,
  mergeProps,
  ref,
  Teleport,
  useAttrs,
} from 'vue';
import { cloneDeep, omit } from '../../../../shared/core';
import type { Field as FieldType } from '../../types';
import { ContainerFragment, SlotComponent } from '..';
import { componentMap, TeleportComponentNamePrefix } from '../../constants';
import { INJECT_COMPONENTS } from '../../../component-provider/constants';
import { useForm } from '../../hooks/useForm';
import { getInitProps } from './utils';
import { Field as VanField } from '../../../../shared/ui';

defineOptions({ name: 'BaseField', inheritAttrs: false });

const uiFieldPropsKeys = Object.keys(VanField.props || {});

type Props = {
  component?: string | Component;
  path?: string;
};
const { component = undefined, path = '' } = defineProps<Props>();

const form = useForm(false);
const { getFormData, setFormData, formPopup } = form;
const { popupFieldPath, popupFieldValue } = formPopup;

const componentRef = ref<any>();
const fieldRef = ref<any>();

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
  },
});

const popupCloseEventName = computed(() => {
  let confirm = 'onConfirm';
  let cancel = 'onCancel';
  if (component === 'cascader') {
    confirm = 'onFinish';
    cancel = 'onClose';
  } else if (component === 'signature') {
    confirm = 'onSubmit';
  }
  return { confirm, cancel };
});

/*
 * 将注入的默认 props、外部传入的 attrs、field 配置合并为最终属性
 * 属性分为多类：组件绑定属性、Field UI 属性等
 */
const groupedAttrs = computed(() => {
  const initProps = getInitProps({
    component: component,
    type: attrs.type,
  } as unknown as FieldType);
  const modelPropName = attrs.modelProp ?? initProps.modelProp ?? 'modelValue';
  const mergedProps = mergeProps(
    initProps,
    attrs,
    { disabled: attrs.disabled ?? initProps.disabled },
    { modelProp: modelPropName }
  ) as Required<FieldType>;

  // prettier-ignore
  const { valueFormatter, displayFormatter, modelProp, slots, fieldClass, fieldStyle, componentContainer, popup, ...rest } = mergedProps
  const modelBindingProp = modelProp ?? 'modelValue';
  // 从剩余属性中移除 v-model 绑定属性，避免重复绑定
  const bindAttrs = omit(rest as Record<string, any>, [
    modelBindingProp,
    `onUpdate:${modelBindingProp}`,
  ]);
  if (popup) {
    const {
      [popupCloseEventName.value.confirm]: confirmEvent,
      [popupCloseEventName.value.cancel]: cancelEvent,
    } = bindAttrs as any;
    Object.assign(bindAttrs, {
      [popupCloseEventName.value.confirm]: (...args: any[]) => {
        value.value = popupFieldValue.value;
        formPopup.close();
        confirmEvent?.(...args);
      },
      [popupCloseEventName.value.cancel]: (...args: any[]) => {
        formPopup.close();
        cancelEvent?.(...args);
      },
    });
  }

  const fieldAttrs = Object.keys(bindAttrs).reduce(
    (acc, key) => {
      if (
        (uiFieldPropsKeys.includes(key) || key.startsWith('on')) &&
        key !== 'type'
      ) {
        acc[key] = (bindAttrs as any)[key];
      }
      return acc;
    },
    { class: fieldClass, style: fieldStyle } as Record<string, any>
  );

  return {
    attrs: bindAttrs,
    fieldAttrs,
    slots,
    componentContainer,
    modelProp: modelBindingProp,
    valueFormatter,
    displayFormatter,
    popup,
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

// 处理 Popup 相关的逻辑
const popupAble = computed(() => !!groupedAttrs.value.popup);
const popupContainer = computed(() =>
  typeof groupedAttrs.value.popup === 'boolean'
    ? undefined
    : groupedAttrs.value.popup?.container
);

// 获取要展示在只读 Field 上的文字
const displayValue = computed(() => {
  const { displayFormatter } = groupedAttrs.value;
  if (displayFormatter && typeof displayFormatter === 'function') {
    return displayFormatter(value.value);
  }
  return value.value;
});

const onFieldClick = () => {
  const attrs = groupedAttrs.value.attrs as any;
  if (!popupAble.value || attrs.disabled || attrs.readonly) return;

  const popupProps =
    typeof groupedAttrs.value.popup === 'object'
      ? groupedAttrs.value.popup
      : {};
  formPopup.updateProps(popupProps);
  popupFieldValue.value = value.value;
  formPopup.open(path);
};

defineExpose({
  getComponentRef: () => componentRef.value || fieldRef.value,
  getComponentComputedProps: () => groupedAttrs.value.attrs as any,
});
</script>

<template>
  <ContainerFragment :component="groupedAttrs.componentContainer" :path="path">
    <template v-if="popupAble">
      <VanField
        ref="fieldRef"
        v-bind="{
          readonly: true,
          clickable: true,
          isLink: true,
          ...groupedAttrs.fieldAttrs,
        }"
        :model-value="displayValue"
        @click="onFieldClick"
      />
      <ContainerFragment
        v-if="popupFieldPath === path"
        :component="Teleport"
        to="#pro-form-popup-content"
        defer
      >
        <ContainerFragment :component="popupContainer" :path="path">
          <component
            :is="is"
            v-if="is"
            v-bind="groupedAttrs.attrs"
            v-model:[`${groupedAttrs.modelProp}`]="popupFieldValue"
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
      </ContainerFragment>
    </template>

    <template v-else-if="typeof component === 'string'">
      <component
        :is="is"
        v-if="component === 'field'"
        v-bind="groupedAttrs.attrs"
        ref="componentRef"
        v-model:[`${groupedAttrs.modelProp}`]="value"
        :name="path"
      >
        <template
          v-for="(slot, name) in groupedAttrs.slots"
          :key="name"
          #[name]="scoped"
        >
          <SlotComponent :path="path" v-bind="scoped" :component="slot" />
        </template>
      </component>

      <VanField
        v-else
        ref="fieldRef"
        v-bind="groupedAttrs.fieldAttrs"
        :name="path"
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
              <SlotComponent :path="path" v-bind="scoped" :component="slot" />
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
          <SlotComponent :path="path" v-bind="scoped" :component="slot" />
        </template>
      </component>
    </template>
  </ContainerFragment>
</template>
