import { ComponentExposed } from 'vue-component-type-helpers';
import BaseTable from './components/Table.vue';

export default BaseTable;

// instance
export type ProTableInstance = ComponentExposed<typeof BaseTable>;

// constants
export * from './constants';

// type.d
export * from './types';

// hooks
export * from './hooks';
