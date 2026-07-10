import { ComponentProps, ComponentExposed } from 'vue-component-type-helpers';
import ProForm from './ProForm/index.vue';
import BaseFormItem from './BaseFormItem/index.vue';

export { default as BaseField } from './BaseField/index.vue';
export { default as ContainerFragment } from './ContainerFragment/index.vue';
export { default as SlotComponent } from './SlotComponent/index.vue';
export { ProForm, BaseFormItem };

// instance
export type ProFormInstance = ComponentExposed<typeof ProForm>;
export type ProFormProps = ComponentProps<typeof ProForm>;

export type ProFormItemInstance = ComponentExposed<typeof BaseFormItem>;
export type ProFormItemProps = ComponentProps<typeof BaseFormItem>;
