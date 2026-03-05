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
  D extends Data = Data,
  C extends BaseColumn<D> = BaseColumn<D>,
> = (
  key: Path<D>,
  column: C | ((pre: Readonly<C>) => C),
  options?: {
    updateType?: 'rewrite' | 'merge';
  } & UpdateColumnOptions
) => void;

export type Table<
  D extends Data = Data,
  T extends object = ExtendWithAny<D>,
  C extends BaseColumn<D> = BaseColumn<D>,
> = {
  columns: Ref<Columns<D, C>>;
  dataSource: Ref<T[]>;
  pageParam: Reactive<PageParam>;
  searchForm: Form<D>;
  setColumn: SetColumn<D, C>;
  deleteColumn: (
    path: Path<D> | ColumnFindBy<D, C>,
    options?: UpdateColumnOptions
  ) => void;
  appendColumn: (
    path: Path<D> | ColumnFindBy<D, C> | undefined,
    column: C | Columns<D, C>,
    options?: UpdateColumnOptions
  ) => void;
  prependColumn: (
    path: Path<D> | ColumnFindBy<D, C> | undefined,
    column: C | Columns<D, C>,
    options?: UpdateColumnOptions
  ) => void;
  setPageParam: SetPageParam;
  resetQueryParams: () => void;
};

const useTable = <
  D extends Data = Data,
  T extends object = ExtendWithAny<D>,
  C extends BaseColumn<D> = BaseColumn<D>,
>(params: {
  columns?: Columns<D, C>;
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

  const columns = ref<Columns<D, C>>([]) as Ref<Columns<D, C>>;
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
    key: Path<D> | ColumnFindBy<D, C>,
    updater: ColumnUpdater<D, C>,
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

  const setColumn: SetColumn<D, C> = (key, column, options) => {
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
    path: Path<D> | ColumnFindBy<D, C>,
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
    path: Path<D> | ColumnFindBy<D, C> | undefined,
    newColumns: Columns<D, C>,
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
    path: Path<D> | ColumnFindBy<D, C> | undefined,
    column: C | Columns<D, C>,
    options?: UpdateColumnOptions
  ) {
    const newColumns = Array.isArray(column) ? column : [column];
    addColumns(path, newColumns, options, 'after');
  }

  function prependColumn(
    path: Path<D> | ColumnFindBy<D, C> | undefined,
    column: C | Columns<D, C>,
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
