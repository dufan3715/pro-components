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
 * @qin-ui/element-plus-pro 的表格实例类型
 *
 * @description 在 core Table 类型的基础上：
 * 1. 将列类型 C 绑定为本地 Column<T>
 * 2. 将 dataSource 重命名为 data（Element Plus 使用 data 而非 dataSource）
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格行数据类型
 
 * @public
 */
export type Table<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
> = Omit<_Table<D, T, Column<T>>, 'dataSource'> & {
  /**
   * Element Plus 数据源（与 core 的 dataSource 对应）
   */
  data: Ref<T[]>;
};

type UseTableParams<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
> = {
  /** 列配置数组 */
  columns?: Columns<T>;
  /** 数据源数组（Element Plus 使用 data 而非 dataSource） */
  data?: T[];
  /** 初始分页参数 */
  pageParam?: PageParam;
  /** 初始搜索参数 */
  searchParam?: ExtendWithAny<DeepPartial<D>>;
  /** 搜索表单字段配置 */
  searchFields?: Fields<D>;
};

/**
 * 创建 @qin-ui/element-plus-pro 表格实例的 Hook
 *
 * @description 基于 core useTable 封装，适配 Element Plus 的 API 风格：
 * - 数据源使用 `data` 而非 `dataSource`
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格行数据类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * const table = useTable<User>({
 *   columns: [
 *     { prop: 'name', title: '姓名', width: 120 },
 *     { prop: 'age', title: '年龄', width: 80 },
 *   ],
 *   data: [],
 *   pageParam: { current: 1, pageSize: 20, total: 0 },
 * })
 * ```
 
 * @public
 */
export const useTable = <
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
>(
  params: UseTableParams<D, T> = {}
): Table<D, T> => {
  const { data, ...rest } = params;
  const coreTable = (_useTable as any)({
    ...rest,
    dataSource: data,
  }) as _Table<D, T, Column<T>>;

  const { dataSource, ...tableWithoutDataSource } = coreTable as any;
  const table = {
    ...tableWithoutDataSource,
    data: dataSource as Ref<T[]>,
  } as Table<D, T>;

  return table;
};
