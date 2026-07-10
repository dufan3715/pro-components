import { ComponentProps, ComponentExposed } from 'vue-component-type-helpers';
import ProForm from './ProForm/index.vue';

export { default as BaseField } from './BaseField/index.vue';
export { default as ContainerFragment } from './ContainerFragment/index.vue';
export { default as SlotComponent } from './SlotComponent/index.vue';
export { default as PathProvider } from './PathProvider/index.vue';
export { default as GroupedFieldAttrs } from './GroupedFieldAttrs/index.vue';
export { default as BaseFormItem } from './BaseFormItem/index.vue';

export { ProForm };

// instance
export type ProFormInstance = ComponentExposed<typeof ProForm>;
export type ProFormProps = ComponentProps<typeof ProForm>;
