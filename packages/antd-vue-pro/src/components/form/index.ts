import { BaseFormItem } from './components';
import BaseForm from './components/BaseForm/index.vue';

export default BaseForm;

// instance
export type ProFormInstance = InstanceType<typeof BaseForm>;
export type ProFormProps = ProFormInstance['$props'];

export type ProFormItemProps = InstanceType<typeof BaseFormItem>['$props'];

// components
export * from './components';

// constants
export * from './constants';

// type.d
export * from './types';

// utils
export * from './utils';

// hooks
export * from './hooks';
