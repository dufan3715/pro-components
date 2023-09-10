import BaseForm from './src/components/BaseForm/index.vue';
import { withInstall } from '../../install';

export const ProForm = withInstall(BaseForm);
export default ProForm;

// instance
export type ProFormInstance = InstanceType<typeof ProForm>;

// components
export * from './src/components';

// constants
export * from './src/constants';

// type.d
export * from './src/types';

// utils
export * from './src/utils';

// hooks
export * from './src/hooks';
