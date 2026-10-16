import type {
  ComponentExposed,
  ComponentProps,
} from 'vue-component-type-helpers';
import ProTable from './components/ProTable.vue';

// 仅保留组件 Props 与实例类型
/** ProTable 的组件属性类型 */
export type ProTableProps = ComponentProps<typeof ProTable>;
/** ProTable 的组件实例类型，用于 `ref` 标注与 `defineExpose` 访问 */
export type ProTableInstance = ComponentExposed<typeof ProTable>;

// 仅导出核心列配置类型
export { type Column, type Columns } from './types';

// 仅导出核心表格 Hook 与类型
export { useTable, type Table } from './hooks';

export default ProTable;
