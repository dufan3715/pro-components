import { ComponentProps, ComponentExposed } from 'vue-component-type-helpers';
import BaseForm from './BaseForm/index.vue';
import BaseFormItem from './BaseFormItem/index.vue';

export { default as BaseField } from './BaseField/index.vue';
export { default as ContainerFragment } from './ContainerFragment/index.vue';
export { default as SlotComponent } from './SlotComponent/index.vue';
export { BaseForm, BaseFormItem };

// instance
export type ProFormInstance = ComponentExposed<typeof BaseForm>;
export type ProFormProps = ComponentProps<typeof BaseForm>;

export type ProFormItemInstance = ComponentExposed<typeof BaseFormItem>;
export type ProFormItemProps = ComponentProps<typeof BaseFormItem>;
