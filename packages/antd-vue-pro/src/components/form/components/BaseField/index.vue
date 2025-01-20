<!-- eslint-disable no-nested-ternary -->
<script lang="ts" setup>
import { computed, h, inject, isVNode, ref, useAttrs } from 'vue';
import { get, omit } from 'lodash-es';
import { useInjectDisabled } from 'ant-design-vue/es/config-provider/DisabledContext';
import type { Field, BaseFieldAttrs } from '../../types';
import { ContainerFragment, SlotComponent } from '..';
import {
  COMPONENT_MAP,
  FORM_DATA,
  UPDATE_FORM_DATA,
  FORM_ITEM_SLOT_KEYS,
  UPDATE_ACTIVE_PATH,
} from '../../constants';
import { useInitProps } from '../../hooks';

defineOptions({
  name: 'BaseField',
});

type Props = {
  component?: Field['component'];
  path?: string;
};

const props = withDefaults(defineProps<Props>(), {
  component: () => h('div', 'Missing required prop: "component"'),
  path: '',
});

type Emits = {
  setComponentRef: [el: any];
  fieldChange: [];
  fieldBlur: [];
};
const emit = defineEmits<Emits>();

const formData = inject(FORM_DATA);
const updateFormData = inject(UPDATE_FORM_DATA);
const updateActivePath = inject(UPDATE_ACTIVE_PATH);
const { getInitProps } = useInitProps();

const componentRef = ref<any>();
const componentMounted = () => {
  emit('setComponentRef', componentRef.value);
};

const triggerFormItemChange = () => {
  if (typeof props.component === 'string' && COMPONENT_MAP.has(props.component))
    return;
  emit('fieldChange');
};

const value = computed({
  get() {
    return get(formData?.value, props.path);
  },
  set(val) {
    // eslint-disable-next-line no-use-before-define
    const { valueFormatter } = mergedAttrs.value as any;
    if (valueFormatter && typeof valueFormatter === 'function') {
      updateFormData?.(props.path, valueFormatter(val));
      return;
    }
    updateFormData?.(props.path, val);
    triggerFormItemChange();
  },
});

const attrs: BaseFieldAttrs = useAttrs();

const componentType = computed(() =>
  typeof props.component === 'function' || isVNode(props.component)
    ? undefined
    : props.component
);

const modelName = computed(() => {
  if (componentType.value === 'switch') {
    return 'checked';
  }
  return 'value';
});

const parentDisabled = useInjectDisabled();

const mergedAttrs = computed(() => {
  const compType = componentType.value;
  const initProps = getInitProps({
    component: compType as any,
    type: attrs.type,
  });
  return {
    ...initProps,
    ...attrs,
    onFocus: undefined,
    disabled: attrs.disabled ?? parentDisabled.value ?? initProps.disabled,
    slots: undefined,
  };
});

const is = computed(() => {
  return COMPONENT_MAP.get(props.component as any) ?? props.component;
});

function handleFocus(...args: any) {
  updateActivePath?.(props.path);
  (attrs as any).onFocus?.(...args);
}
</script>

<template>
  <ContainerFragment :component="mergedAttrs.componentContainer" :path="path">
    <component
      :is="is"
      v-bind="omit(mergedAttrs, 'componentContainer')"
      ref="componentRef"
      v-model:[modelName]="value"
      :class="attrs.componentClassName"
      :style="attrs.componentStyle"
      :path="path"
      class="field-component"
      @vue:mounted="componentMounted"
      @focus="handleFocus">
      <template
        v-for="(slot, name) in attrs.slots"
        :key="name"
        #[name]="scoped">
        <SlotComponent
          v-if="!FORM_ITEM_SLOT_KEYS.includes(name as any)"
          :path="path"
          v-bind="scoped"
          :component="slot" />
      </template>
    </component>
  </ContainerFragment>
</template>

<style scoped lang="less">
.field-component:not(.ant-switch) {
  width: 100%;
  min-width: 120px;
}
</style>
