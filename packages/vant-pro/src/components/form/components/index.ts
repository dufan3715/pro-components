import type {
  ComponentProps,
  ComponentExposed,
} from 'vue-component-type-helpers';
import ProForm from './ProForm/index.vue';

export { default as BaseField } from './BaseField/index.vue';
export { default as ContainerFragment } from './ContainerFragment/index.vue';
export { default as SlotComponent } from './SlotComponent/index.vue';
export { default as BaseFormItems } from './BaseFormItems/index.vue';

export { ProForm };

// instance
/** ProForm 的组件实例类型，用于 `ref` 标注与 `defineExpose` 访问 */
export type ProFormInstance = ComponentExposed<typeof ProForm>;
/** ProForm 的组件属性类型 */
export type ProFormProps = ComponentProps<typeof ProForm>;
