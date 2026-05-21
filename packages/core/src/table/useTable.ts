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

export type Table<
  D extends Data = Data,
  T extends Data = ExtendWithAny<D>,
  C extends BaseColumn<T> = BaseColumn<T>,
> = {
  columns: Ref<Columns<T, C>>;
  dataSource: Ref<T[]>;
  pageParam: Reactive<PageParam>;
  searchForm: Form<D>;
  setColumn: SetColumn<T, C>;
  deleteColumn: (
    path: Path<T> | ColumnFindBy<T, C>,
    options?: UpdateColumnOptions
  ) => void;
  appendColumn: (
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
    options?: UpdateColumnOptions
  ) => void;
  prependColumn: (
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
    options?: UpdateColumnOptions
  ) => void;
  setPageParam: SetPageParam;
  resetQueryParams: () => void;
};

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

  function appendColumn(
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
    options?: UpdateColumnOptions
  ) {
    const newColumns = Array.isArray(column) ? column : [column];
    addColumns(path, newColumns, options, 'after');
  }

  function prependColumn(
    path: Path<T> | ColumnFindBy<T, C> | undefined,
    column: C | Columns<T, C>,
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
