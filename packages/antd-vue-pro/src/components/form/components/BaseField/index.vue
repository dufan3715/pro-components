<script lang="ts" setup>
import {
  type Component,
  computed,
  inject,
  mergeProps,
  ref,
  useAttrs,
} from 'vue';
import { cloneDeep, omit } from '../../../../shared/utils';
import {
  useInjectDisabled,
  useInjectFormItemContext,
} from '../../../../shared/ui';
import type { Base, Field } from '../../types';
import { ContainerFragment, SlotComponent } from '..';
import { COMPONENT_MAP, TeleportComponentNamePrefix } from '../../constants';
import { useForm } from '../../hooks';
import { getInitProps } from './utils';

defineOptions({ name: 'BaseField', inheritAttrs: false });

type Props = {
  component?: string | Component;
  path?: string;
};
const props = withDefaults(defineProps<Props>(), {
  component: undefined,
  path: '',
});

const form = useForm(false);
const { getFormData, setFormData } = form;

const componentRef = ref<any>();

const formItemContext = useInjectFormItemContext();
const triggerFormItemChange = () => {
  if (COMPONENT_MAP.has(props.component as any)) return;
  formItemContext.onFieldChange();
};

const attrs: any = useAttrs();
const { valueFormatter } = attrs as Base;

function getOldValue() {
  return cloneDeep(getFormData?.(props.path));
}

const value = computed({
  get() {
    let val = getFormData?.(props.path);
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
    if (valueFormatter) {
      if (typeof valueFormatter === 'function') {
        newVal = valueFormatter(val, getOldValue());
      } else if (typeof valueFormatter.set === 'function') {
        newVal = valueFormatter.set(val, getOldValue());
      }
    }
    setFormData?.(props.path, newVal);
    triggerFormItemChange();
  },
});

const parentDisabled = useInjectDisabled();

const groupedAttrs = computed(() => {
  const initProps = getInitProps({
    component: props.component,
    type: attrs.type,
  } as Field);
  const mergedProps = mergeProps(
    initProps,
    attrs,
    { class: attrs.componentClassName, style: attrs.componentStyle },
    { class: initProps.componentClassName, style: initProps.componentStyle },
    { disabled: attrs.disabled ?? parentDisabled.value ?? initProps.disabled },
    { modelName: attrs.modelName ?? initProps.modelName ?? 'value' }
  ) as Required<Field>;
  // prettier-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { valueFormatter, modelName, slots, componentClassName, componentStyle, componentContainer, ...rest } = mergedProps
  const bindAttrs = omit(rest, [modelName, `onUpdate:${modelName}`]);
  return { attrs: bindAttrs, slots, componentContainer, modelName };
});

const teleportComponent = inject(
  `${TeleportComponentNamePrefix}${props.path}`,
  undefined
);

const is = computed(() => {
  return (
    teleportComponent ??
    COMPONENT_MAP.get(props.component as any) ??
    props.component
  );
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
      v-model:[`${groupedAttrs.modelName}`]="value"
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
