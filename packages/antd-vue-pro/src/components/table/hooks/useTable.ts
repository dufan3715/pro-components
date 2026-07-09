import {
  useTable as coreUseTable,
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
 * 表格实例类型
 *
 * @description 在 core Table 类型的基础上，将列类型 C 绑定为本地 Column<T>，
 * 使 columns 操作获得 Ant Design Vue 表格列的完整属性类型提示。
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格行数据类型（一行数据的类型）
 *
 * @property columns     - 列配置数组（响应式 Ref），用于渲染表格列
 * @property dataSource  - 表格数据源（响应式 Ref），绑定到 Table 的 data-source
 * @property pageParam   - 分页参数（响应式 reactive），包含 current、pageSize、total
 * @property searchForm  - 搜索表单实例（Form 类型），用于管理搜索区域的字段和数据
 * @property setColumn   - 更新列配置，支持合并/覆盖两种模式，用法同 setField
 * @property deleteColumn - 删除列，支持路径或查找函数
 * @property appendColumn - 在指定列后追加新列，传 undefined 在末尾追加
 * @property prependColumn - 在指定列前插入新列，传 undefined 在开头插入
 * @property setPageParam - 设置分页参数，支持部分更新和函数式更新
 * @property resetQueryParams - 重置分页到第一页并恢复搜索条件到初始值
 *
 * @example
 * ```ts
 * interface SearchParams { keyword: string }
 * interface User { name: string; age: number }
 *
 * const table: Table<SearchParams, User> = useTable({
 *   columns: [{ dataIndex: 'name', title: '姓名' }],
 * })
 *
 * table.columns.value                  // 访问列配置
 * table.setColumn('name', { width: 150 }) // 更新列
 * table.setPageParam({ current: 2 })      // 切换页码
 * table.searchForm.setFormData('keyword', '搜索词') // 操作搜索表单
 * ```
 *
 * @public
 */
export type Table<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
> = _Table<D, T, Column<T>>;

/**
 * 创建表格实例的 Hook
 *
 * @description 基于 `@qin-ui/pro-components-core` 的 `useTable`，将列类型绑定为本地 `Column<T>`。
 * 是 ProTable 组件的核心 Hook，提供了：
 * - 列配置管理（增删改查）
 * - 数据源管理
 * - 分页管理
 * - 搜索表单集成（内部使用 useForm）
 * - 查询参数重置
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格行数据类型
 *
 * @param {object} params - 表格配置参数
 * @param {Columns<T>} [params.columns] - 初始列配置数组
 * @param {T[]} [params.dataSource] - 初始数据源
 * @param {PageParam} [params.pageParam] - 初始分页参数，默认 `{ current: 1, pageSize: 10, total: 0 }`
 * @param {ExtendWithAny<DeepPartial<D>>} [params.searchParam] - 初始搜索参数
 * @param {Fields<D>} [params.searchFields] - 搜索表单字段配置
 *
 * @returns {Table<D, T>} 表格实例
 *
 * @example
 * ```ts
 * interface SearchParams { keyword: string; status: string }
 * interface User { name: string; age: number; email: string }
 *
 * const table = useTable<SearchParams, User>({
 *   columns: [
 *     { dataIndex: 'name', title: '姓名', width: 120 },
 *     { dataIndex: 'age', title: '年龄', width: 80 },
 *   ],
 *   dataSource: [],
 *   pageParam: { current: 1, pageSize: 20, total: 0 },
 *   searchParam: { keyword: '', status: '' },
 *   searchFields: [
 *     { path: 'keyword', label: '关键词', component: 'input' },
 *     { path: 'status', label: '状态', component: 'select' },
 *   ],
 * })
 *
 * // 查询
 * const handleSearch = async () => {
 *   const res = await fetchUserList({
 *     ...table.searchForm.formData,
 *     ...table.pageParam,
 *   })
 *   table.dataSource.value = res.data
 *   table.setPageParam({ total: res.total })
 * }
 *
 * // 重置
 * const handleReset = () => {
 *   table.resetQueryParams()
 *   handleSearch()
 * }
 * ```
 *
 * @public
 */
export function useTable<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
>(params: {
  columns?: Columns<T>;
  dataSource?: T[];
  pageParam?: PageParam;
  searchParam?: ExtendWithAny<DeepPartial<D>>;
  searchFields?: Fields<D>;
}): Table<D, T> {
  return coreUseTable(params) as any;
}
