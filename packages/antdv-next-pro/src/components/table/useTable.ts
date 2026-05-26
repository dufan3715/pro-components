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
 * @qin-ui/antdv-next-pro 的表格实例类型
 *
 * @description 在 core Table 类型的基础上，将列类型 C 绑定为本地 Column<T>，
 * 使 columns 操作获得 antdv-next 表格列的完整属性类型提示。
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格行数据类型
 
 * @public
 */
export type Table<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
> = _Table<D, T, Column<T>>;

/**
 * 创建 @qin-ui/antdv-next-pro 表格实例的 Hook
 *
 * @description 类型安全的 re-export。将 core useTable 的列类型绑定为本地 Column<T>，
 * 使 columns 操作获得 antdv-next 表格列的完整类型提示。
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格行数据类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number; email: string }
 *
 * const table = useTable<User>({
 *   columns: [
 *     { dataIndex: 'name', title: '姓名', width: 120 },
 *     { dataIndex: 'age', title: '年龄', width: 80 },
 *   ],
 *   dataSource: [],
 *   pageParam: { current: 1, pageSize: 20, total: 0 },
 * })
 * ```
 
 * @public
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
