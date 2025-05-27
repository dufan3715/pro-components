<script lang="ts" setup>
import { computed, isVNode, mergeProps, ref, useAttrs } from 'vue';
import { cloneDeep, get } from 'lodash-es';
import { useInjectDisabled } from 'ant-design-vue/es/config-provider/DisabledContext';
import { useInjectFormItemContext } from 'ant-design-vue/es/form';
import type { Field } from '../../types';
import { ContainerFragment, SlotComponent } from '..';
import { COMPONENT_MAP } from '../../constants';
import { useForm, useInitProps } from '../../hooks';

defineOptions({ name: 'BaseField', inheritAttrs: false });

type Props = {
  component?: string;
  path?: string;
};

const props = withDefaults(defineProps<Props>(), {
  component: undefined,
  path: '',
});

type Emits = {
  setComponentRef: [el: any];
};
const emit = defineEmits<Emits>();

const form = useForm(undefined, undefined, false);
const { formData, getFormData, setFormData } = form;

const { getInitProps } = useInitProps();

const componentRef = ref<any>();
const componentMounted = () => {
  emit('setComponentRef', componentRef.value);
};

const triggerFormItemChange = () => {
  if (COMPONENT_MAP.has(props.component as any)) return;
  const formItemContext = useInjectFormItemContext();
  formItemContext.onFieldChange();
};

const value = computed({
  get() {
    return getFormData?.(props.path);
  },
  set(val) {
    const { valueFormatter } = attrs;
    if (valueFormatter && typeof valueFormatter === 'function') {
      const oldVal = cloneDeep(get(formData?.value, props.path));
      setFormData?.(props.path, valueFormatter(val, oldVal));
      return;
    }
    setFormData?.(props.path, val);
    triggerFormItemChange();
  },
});

const attrs: any = useAttrs();

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

const groupedAttrs = computed(() => {
  const compType = componentType.value;
  const initProps = getInitProps({
    component: compType as any,
    type: (attrs as any).type,
  });
  const mergedProps = mergeProps(
    initProps,
    attrs,
    { class: attrs.componentClassName, style: attrs.componentStyle },
    { class: initProps.componentClassName, style: initProps.componentStyle },
    { disabled: attrs.disabled ?? parentDisabled.value ?? initProps.disabled }
  ) as Field;
  // prettier-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { valueFormatter, slots, componentClassName, componentStyle, componentContainer, ...rest } = mergedProps
  return {
    attrs: rest,
    componentContainer,
    slots,
  };
});

const is = computed(() => {
  return COMPONENT_MAP.get(props.component as any) ?? props.component;
});
</script>

<template>
  <ContainerFragment :component="groupedAttrs.componentContainer" :path="path">
    <component
      :is="is"
      v-bind="groupedAttrs.attrs"
      ref="componentRef"
      v-model:[modelName]="value"
      :path="path"
      class="field-component"
      @vue:mounted="componentMounted"
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

<style scoped lang="less">
.field-component:not(.ant-switch) {
  width: 100%;
  min-width: 120px;
}
</style>
