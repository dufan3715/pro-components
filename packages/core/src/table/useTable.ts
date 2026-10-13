/**
 * @module Core/useTable
 * @description 表格状态核心：列配置、数据源、分页参数与搜索表单的统一管理
 *
 * 列操作与整体重赋值共用 `columns`（customRef，读取时幂等补齐缺失 key）；分页写入按
 * `current` / `pageSize` / `total` 白名单过滤；`resetQueryParams` 恢复初始化深拷贝快照（含自定义分页键）；
 * `searchForm` 为内部 `useForm` 实例。本模块为底层基建，上层组件库做泛型绑定与二次导出。
 */
import type { Reactive, Ref } from 'vue';
import { customRef, reactive, ref, toValue } from 'vue';
import type { GroupMatch } from '../shared/internals';
import { applyByGroupDesc } from '../shared/internals';
import type {
  BaseColumn,
  Columns,
  PageParam,
  UpdateColumnOptions,
  ColumnUpdater,
  ColumnFindBy,
} from './types';
import type { Data, DeepPartial, ExtendWithAny, Path } from '../shared/types';
import { cloneDeep, pick } from '../shared/utils';
import type { Fields, Form } from '../form';
import { useForm } from '../form';

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
 * 表格实例类型：列操作 + 数据源 + 分页 + 搜索表单
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格数据类型（行数据类型），默认为 ExtendWithAny<D>
 * @template C - 列配置类型，继承自 BaseColumn<T>
 *
 * @example
 * ```ts
 * const table: Table<SearchParams, User> = useTable({
 *   columns: [{ key: 'name', title: '姓名' }],
 *   searchFields: [{ path: 'keyword', label: '关键词' }],
 * })
 *
 * table.setColumn('name', { title: '用户名' })
 * table.setPageParam({ current: 2 })
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
  /** 设置分页参数：仅保留 `current` / `pageSize` / `total`（未知 key 丢弃，部分更新只写不删） */
  setPageParam: SetPageParam;
  /** 重置查询参数：分页与搜索条件恢复到初始化快照（含自定义分页键，非固定回到第一页） */
  resetQueryParams: () => void;
};

/**
 * 独立调用 {@link normalizeColumn} / {@link normalizeColumns} 且未传 `allocateKey` 时的兜底自增种子（`__col_N`）
 * @internal 模块级可变状态，不对外暴露
 */
let fallbackColumnKeySeed = 0;

/**
 * 规范化单个列配置：为缺失 key 的列就地补齐 `key` 并递归 `children`
 *
 * @description key 兜底链：`key` → `dataIndex`（数组 join 点分）→ `prop` → `columnKey` → 自增 `__col_N`；
 * 不可扩展对象（冻结 / seal / preventExtensions）返回浅拷贝副本；环状 `children` 不再展开。
 *
 * @mutates 就地修改传入的列对象（补 `key`）；不可扩展对象不改写原对象。
 *
 * @param col - 列配置对象
 * @param allocateKey - 自动 key 生成函数；未提供时回退模块级兜底种子，递归 `children` 沿用同一函数
 * @returns 规范化后的列对象（或不可扩展对象的浅拷贝副本）
 */
export function normalizeColumn<
  T extends Data = Data,
  C extends BaseColumn<T> = BaseColumn<T>,
>(col: C, allocateKey?: () => string): C {
  return normalizeColumnNode(col, allocateKey, new WeakSet());
}

/** 列配置递归实现：`seen` 记录当前递归链上已展开的对象，环状 children 原样保留 */
function normalizeColumnNode<
  T extends Data = Data,
  C extends BaseColumn<T> = BaseColumn<T>,
>(col: C, allocateKey: (() => string) | undefined, seen: WeakSet<object>): C {
  if (!col || typeof col !== 'object') return col;
  if (seen.has(col as object)) return col;
  seen.add(col as object);
  let target = col;
  if (!Object.isExtensible(target)) {
    target = { ...col };
  }
  // key 兜底链（仅缺失时）：dataIndex → prop → columnKey → 自增，保证列最终具备字符串 key
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
      normalizeColumnNode(child as C, allocateKey, seen)
    );
  }
  return target;
}

/**
 * 规范化列配置数组：逐项调用 {@link normalizeColumn} 并回写数组元素
 *
 * @mutates 就地修改传入数组；不可扩展的元素会被其浅拷贝副本**替换**
 *
 * @param columns - 列配置数组
 * @param allocateKey - 传给 {@link normalizeColumn} 的自动 key 生成函数
 * @returns 原数组（传入非数组时返回空数组）
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

/**
 * 创建表格实例
 *
 * @description 组合列状态（`columns` + 列操作）、`dataSource`、`pageParam`（分页读写与重置）
 * 与 `searchForm`（内部 `useForm`；条件输入 → 重置分页 → 触发查询的数据闭环由适配层完成）。
 *
 * @template D - 搜索表单数据类型
 * @template T - 表格数据类型（行数据类型），默认与搜索表单数据一致并扩展
 * @template C - 列配置类型，继承自 BaseColumn<T>
 *
 * @param {object} params - 表格配置参数
 * @param {Columns<T, C>} [params.columns] - 初始列配置；内部持浅拷贝，列对象 `key` 由 {@link normalizeColumns} 就地补齐
 * @param {T[]} [params.dataSource] - 初始数据源；内部持浅拷贝（元素为同一批对象）
 * @param {PageParam} [params.pageParam] - 初始分页参数；内部持浅拷贝（字段写入不改写传入对象）
 * @param {ExtendWithAny<DeepPartial<D>>} [params.searchParam] - 初始搜索参数（内部持顶层浅拷贝）
 * @param {Fields<D>} [params.searchFields] - 搜索表单字段配置
 * @returns {Table<D, T, C>} 表格实例
 *
 * @example
 * ```ts
 * const table = useTable<SearchParams, User>({
 *   columns: [{ key: 'name', title: '姓名' }],
 *   searchParam: { keyword: '' },
 * })
 *
 * table.dataSource.value = await fetchUserList({ ...table.searchForm.formData, ...table.pageParam })
 * table.setPageParam({ total: 100 })
 * table.resetQueryParams()
 * ```
 */
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

  // 内部持数组浅拷贝：列增删与重赋值只作用于内部数组（列对象 key 由 normalizeColumns 就地补齐）
  const initialColumns = Array.isArray(initColumns) ? [...initColumns] : [];
  const columnState = ref<Columns<T, C>>(
    normalizeColumns(initialColumns, allocateColumnKey)
  ) as Ref<Columns<T, C>>;

  // 就地补齐缺失 key（含 children 递归，仅缺失时写入）；ancestors 记录递归链，环状 children 不再深入
  const ensureColumnKeys = (
    list: Columns<T, C>,
    allocateKey: () => string,
    ancestors: WeakSet<object> = new WeakSet()
  ) => {
    let changed = false;
    for (let i = 0; i < list.length; i++) {
      const col = list[i] as C;
      if (!col || typeof col !== 'object') continue;
      if (col.key === undefined || col.key === null) {
        list[i] = normalizeColumn(col, allocateKey);
        changed = true;
      } else if (
        Array.isArray(col.children) &&
        col.children.length > 0 &&
        !ancestors.has(col)
      ) {
        ancestors.add(col);
        if (
          ensureColumnKeys(
            col.children as Columns<T, C>,
            allocateKey,
            ancestors
          )
        ) {
          changed = true;
        }
        ancestors.delete(col);
      }
    }
    return changed;
  };

  // customRef：读取时幂等补齐缺失 key，整体重赋值先规范化再收编（经 ref 转发保持深层响应式）
  const columns = customRef<Columns<T, C>>((track, trigger) => ({
    get() {
      track();
      ensureColumnKeys(columnState.value, allocateColumnKey);
      return columnState.value;
    },
    set(next) {
      // 入参非数组时回退空数组
      const nextColumns = Array.isArray(next) ? [...next] : [];
      normalizeColumns(nextColumns, allocateColumnKey);
      columnState.value = nextColumns;
      trigger();
    },
  }));

  // 入参非数组时回退空数组（数据源按数组语义使用）
  const dataSource = ref<T[]>(
    Array.isArray(initDataSource) ? [...initDataSource] : []
  ) as Ref<T[]>;

  const pageParam = reactive({ ...toValue(initPageParam) });

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
    // 恢复初始化快照（全部 key，含自定义分页键）：分页合并写、搜索走批量覆盖；每次重新深拷贝
    Object.assign(pageParam, cloneDeep(_initPageParam));
    searchForm.setFormData(cloneDeep(_initSearchParam) as any);
  };

  const updaterMatch = (
    key: Path<T> | ColumnFindBy<T, C>,
    updater: ColumnUpdater<T, C>,
    options: UpdateColumnOptions = {}
  ) => {
    if (key === undefined || key === null) return;
    // all 默认值按定位方式区分：函数定位默认处理全部命中，字符串路径默认只处理第一个
    const { all = typeof key === 'function' } = options;
    // 数字/布尔 key 归一到字符串形态参与比对（循环外一次，不进入遍历热路径）
    const keyStr =
      typeof key === 'string' || typeof key === 'function' ? key : String(key);

    // DFS 匹配：先比 key，列为空时退比 dataIndex；非 all 命中即返回，ancestors 防环状 children
    const traverse = (
      currentColumns: Columns<T, C>,
      ancestors: WeakSet<object> = new WeakSet()
    ): boolean => {
      for (let i = 0; i < currentColumns.length; i++) {
        const columnItem = currentColumns[i];
        let matched = false;
        if (typeof key === 'function') {
          matched = (key as any)(columnItem);
        } else if (columnItem.key !== undefined && columnItem.key !== null) {
          matched = columnItem.key === keyStr;
        } else if (
          columnItem.dataIndex !== undefined &&
          columnItem.dataIndex !== null
        ) {
          const dataIndexKey = Array.isArray(columnItem.dataIndex)
            ? columnItem.dataIndex.join('.')
            : String(columnItem.dataIndex);
          matched = dataIndexKey === keyStr;
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
          columnItem.children.length > 0 &&
          !ancestors.has(columnItem)
        ) {
          ancestors.add(columnItem);
          const finished = traverse(
            columnItem.children as Columns<T, C>,
            ancestors
          );
          ancestors.delete(columnItem);
          if (finished && !all) return true;
        }
      }
      return false;
    };

    traverse(columns.value);
  };

  /**
   * 更新列配置
   *
   * @param key - 列字段路径或查找函数
   * @param column - 新配置或基于旧配置的更新函数（返回假值跳过）
   * @param [options.updateType='merge'] - `merge` 合并 / `rewrite` 覆盖（新对象未显式指定 key 时继承原列 key）
   * @param [options.all] - 是否更新全部匹配（函数匹配默认 `true`，路径匹配默认 `false`）
   */
  const setColumn: SetColumn<T, C> = (key, column, options) => {
    if (key === undefined || key === null || !column) return;
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
   * @param path - 列字段路径或查找函数
   * @param [options.all] - 是否删除全部匹配（默认只删除第一个）
   */
  function deleteColumn(
    path: Path<T> | ColumnFindBy<T, C>,
    options?: UpdateColumnOptions
  ) {
    if (path === undefined || path === null) return;
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
   * @param path - 目标列路径：`undefined` 追加到末尾，`''` 按 key 严格匹配（零命中不插入），数字路径按字符串归一比对
   * @param column - 列配置或列数组
   * @param [options.all] - 是否在所有匹配列后追加（默认仅第一个）；多位点插入时每个位点获得独立克隆列，克隆列及其 `children` 各层重新分配 key，互不共享
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
   * @param path - 目标列路径：`undefined` 插入到开头，`''` 按 key 严格匹配（零命中不插入），数字路径按字符串归一比对
   * @param column - 列配置或列数组
   * @param [options.all] - 是否在所有匹配列前插入（默认仅第一个）；多位点插入时每个位点获得独立克隆列，克隆列及其 `children` 各层重新分配 key，互不共享
   */
  function prependColumn(
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
    options?: UpdateColumnOptions
  ) {
    const newColumns = Array.isArray(column) ? column : [column];
    addColumns(path, newColumns, options, 'before');
  }

  // 多位点插入的列克隆：逐层浅拷贝并重新分配 key，与调用方对象及其他位点互不共享
  const cloneColumnForInsert = (col: C): C => {
    const copy = { ...(col as any) } as C;
    (copy as any).key = allocateColumnKey();
    if (
      Array.isArray((copy as any).children) &&
      (copy as any).children.length > 0
    ) {
      (copy as any).children = (copy as any).children.map((child: any) =>
        cloneColumnForInsert(child)
      );
    }
    return copy;
  };

  function addColumns(
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    newColumns: Columns<T, C>,
    options?: UpdateColumnOptions,
    placement?: 'before' | 'after'
  ) {
    if (newColumns.length === 0) return;
    if (path !== undefined && path !== null) {
      const matches: GroupMatch[] = [];
      updaterMatch(
        path,
        ({ columnIndex, group }) => {
          matches.push({ group, index: columnIndex });
        },
        options
      );
      // 多位点匹配时每个位点克隆列对象并重新分配 key，单位点保持原引用
      const multiSite = matches.length > 1;
      if (!multiSite) normalizeColumns(newColumns, allocateColumnKey);
      applyByGroupDesc(matches, ({ group, index }) => {
        const insertIndex = placement === 'after' ? index + 1 : index;
        group.splice(
          insertIndex,
          0,
          ...(multiSite
            ? newColumns.map(col => cloneColumnForInsert(col))
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
