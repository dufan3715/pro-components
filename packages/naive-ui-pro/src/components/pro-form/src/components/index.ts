// components
export { default as BaseFormItem } from './BaseFormItem/index.vue';
export { default as BaseField } from './BaseField/index.vue';
export { default as ContainerFragment } from './ContainerFragment/index.vue';

export const SlotComponent = (slotProps: any) => {
  return typeof slotProps.component === 'function'
    ? slotProps.component({ path: slotProps.path })
    : slotProps.component;
};
