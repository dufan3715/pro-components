import BaseTable from './components/Table.vue';

export default BaseTable;

// instance
export type ProTableInstance = InstanceType<typeof BaseTable>;
export type ProTableProps = ProTableInstance['$props'];

// type.d
export * from './types';

// hooks
export * from './hooks';
