import { ComponentExposed, ComponentProps } from 'vue-component-type-helpers';
import BaseTable from './components/BaseTable.vue';

// instance
export type ProTableProps = ComponentProps<typeof BaseTable>;
export type ProTableInstance = ComponentExposed<typeof BaseTable>;

// types
export * from './types';

// hooks
export * from './hooks';

export default BaseTable;
