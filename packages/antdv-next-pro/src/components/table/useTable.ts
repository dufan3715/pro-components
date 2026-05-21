import { useTable as _useTable, type Table as _Table } from '../../shared/core';
import type {
  Data,
  ExtendWithAny,
  DeepPartial,
  PageParam,
} from '../../shared/core';
import { Fields } from '../form/types';
import type { Column, Columns } from './types';

/**
 * 重新定义 Table 类型，将 Column 类型绑定为 antdv-next 的 Column<T>
 */
export type Table<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
> = _Table<D, T, Column<T>>;

/**
 * 类型断言 re-export @qin-ui/core 的 useTable，
 */
export const useTable: <
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
>(params: {
  columns?: Columns<T>;
  dataSource?: T[];
  pageParam?: PageParam;
  searchParam?: ExtendWithAny<DeepPartial<D>>;
  searchFields?: Fields<D>;
}) => Table<D, T> = _useTable as any;
