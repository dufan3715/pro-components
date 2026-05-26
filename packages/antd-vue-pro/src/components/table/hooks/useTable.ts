import {
  useTable as _useTable,
  type Table as _Table,
} from '../../../shared/core';
import type {
  Data,
  ExtendWithAny,
  DeepPartial,
  PageParam,
} from '../../../shared/core';
import type { Column, Columns } from '../types';
import { Fields } from '../../form/types';

/**
 * @qin-ui/antd-vue-pro 的表格实例类型
 *
 * @description 在 core Table 类型的基础上，将列类型 C 绑定为本地 Column<T>，
 * 使 columns 操作获得 Ant Design Vue 表格列的完整属性类型提示（如 title、width、fixed 等）。
 * @public
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格行数据类型
 *
 * @example
 * ```ts
 * interface SearchParams { keyword: string }
 * interface User { name: string; age: number }
 *
 * const table: Table<SearchParams, User> = useTable({...})
 * table.columns.value[0].title // 类型为 string | undefined
 * table.columns.value[0].width // 类型为 number | undefined（Ant Design Vue 属性）
 * ```
 */
export type Table<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
> = _Table<D, T, Column<T>>;

/**
 * 创建 @qin-ui/antd-vue-pro 表格实例 of Hook
 *
 * @description 类型安全的 re-export。将 core useTable 的列类型绑定为本地 Column<T>，
 * 使 columns 操作获得 Ant Design Vue 表格列的完整类型提示。
 *
 * 使用方式与 core useTable 完全一致，详见 `@qin-ui/core` 的 useTable 文档。
 * @public
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格行数据类型
 *
 * @example
 * ```ts
 * interface SearchParams { keyword: string }
 * interface User { name: string; age: number; email: string }
 *
 * const table = useTable<SearchParams, User>({
 *   columns: [
 *     { key: 'name', title: '姓名', width: 120 },
 *     { key: 'age', title: '年龄', width: 80 },
 *     { key: 'email', title: '邮箱' },
 *   ],
 *   dataSource: [],
 *   pageParam: { current: 1, pageSize: 20, total: 0 },
 *   searchParam: { keyword: '' },
 *   searchFields: [
 *     { path: 'keyword', label: '关键词', component: 'input' },
 *   ],
 * })
 * ```
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
