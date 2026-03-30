import { useTable as _useTable, type Table as _Table } from '../../shared/core';
import type {
  Data,
  ExtendWithAny,
  DeepPartial,
  PageParam,
} from '../../shared/core';
import { Fields } from '../form/types';
import type { Column, Columns } from './types';
import type { Ref } from 'vue';

/**
 * 重新定义 Table 类型，将 Column 类型绑定为 element-plus-pro 的 Column<D>
 */
export type Table<
  D extends Data = Data,
  T extends object = ExtendWithAny<D>,
> = Omit<_Table<D, T, Column<D>>, 'dataSource'> & {
  /**
   * element-plus table 数据源
   */
  data: Ref<T[]>;
};

type UseTableParams<
  D extends Data = Data,
  T extends object = ExtendWithAny<D>,
> = {
  columns?: Columns<D>;
  data?: T[];
  pageParam?: PageParam;
  searchParam?: ExtendWithAny<DeepPartial<D>>;
  searchFields?: Fields<D>;
};

export const useTable = <
  D extends Data = Data,
  T extends object = ExtendWithAny<D>,
>(
  params: UseTableParams<D, T> = {}
): Table<D, T> => {
  const { data, ...rest } = params;
  const coreTable = _useTable<D, T, Column<D>>({
    ...rest,
    dataSource: data,
  }) as _Table<D, T, Column<D>>;

  const { dataSource, ...tableWithoutDataSource } = coreTable as any;
  const table = {
    ...tableWithoutDataSource,
    data: dataSource as Ref<T[]>,
  } as Table<D, T>;

  return table;
};
