import BaseForm from './components/BaseForm/index.vue';
import { withInstall } from '../../install';

export const ProForm = withInstall(BaseForm);
export default ProForm;

// instance
export type ProFormInstance = InstanceType<typeof ProForm>;

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
