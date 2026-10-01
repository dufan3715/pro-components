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
import { Reactive, customRef, reactive, Ref, ref, toValue } from 'vue';
import { applyByGroupDesc, GroupMatch } from '../shared/internals';
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
  /**
   * 设置分页参数
   * @description 仅接受并保留 current / pageSize / total 三个标准属性，其余 key 会被丢弃。
   */
  setPageParam: SetPageParam;
  /**
   * 重置查询参数（重置分页和搜索条件到初始值）
   * @description 恢复的是初始快照的全部 key（含调用时传入的自定义分页属性），与 setPageParam 的过滤行为不对称，属刻意设计。
   */
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
 * @param {Columns<T, C>} [params.columns] - 初始列配置。会直接包裹（复用）传入的数组引用，并被 normalizeColumns 就地补齐 key（`@mutates`）；后续整体重赋值返回实例的 columns（`.value =`）时会同步对新数组就地补齐缺失的 key
 * @param {T[]} [params.dataSource] - 初始数据源。会直接包裹（复用）传入的数组引用，后续对返回实例的变更会穿透到调用方原对象
 * @param {PageParam} [params.pageParam] - 初始分页参数。会直接包裹（复用）传入的对象引用，后续对返回实例的变更会穿透到调用方原对象
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

/**
 * 独立调用 {@link normalizeColumn} / {@link normalizeColumns} 且未传 `allocateKey` 时，
 * 为无 key 列自动补齐唯一标识（`__col_1`, `__col_2`, ...）的兜底自增种子。
 *
 * @internal 模块级可变状态，不对外暴露。
 */
let fallbackColumnKeySeed = 0;

/**
 * 规范化单个表格列配置（补齐 key，递归处理 children，不破坏原对象引用）
 *
 * @description 就地为缺失 key 的列对象补齐 key（优先级：key → dataIndex → prop → columnKey → 全局唯一自增标识 `__col_N`）；
 * 若列对象被冻结（Object.isFrozen），则降级为浅拷贝后赋值。
 *
 * @mutates 会就地修改传入的列对象（补齐 `key` 属性）。若对象被冻结，则返回解冻的浅拷贝副本。
 * 调用方应知悉：传入的原始对象可能被直接变异。
 *
 * @param col - 列配置对象
 * @param allocateKey - 自动 key 生成函数；未提供时回退模块级兜底种子，递归处理 children 时沿用同一函数
 * @returns 规范化后的原列配置对象（或解冻后的副本）
 */
export function normalizeColumn<
  T extends Data = Data,
  C extends BaseColumn<T> = BaseColumn<T>,
>(col: C, allocateKey?: () => string): C {
  if (!col || typeof col !== 'object') return col;
  let target = col;
  if (Object.isFrozen(target)) {
    target = { ...col };
  }
  /*
   * key 兜底链（仅 key 为 undefined/null 时触发）：dataIndex（数组 join 点分）→ prop → columnKey → 自增
   * 保证任何列最终都具备字符串 key；冻结列在浅拷贝副本上补 key
   */
  if (target.key === undefined || target.key === null) {
    if (target.dataIndex !== undefined && target.dataIndex !== null) {
      target.key = (
        Array.isArray(target.dataIndex)
          ? target.dataIndex.join('.')
          : String(target.dataIndex)
      ) as Path<T>;
    } else if (
      (target as any).prop !== undefined &&
      (target as any).prop !== null
    ) {
      target.key = String((target as any).prop) as Path<T>;
    } else if (typeof (target as any).columnKey === 'string') {
      target.key = (target as any).columnKey as Path<T>;
    } else {
      target.key = (
        allocateKey ? allocateKey() : `__col_${++fallbackColumnKeySeed}`
      ) as Path<T>;
    }
  }
  if (Array.isArray(target.children) && target.children.length > 0) {
    target.children = target.children.map((child: any) =>
      normalizeColumn(child as C, allocateKey)
    );
  }
  return target;
}

