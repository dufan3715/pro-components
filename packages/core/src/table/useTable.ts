/**
 * @module Core/useTable
 * @description 框架无关（Framework-Agnostic）的表格状态管理核心
 *
 * ## 架构设计说明
 *
 * `useTable` 是表格系统的数据流引擎。核心理念是 **"配置数据化，状态流转中枢化"**。
 * 它将表格的列配置、分页状态、搜索条件、以及底层组件的 API 代理统一在这一层进行管理，做到与具体的 UI 框架完全隔离。
 *
 * ### 核心职责
 * 1. **列状态管理**：提供动态控制列显示/隐藏（hidden 属性）的能力，以及对列配置的灵活更新机制。
 * 2. **分页与查询流**：内置跨框架标准化的分页状态 (`pageParam`)，支持重置、参数更新，方便与远程 API 无缝衔接。
 * 3. **搜索整合**：内置挂载 `searchForm` 表单实例，在逻辑层面打通了“条件输入 → 重置分页 → 触发列表查询”的数据闭环。
 * 4. **API 代理**：桥接底层的表格组件实例，为外部业务代码提供一致的操作手柄。
 *
 * @internal 本模块为底层基建，外部业务通常调用上层 UI 封装包二次导出的 typed useTable。
 */
import { Reactive, reactive, Ref, ref, toValue } from 'vue';
import {
  BaseColumn,
  Columns,
  PageParam,
  UpdateColumnOptions,
  ColumnUpdater,
  ColumnFindBy,
} from './types';
import { Data, DeepPartial, ExtendWithAny, Path } from '../shared/types';
import { cloneDeep, pick } from '../shared/utils';
import { Fields, Form, useForm } from '../form';

const getDefaultPageParam = (): PageParam => ({
  current: 1,
  pageSize: 10,
  total: 0,
});

const pageParamProperty = ['current', 'pageSize', 'total'] as const;

type SetPageParam = (
  pageParam:
    | Partial<PageParam>
    | ((pre: Readonly<PageParam>) => Partial<PageParam>)
) => void;

type SetColumn<
  T extends Data = Data,
  C extends BaseColumn<T> = BaseColumn<T>,
> = (
  key: Path<T>,
  column: C | ((pre: Readonly<C>) => C),
  options?: {
    updateType?: 'rewrite' | 'merge';
  } & UpdateColumnOptions
) => void;

/**
 * 表格实例类型
 * @template D - 搜索表单数据类型
 * @template T - 表格数据类型（表格行数据类型），默认为 ExtendWithAny<D>
 * @template C - 列配置类型，继承自 BaseColumn<T>
 *
 * 组合了列操作、数据源管理、分页管理和搜索表单的能力。
 *
 * @example
 * ```ts
 * interface User { name: string; age: number; }
 * interface SearchParams { keyword: string }
 *
 * const table: Table<SearchParams, User> = useTable({
 *   columns: [
 *     { key: 'name', title: '姓名' },
 *     { key: 'age', title: '年龄' },
 *   ],
 *   dataSource: [
 *     { name: '张三', age: 25 },
 *   ],
 *   searchFields: [
 *     { path: 'keyword', label: '关键词', component: 'input' },
 *   ],
 * })
 *
 * // 列操作
 * table.setColumn('name', { title: '用户名' })
 * table.appendColumn('name', { key: 'email', title: '邮箱' })
 * table.deleteColumn('age')
 *
 * // 分页操作
 * table.setPageParam({ current: 2, pageSize: 20 })
 * table.resetQueryParams()
 *
 * // 搜索表单
 * table.searchForm.getFormData('keyword')
 * table.searchForm.setFormData('keyword', '张三')
 * ```
 */
export type Table<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
  C extends BaseColumn<T> = BaseColumn<T>,
> = {
  /** 列配置数组（Vue ref） */
  columns: Ref<Columns<T, C>>;
  /** 数据源数组（Vue ref） */
  dataSource: Ref<T[]>;
  /** 分页参数（Vue reactive） */
  pageParam: Reactive<PageParam>;
  /** 搜索表单实例 */
  searchForm: Form<D>;
  /** 设置列配置 */
  setColumn: SetColumn<T, C>;
  /** 删除列 */
  deleteColumn: (
    path: Path<T> | ColumnFindBy<T, C>,
    options?: UpdateColumnOptions
  ) => void;
  /** 在指定列后追加列 */
  appendColumn: (
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
    options?: UpdateColumnOptions
  ) => void;
  /** 在指定列前插入列 */
  prependColumn: (
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
    options?: UpdateColumnOptions
  ) => void;
  /** 设置分页参数 */
  setPageParam: SetPageParam;
  /** 重置查询参数（重置分页和搜索条件到初始值） */
  resetQueryParams: () => void;
};

