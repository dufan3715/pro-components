import type {
  ComponentProps,
  ComponentExposed,
} from 'vue-component-type-helpers';
import ProForm from './ProForm/index.vue';
import BaseFormItems from './BaseFormItems/index.vue';

export { default as BaseField } from './BaseField/index.vue';
export { default as ContainerFragment } from './ContainerFragment/index.vue';
export { default as SlotComponent } from './SlotComponent/index.vue';
export { ProForm, BaseFormItems };

// instance
/** ProForm 组件实例 */
export type ProFormInstance = ComponentExposed<typeof ProForm>;
/** ProForm 组件属性 */
export type ProFormProps = ComponentProps<typeof ProForm>;

/** BaseFormItems 组件实例（字段级 FormItem） */
export type ProFormItemsInstance = ComponentExposed<typeof BaseFormItems>;
/** BaseFormItems 组件属性（字段级 FormItem） */
export type ProFormItemsProps = ComponentProps<typeof BaseFormItems>;
