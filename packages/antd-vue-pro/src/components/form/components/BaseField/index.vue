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
import { useInjectDisabled } from 'ant-design-vue/es/config-provider/DisabledContext';
import type { Field, BaseFieldAttrs, CommandTrigger } from '../../types';
import { ContainerFragment, SlotComponent } from '..';
import {
  COMPONENT_MAP,
  COMMAND,
  UPDATE_REFS,
  FORM_DATA,
  UPDATE_FORM_DATA,
  FORM_ITEM_SLOT_KEYS,
  UPDATE_ACTIVE_PATH,
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
const updateActivePath = inject(UPDATE_ACTIVE_PATH);
const { getInitProps } = useInitProps();

const value = computed({
  get() {
    return get(formData?.value, props.path);
  },
  set(val) {
    updateFormData?.(props.path, val);
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
  return {
    ...initProps,
    ...attrs,
    ...methods,
    onFocus: undefined,
    disabled: attrs.disabled ?? parentDisabled.value ?? initProps.disabled,
  };
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

function handleFocus(...args: any) {
  updateActivePath?.(props.path);
  (mergedAttrs.value.onFocus as any)?.(...args);
}
</script>

<template>
  <ContainerFragment :component="attrs.componentContainer" :path="path">
    <component
      :is="is"
      :key="forceUpdateKey"
      v-bind="mergedAttrs"
      :ref="setComponentRef"
      v-model:[modelName]="value"
      :class="attrs.componentClassName"
      :style="attrs.componentStyle"
      :path="path"
      class="field-component"
      @focus="handleFocus">
      <template
        v-for="(slot, name) in attrs.slots"
        :key="name"
        #[name]="scoped">
        <SlotComponent
          v-if="!FORM_ITEM_SLOT_KEYS.includes(name)"
          :path="path"
          v-bind="scoped"
          :component="slot" />
      </template>
    </component>
  </ContainerFragment>
</template>

<style scoped lang="less">
.field-component {
  width: 100%;
  min-width: 120px;
}
</style>
