import { ComponentExposed, ComponentProps } from 'vue-component-type-helpers';
import ProTable from './components/ProTable.vue';

// 仅保留组件 Props 与实例类型，不将裸组件 ProTable 作为具名导出直接扔出去
export type ProTableProps = ComponentProps<typeof ProTable>;
export type ProTableInstance = ComponentExposed<typeof ProTable>;

// 仅导出核心列配置类型
export { type Column, type Columns } from './types';

// 仅导出核心表格 Hook 与类型
export { useTable, type Table } from './hooks';

export default ProTable;