/**
 * 创建表格实例的核心 Hook
 *
 * @description useTable 是 ProTable 的核心，提供了：
 * - 列配置管理（增删改查）
 * - 数据源管理
 * - 分页管理
 * - 搜索表单集成（内部使用 useForm）
 * - 查询参数重置
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格数据类型（行数据类型），默认与搜索表单数据一致并扩展
 * @template C - 列配置类型，继承自 BaseColumn<T>
 *
 * @param {object} params - 表格配置参数
 * @param {Columns<T, C>} [params.columns] - 初始列配置
 * @param {T[]} [params.dataSource] - 初始数据源
 * @param {PageParam} [params.pageParam] - 初始分页参数
 * @param {ExtendWithAny<DeepPartial<D>>} [params.searchParam] - 初始搜索参数
 * @param {Fields<D>} [params.searchFields] - 搜索表单字段配置
 *
 * @returns {Table<D, T, C>} 表格实例
 *
 * @example
 * ```ts
 * interface SearchParams { keyword: string; status: string }
 * interface User { name: string; age: number; email: string }
 *
 * const table = useTable<SearchParams, User>({
 *   // 列配置
 *   columns: [
 *     { key: 'name', title: '姓名' },
 *     { key: 'age', title: '年龄' },
 *     { key: 'email', title: '邮箱' },
 *   ],
 *   // 数据源
 *   dataSource: [],
 *   // 分页
 *   pageParam: { current: 1, pageSize: 20, total: 0 },
 *   // 搜索表单
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
 */
const useTable = <
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
  C extends BaseColumn<T> = BaseColumn<T>,
