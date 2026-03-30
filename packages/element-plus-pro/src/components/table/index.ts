import type { ComponentPublicInstance } from 'vue';
import type { PaginationProps, TableProps } from '../../shared/ui';
import type { ContainerComponent } from '../form';
import type { Columns } from './types';
import type { SearchFormProps } from './components/SearchForm.vue';
import type { Table } from './useTable';
import BaseTable from './components/BaseTable.vue';

type Control = { sizeControl: boolean; columnControl: boolean };
type SearchFormConfig = Omit<SearchFormProps, 'form'> & {
  hidden?: boolean;
  container?: ContainerComponent | false;
};

type ReturnTableRecord<V> = V extends Table<any, infer R> ? R : any;

// instance
export type ProTableProps<T extends Table<any> = Table> = {
  table?: T;
  search?: () => Promise<unknown>;
  addIndexColumn?: boolean;
  immediateSearch?: boolean;
  control?: boolean | Partial<Control>;
  searchFormConfig?: SearchFormConfig;
  tableContainer?: ContainerComponent | false;
  columns?: Columns<ReturnTableRecord<T>>;
  data?: ReturnTableRecord<T>[];
  pagination?: false | Partial<PaginationProps>;
} & Omit<TableProps, 'data'>;
export type ProTableInstance = ComponentPublicInstance;

// types
export * from './types';

// hooks
export { useTable, type Table } from './useTable';

export default BaseTable;
