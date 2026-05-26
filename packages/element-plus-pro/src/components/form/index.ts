import BaseForm from './components/BaseForm/index.vue';

// 1. 仅导出核心 Vue 组件包装及外部可重用组件与类型
export {
  ContainerFragment,
  SlotComponent,
  type ProFormProps,
  type ProFormInstance,
  type ProFormItemProps,
  type ProFormItemInstance,
} from './components';

// 2. 仅导出允许模块合并扩展的 ComponentMap 以及组件名类型
export { type ComponentMap, type ComponentName } from './constants';

// 3. 仅导出核心表单配置 Schema 类型
export { type Field, type Fields } from './types';

// 4. 仅导出核心业务 Hooks
export {
  useForm,
  useFields,
  useFormRef,
  useFormData,
  type Form,
  type UseFields,
} from './hooks';

export default BaseForm;
