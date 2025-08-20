import { PaginationProps } from '../../../shared/ui';
import { Reactive, reactive, Ref, ref, toValue } from 'vue';
import { Column, Columns } from '../types';
import { Data, ExtendWithAny, Path } from '../../../shared/types';
import { cloneDeep, pick } from '../../../shared/utils';
import { Fields, Form, useForm } from '../../form';

const getDefaultPageParam = () => ({ current: 1, pageSize: 10, total: 0 });

type UpdateColumnOptions = {
  /**
   * 是否更新\获取所有符合条件的列，查找条件为函数时默认true, 否则默认false，为false时仅更新第一个匹配到的列
   */
  all?: boolean;
};

const pageParamProperty = ['current', 'pageSize', 'total'] as const;

type PageParam = Required<
  Pick<PaginationProps, (typeof pageParamProperty)[number]>
>;

type UpdaterParam<D extends Data> = {
  column: Readonly<Column<D>>;
  columnIndex: number;
  group: Columns<D>;
};
type Updater<D extends Data> = (param: UpdaterParam<D>) => void;

type FindBy<D extends Data> = (column: Readonly<Column<D>>) => boolean;

type SetPageParam = (
  pageParam:
    | Partial<PageParam>
    | ((pre: Readonly<PageParam>) => Partial<PageParam>)
) => void;

type SetColumn<D extends Data = Data> = (
  key: Path<D>,
  column: Column<D> | ((pre: Readonly<Column<D>>) => Column<D>),
  options?: {
    /**
     * 更新方式 rewrite替换重写，merge合并(默认)
     * @default 'merge'
     */
    updateType?: 'rewrite' | 'merge';
  } & UpdateColumnOptions
) => void;

export type Table<
  D extends Data = Data,
  T extends object = ExtendWithAny<D>,
> = {
  columns: Ref<Columns<D>>;
  dataSource: Ref<T[]>;
  pageParam: Reactive<PageParam>;
  searchForm: Form<D>;
  setColumn: SetColumn<D>;
  deleteColumn: (
    path: Path<D> | FindBy<D>,
    options?: UpdateColumnOptions
  ) => void;
  appendColumn: (
    path: Path<D> | FindBy<D> | undefined,
    column: Column<D> | Columns<D>,
    options?: UpdateColumnOptions
  ) => void;
  prependColumn: (
    path: Path<D> | FindBy<D> | undefined,
    column: Column<D> | Columns<D>,
    options?: UpdateColumnOptions
  ) => void;
  setPageParam: SetPageParam;
  resetQueryParams: () => void;
};

const useTable = <
  D extends Data = Data,
  T extends object = ExtendWithAny<D>,
>(params: {
  columns?: Columns<D>;
  dataSource?: T[];
  pageParam?: PageParam;
  searchParam?: T;
  searchFields?: Fields<D>;
}): Table<D, T> => {
  const {
    columns: initColumns = [],
    dataSource: initDataSource = [],
    pageParam: initPageParam = getDefaultPageParam(),
    searchParam: initSearchParam = {},
    searchFields: initSearchFields = [],
  } = params;
  const _initSearchParam = cloneDeep(toValue(initSearchParam));

  const columns = ref<Columns<D>>([]);
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
    key: Path<D> | FindBy<D>,
    updater: Updater<D>,
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
      } else {
        matched = key === i;
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

  const setColumn: SetColumn<D> = (key, column, options) => {
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
          group[columnIndex] = value as Column<D>;
        } else {
          Object.assign(preColumn, value);
        }
      },
      rest
    );
  };

  /**
   * 删除列
   * @param {Path<D> | FindBy<D>} path - 列key值或列查找条件
   * @param {Options} [options] - 配置项
   */
  function deleteColumn(
    path: Path<D> | FindBy<D>,
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

  function addColumns(
    path: Path<D> | FindBy<D> | undefined,
    newColumns: Columns<D>,
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

  /**
   * 追加列
   * @param {Path<D> | FindBy<D>} path - 列key值或列查找条件
   * @param {Column<D>} column - 列配置
   * @param [options] - 配置项
   */
  function appendColumn(
    path: Path<D> | FindBy<D> | undefined,
    column: Column<D> | Columns<D>,
    options?: UpdateColumnOptions
  ) {
    const newColumns = Array.isArray(column) ? column : [column];
    addColumns(path, newColumns, options, 'after');
  }

  /**
   * 插入列
   * @param {Path<D> | FindBy<D>} path - 列key值或列查找条件
   * @param {Column<D>} column - 列配置
   * @param [options] - 配置项
   */
  function prependColumn(
    path: Path<D> | FindBy<D> | undefined,
    column: Column<D> | Columns<D>,
    options?: UpdateColumnOptions
  ) {
    const newColumns = Array.isArray(column) ? column : [column];
    addColumns(path, newColumns, options, 'before');
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
