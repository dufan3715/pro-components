import { ComponentProps, ComponentExposed } from 'vue-component-type-helpers';
import BaseForm from './BaseForm/index.vue';

export { default as BaseField } from './BaseField/index.vue';
export { default as ContainerFragment } from './ContainerFragment/index.vue';
export { default as SlotComponent } from './SlotComponent/index.vue';
export { default as PathProvider } from './PathProvider/index.vue';
export { default as GroupedFieldAttrs } from './GroupedFieldAttrs/index.vue';
export { default as BaseFormItem } from './BaseFormItem/index.vue';

export { BaseForm };

// instance
export type ProFormInstance = ComponentExposed<typeof BaseForm>;
export type ProFormProps = ComponentProps<typeof BaseForm>;