>(params: {
  columns?: Columns<T, C>;
  dataSource?: T[];
  pageParam?: PageParam;
  searchParam?: ExtendWithAny<DeepPartial<D>>;
  searchFields?: Fields<D>;
}): Table<D, T, C> => {
  const {
    columns: initColumns = [],
    dataSource: initDataSource = [],
    pageParam: initPageParam = getDefaultPageParam(),
    searchParam: initSearchParam = {},
    searchFields: initSearchFields = [],
  } = params;
  const _initSearchParam = cloneDeep(toValue(initSearchParam));

  const columns = ref<Columns<T, C>>([]) as Ref<Columns<T, C>>;
  columns.value = initColumns;

  const dataSource = ref<T[]>(initDataSource);

  const pageParam = reactive(initPageParam);

  const setPageParam: SetPageParam = pa => {
    let newPageParam = pa;
    if (typeof pa === 'function') {
      newPageParam = pa(pageParam);
    }
    Object.assign(pageParam, pick(newPageParam, pageParamProperty as any));
  };

  const searchForm = useForm(initSearchParam as any, initSearchFields, true);

  const resetQueryParams = () => {
    Object.assign(pageParam, getDefaultPageParam());
    searchForm.setFormData(cloneDeep(_initSearchParam) as any);
  };

  const updaterMatch = (
    key: Path<T> | ColumnFindBy<T, C>,
    updater: ColumnUpdater<T, C>,
    options: UpdateColumnOptions = {}
  ) => {
    if (!key) return;
    const { all = typeof key === 'function' } = options;
    for (let i = 0; i < columns.value.length; i++) {
      const columnItem = columns.value[i];
      let matched = false;
      if (typeof key === 'function') {
        matched = (key as any)(columnItem);
      } else if (columnItem.key) {
        matched = columnItem.key === key;
      } else if (columnItem.dataIndex) {
        const dataIndexKey = Array.isArray(columnItem.dataIndex)
          ? columnItem.dataIndex.join('.')
          : (columnItem.dataIndex as string);
        matched = dataIndexKey === key;
      }
      if (matched) {
        updater({
          column: columnItem as any,
          columnIndex: i,
          group: columns.value as any,
        });
        if (!all) return;
      }
    }
  };

  /**
   * 设置列配置
   *
   * @param {Path<T>} key - 列字段路径
   * @param {C | ((pre: Readonly<C>) => C)} column - 新的列配置或更新函数
   * @param {object} [options] - 更新选项
   * @param {'rewrite' | 'merge'} [options.updateType='merge'] - 更新方式：merge 合并、rewrite 覆盖
   *
   * @example
   * ```ts
   * // 合并更新列属性
   * table.setColumn('name', { title: '用户名', width: 150 })
   *
   * // 覆盖更新
   * table.setColumn('name', { key: 'name', title: '姓名' }, { updateType: 'rewrite' })
   * ```
   */
  const setColumn: SetColumn<T, C> = (key, column, options) => {
    if (!key || !column) return;
    const { updateType = 'merge', ...rest } = options || {};
    updaterMatch(
      key,
      ({ column: preColumn, columnIndex, group }) => {
        let value = column;
        if (typeof column === 'function') {
          value = column(preColumn);
        }
        if (!value) return;
        if (updateType === 'rewrite') {
          group[columnIndex] = value as C;
        } else {
          Object.assign(preColumn, value);
        }
      },
      rest
    );
  };

  /**
   * 删除列
   *
   * @param {Path<T> | ColumnFindBy<T, C>} path - 列字段路径或查找函数
   * @param {object} [options] - 删除选项
   * @param {boolean} [options.all] - 是否删除所有匹配，默认只删除第一个
   *
   * @example
   * ```ts
   * // 删除单个列
   * table.deleteColumn('email')
   *
   * // 删除所有隐藏列
   * table.deleteColumn(c => c.hidden, { all: true })
   * ```
   */
  function deleteColumn(
    path: Path<T> | ColumnFindBy<T, C>,
    options?: UpdateColumnOptions
  ) {
    if (!path) return;
    updaterMatch(
      path,
      ({ columnIndex, group }) => {
        group.splice(columnIndex, 1);
      },
      options
    );
  }

  /**
   * 在指定列后追加列
   *
   * @param {Path<T> | ColumnFindBy<T, C> | undefined} path - 目标列路径，传 undefined 则在末尾追加
   * @param {C | Columns<T, C>} column - 要追加的列配置或列数组
   * @param {object} [options] - 追加选项
   *
   * @example
   * ```ts
   * // 在 name 列后追加 email 列
   * table.appendColumn('name', { key: 'email', title: '邮箱' })
   *
   * // 在末尾追加
   * table.appendColumn(undefined, { key: 'remark', title: '备注' })
   *
   * // 批量追加
   * table.appendColumn('name', [
   *   { key: 'email', title: '邮箱' },
   *   { key: 'phone', title: '电话' },
   * ])
   * ```
   */
  function appendColumn(
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
    options?: UpdateColumnOptions
  ) {
    const newColumns = Array.isArray(column) ? column : [column];
    addColumns(path, newColumns, options, 'after');
  }

  /**
   * 在指定列前插入列
   *
   * @param {Path<T> | ColumnFindBy<T, C> | undefined} path - 目标列路径，传 undefined 则在开头插入
   * @param {C | Columns<T, C>} column - 要插入的列配置或列数组
   * @param {object} [options] - 插入选项
   *
   * @example
   * ```ts
   * // 在 name 列前插入 id 列
   * table.prependColumn('name', { key: 'id', title: 'ID' })
   *
   * // 在开头插入
   * table.prependColumn(undefined, { key: 'id', title: 'ID' })
   * ```
   */
  function prependColumn(
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
    options?: UpdateColumnOptions
  ) {
    const newColumns = Array.isArray(column) ? column : [column];
    addColumns(path, newColumns, options, 'before');
  }

  function addColumns(
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    newColumns: Columns<T, C>,
    options?: UpdateColumnOptions,
    placement?: 'before' | 'after'
  ) {
    if (newColumns.length === 0) return;
    if (path) {
      updaterMatch(
        path,
        ({ columnIndex, group }) => {
          const index = placement === 'after' ? columnIndex + 1 : columnIndex;
          group.splice(index, 0, ...newColumns);
        },
        options
      );
    } else if (placement === 'after') {
      columns.value.push(...(newColumns as any));
    } else {
      columns.value.unshift(...(newColumns as any));
    }
  }

  return {
    columns,
    dataSource,
    pageParam,
    searchForm,
    setColumn,
    deleteColumn,
    appendColumn,
    prependColumn,
    setPageParam,
    resetQueryParams,
  } as any;
};

export default useTable;
