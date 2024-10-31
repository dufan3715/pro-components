/* eslint-disable no-unused-vars */
import { PaginationProps } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { Ref } from 'vue';
import { Fields, SetField, SetFormData } from '../../form/types';

type Data = { [key: string]: any };
interface Column<D extends Data = Data> extends Omit<ColumnType, 'dataIndex'> {
  dataIndex: Exclude<
    keyof D | (string & Record<never, never>),
    number | symbol
  >;
}

export type Columns<D extends Data = Data> = Array<Column<D>>;

export type Table<D extends Data = Data> = {
  dataSource: Array<D>;
  columns: Columns<D>;
  showColumnKeys: Array<string>;
  searchParam: Partial<D & Record<string, any>>;
  searchFields: Fields<Partial<D>>;
  pagination: PaginationProps;
};

export type UseTable = <D extends Data = Data>(
  init: Partial<Table<D>>
) => {
  [k in keyof Table<D>]: Ref<Table<D>[k]>;
} & {
  setSearchParam: SetFormData;
  setSearchField: SetField;
  setShowColumnKeys: (val: Array<string>) => void;
  setPagination: (val: PaginationProps) => void;
  resetQueryParams: () => void;
};

export type ParamCache = {
  get(): any;
  set(val: Data | ((v: Data) => Data)): void;
};
