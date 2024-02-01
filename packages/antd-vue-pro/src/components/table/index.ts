import { ComponentExposed } from 'vue-component-type-helpers';
import BaseTable from './components/Table.vue';

export default BaseTable;

// instance
export type ProTableInstance = ComponentExposed<typeof BaseTable>;

// type.d
export * from './types';

// hooks
export * from './hooks';