/**
 * 规范化表格列配置数组（就地补齐 key，不破坏原对象引用）
 *
 * @mutates 会就地修改传入的数组及其元素：
 * - 对每个元素调用 {@link normalizeColumn} 补齐 `key`；
 * - 若元素为冻结对象，会用解冻副本**替换**数组中对应位置的元素（`columns[i] = ...`）。
 * 调用方传入的原始数组会被直接变异。
 *
 * @param columns - 列配置数组
 * @param allocateKey - 传给 {@link normalizeColumn} 的自动 key 生成函数；未提供时回退模块级兜底种子
 * @returns 原列配置数组（若传入非数组则返回空数组）
 */
export function normalizeColumns<
  T extends Data = Data,
  C extends BaseColumn<T> = BaseColumn<T>,
>(columns?: Columns<T, C>, allocateKey?: () => string): Columns<T, C> {
  if (!Array.isArray(columns)) return [] as unknown as Columns<T, C>;
  for (let i = 0; i < columns.length; i++) {
    columns[i] = normalizeColumn(columns[i], allocateKey);
  }
  return columns;
}

const useTable = <
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
  C extends BaseColumn<T> = BaseColumn<T>,
>(
  params: {
    columns?: Columns<T, C>;
    dataSource?: T[];
    pageParam?: PageParam;
    searchParam?: ExtendWithAny<DeepPartial<D>>;
    searchFields?: Fields<D>;
  } = {}
): Table<D, T, C> => {
  const {
    columns: initColumns = [],
    dataSource: initDataSource = [],
    pageParam: initPageParam = getDefaultPageParam(),
    searchParam: initSearchParam = {},
    searchFields: initSearchFields = [],
  } = params;
  const _initSearchParam = cloneDeep(toValue(initSearchParam));
  const _initPageParam = cloneDeep(toValue(initPageParam));

  let columnKeySeed = 0;
  const allocateColumnKey = () => `__col_${++columnKeySeed}`;

  const columnState = ref<Columns<T, C>>(
    normalizeColumns(initColumns, allocateColumnKey)
  ) as Ref<Columns<T, C>>;

  /*
   * 就地补齐缺失的 key（含 children 递归）：仅缺失时写入、命中即跳过，
   * 不改写已有 key、不重建 children 数组，返回值表示是否发生写入
   */
  const ensureColumnKeys = (list: Columns<T, C>, allocateKey: () => string) => {
    let changed = false;
    for (let i = 0; i < list.length; i++) {
      const col = list[i] as C;
      if (!col || typeof col !== 'object') continue;
      if (col.key === undefined || col.key === null) {
        list[i] = normalizeColumn(col, allocateKey);
        changed = true;
      } else if (Array.isArray(col.children) && col.children.length > 0) {
        if (ensureColumnKeys(col.children as Columns<T, C>, allocateKey)) {
          changed = true;
        }
      }
    }
    return changed;
  };

  /*
   * columns 以 customRef 暴露：读取时就地补齐缺失 key（幂等，仅缺失时写入），
   * 整体重赋值先规范化再收编；内部经 ref 转发以保持数组与元素的深层响应式与原引用
   */
  const columns = customRef<Columns<T, C>>((track, trigger) => ({
    get() {
      track();
      ensureColumnKeys(columnState.value, allocateColumnKey);
      return columnState.value;
    },
    set(next) {
      normalizeColumns(next, allocateColumnKey);
      columnState.value = next;
      trigger();
    },
  }));

  const dataSource = ref<T[]>(initDataSource) as Ref<T[]>;

  const pageParam = reactive(initPageParam);

  const setPageParam: SetPageParam = pa => {
    let newPageParam = pa;
    if (typeof pa === 'function') {
      newPageParam = pa(pageParam);
    }
    // 白名单过滤：仅接受并保留 current/pageSize/total，未知 key 丢弃；部分更新语义（只写不删）
    Object.assign(pageParam, pick(newPageParam, pageParamProperty as any));
  };

  const searchForm = useForm<D>(initSearchParam as any, initSearchFields, true);

  const resetQueryParams = () => {
    /*
     * 恢复初始化快照（全部 key，含自定义分页键）：分页合并写、搜索走批量覆盖
     * 每次都重新深拷贝快照，恢复出的对象与快照本体相互独立
     */
    Object.assign(pageParam, cloneDeep(_initPageParam));
    searchForm.setFormData(cloneDeep(_initSearchParam) as any);
  };

  const updaterMatch = (
    key: Path<T> | ColumnFindBy<T, C>,
    updater: ColumnUpdater<T, C>,
    options: UpdateColumnOptions = {}
  ) => {
    if (!key) return;
    // all 默认值按定位方式区分：函数定位默认处理全部命中，字符串路径默认只处理第一个
    const { all = typeof key === 'function' } = options;

    /*
     * DFS 递归匹配：字符串定位先比 key，列为空时退比 dataIndex（数组 join 点分后比对）
     * 命中回调携带 column / columnIndex / group（所在数组引用），非 all 模式命中即短路返回
     */
    const traverse = (currentColumns: Columns<T, C>): boolean => {
      for (let i = 0; i < currentColumns.length; i++) {
        const columnItem = currentColumns[i];
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
            group: currentColumns as any,
          });
          if (!all) return true;
        }
        if (
          Array.isArray(columnItem.children) &&
          columnItem.children.length > 0
        ) {
          const finished = traverse(columnItem.children as Columns<T, C>);
          if (finished && !all) return true;
        }
      }
      return false;
    };

    traverse(columns.value);
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
   * // 合并更新
   * table.setColumn('name', { title: '用户姓名', width: 200 })
   *
   * // 覆盖更新
   * table.setColumn('name', { key: 'name', title: '用户姓名' }, { updateType: 'rewrite' })
   *
   * // 函数式更新
   * table.setColumn('status', prev => ({ ...prev, width: prev.width + 50 }))
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
          const normalized = normalizeColumn(value as C, allocateColumnKey);
          // 新对象未显式指定 key 时继承原列的 key
          if (
            (normalized.key === undefined ||
              String(normalized.key).startsWith('__col_')) &&
            preColumn.key
          ) {
            normalized.key = preColumn.key;
          }
          group[columnIndex] = normalized;
        } else {
          const merged = value as C;
          // 合并新增的 children 就地补齐子列 key
          if (merged.children !== undefined) {
            merged.children = merged.children.map((child: any) =>
              normalizeColumn(child, allocateColumnKey)
            );
          }
          Object.assign(preColumn, merged);
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
    const matches: GroupMatch[] = [];
    updaterMatch(
      path,
      ({ columnIndex, group }) => {
        matches.push({ group, index: columnIndex });
      },
      options
    );
    applyByGroupDesc(matches, ({ group, index }) => {
      group.splice(index, 1);
    });
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
      const matches: GroupMatch[] = [];
      updaterMatch(
        path,
        ({ columnIndex, group }) => {
          matches.push({ group, index: columnIndex });
        },
        options
      );
      // 多位点匹配时克隆列对象并独立生成 key，单位点保持原引用
      const multiSite = matches.length > 1;
      if (!multiSite) normalizeColumns(newColumns, allocateColumnKey);
      applyByGroupDesc(matches, ({ group, index }) => {
        const insertIndex = placement === 'after' ? index + 1 : index;
        group.splice(
          insertIndex,
          0,
          ...(multiSite
            ? newColumns.map(col =>
                normalizeColumn({ ...col }, allocateColumnKey)
              )
            : newColumns)
        );
      });
    } else if (placement === 'after') {
      columns.value.push(
        ...(normalizeColumns(newColumns, allocateColumnKey) as any)
      );
    } else {
      columns.value.unshift(
        ...(normalizeColumns(newColumns, allocateColumnKey) as any)
      );
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
  };
};

export default useTable;
