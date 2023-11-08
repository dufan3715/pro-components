/* eslint-disable no-unused-vars */
import { PaginationProps } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { Ref } from 'vue';
import { Fields, SetField, SetFormData } from '../../form/types';

type Data = Record<string, any>;
interface Column<D extends Data = Data> extends Omit<ColumnType, 'dataIndex'> {
  dataIndex: keyof D & string;
}

export type Columns<D extends Data = Data> = Array<Column<D>>;

export type Table<D extends Data = Data> = {
  dataSource: Array<D>;
  columns: Columns<D>;
  checkedColumns: Array<keyof D & string>;
  searchParam: Partial<D & Record<string, any>>;
  searchFields: Fields<Partial<D>>;
  pagination: PaginationProps;
};

export type UseTable<T extends Data = Data> = <D extends T = T>(
  init: Partial<Table<D>>
) => {
  [k in keyof Table<D>]: Ref<Table<D>[k]>;
} & {
  setSearchParam: SetFormData;
  setSearchField: SetField;
  setCheckedColumns: (val: Array<string>) => void;
  setPagination: (val: PaginationProps) => void;
  resetQueryParams: () => void;
};
