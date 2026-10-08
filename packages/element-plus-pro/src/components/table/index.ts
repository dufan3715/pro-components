import type {
  ComponentExposed,
  ComponentProps,
} from 'vue-component-type-helpers';
import ProTable from './components/ProTable.vue';

// 仅导出组件 Props 与实例类型，不导出裸组件
export type ProTableProps = ComponentProps<typeof ProTable>;
export type ProTableInstance = ComponentExposed<typeof ProTable>;

// 仅导出核心列配置类型
export { type Column, type Columns } from './types';
export { type TableEmits } from '../../shared/ui';

// 仅导出核心表格 Hook 与类型
export { useTable, type Table } from './hooks';

export default ProTable;
