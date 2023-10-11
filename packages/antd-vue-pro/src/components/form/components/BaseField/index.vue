<!-- eslint-disable no-nested-ternary -->
<script lang="ts" setup>
import {
  computed,
  h,
  inject,
  isVNode,
  nextTick,
  onMounted,
  ref,
  useAttrs,
  watch,
} from 'vue';
import { get } from 'lodash-es';
import type { Field, BaseFieldAttrs, CommandTrigger } from '../../types';
import { ContainerFragment, SlotComponent } from '..';
import {
  COMPONENT_MAP,
  COMMAND,
  UPDATE_REFS,
  FORM_DATA,
  UPDATE_FORM_DATA,
  FORM_ITEM_SLOT_KEYS,
} from '../../constants';
import { useInitProps } from '../../hooks';

type Props = {
  component: Field['component'];
  path?: string;
  label?: Field['label'];
};

defineOptions({
  name: 'BaseField',
});

const props = withDefaults(defineProps<Props>(), {
  component: () => h('div', 'Missing required prop: "component"'),
  path: '',
  label: '',
  getFormItemRef: undefined,
});

const formData = inject(FORM_DATA);
const updateFormData = inject(UPDATE_FORM_DATA);
const updateRefs = inject(UPDATE_REFS);
const command = inject(COMMAND);
const { getInitProps } = useInitProps();

const value = computed({
  get() {
    return get(formData?.value, props.path);
  },
  set(val) {
    updateFormData?.(val, props.path);
  },
});

const forceUpdateKey = ref(0);

watch(value, (val: any, oldVal: any) => {
  if (val === undefined && oldVal) {
    forceUpdateKey.value += 1;
  }
});

const attrs: BaseFieldAttrs = useAttrs();

const componentType = computed(() =>
  typeof props.component === 'function' || isVNode(props.component)
    ? undefined
    : props.component
);

const rewriteMethod = (methodName: CommandTrigger) => {
  if (attrs.autoCommand && attrs.autoCommand?.[methodName]?.length > 0) {
    return {
      [methodName]: (...args: any) => {
        (attrs as any)[methodName]?.(...args);
        nextTick(() => {
          command?.value?.run(props.path, methodName);
        });
      },
    };
  }
  return {};
};

const mergedAttrs = computed(() => {
  const compType = componentType.value;
  const initProps = getInitProps({
    component: compType as any,
    type: attrs.type,
  });
  const methods = { ...rewriteMethod('onUpdateValue') };
  switch (compType) {
    case 'input':
      Object.assign(methods, rewriteMethod('onBlur'), rewriteMethod('onFocus'));
      break;
    case 'input-number':
      Object.assign(methods, rewriteMethod('onBlur'), rewriteMethod('onFocus'));
      break;
    default:
      break;
  }
  return { ...initProps, ...attrs, ...methods };
});

const is = computed(() => {
  return COMPONENT_MAP.get(props.component as any) ?? props.component;
});

const setComponentRef = (el: any) => {
  if (!el) return;
  updateRefs?.(props.path, el, 'fieldRefs');
};

onMounted(() => {
  if (attrs.autoCommand && attrs.autoCommand?.onInit?.length > 0) {
    command?.value?.run(props.path, 'onInit');
  }
});
</script>

<template>
  <ContainerFragment :component="attrs.componentContainer" :path="path">
    <component
      :is="is"
      :key="forceUpdateKey"
      v-bind="mergedAttrs"
      :ref="setComponentRef"
      v-model:value="value"
      :class="attrs.componentClassName"
      :style="attrs.componentStyle"
      :path="path"
      class="field-component">
      <template v-for="(slot, name) in $slots" :key="name" #[name]>
        <slot :name="name"></slot>
      </template>

      <template v-for="(slot, name) in attrs.slots" :key="name" #[name]>
        <SlotComponent
          v-if="!FORM_ITEM_SLOT_KEYS.includes(name)"
          v-bind="{ path }"
          :component="slot" />
      </template>
    </component>
  </ContainerFragment>
</template>

<style scoped lang="less">
.field-component {
  width: 100%;
  min-width: 400px;
}
</style>
