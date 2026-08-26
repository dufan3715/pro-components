<script lang="ts" setup generic="T extends Table<any> = Table">
/**
 * @component ProTable
 * @description 配置驱动的表格组件
 *
 * ## 架构概览
 *
 * ProTable 是表格系统的顶层容器，负责：
 * 1. 接收 useTable() 创建的表格实例，驱动列、数据源、分页的渲染
 * 2. 内部集成 SearchForm 搜索区域（基于 ProForm）
 * 3. 支持列动态控制（显示/隐藏）和尺寸控制
 * 4. 将分页变化和搜索事件串联到数据查询流程
 *
 * ## 数据流
 *
 * ```
 * useTable({ columns, dataSource, searchFields, ... })
 *   ↓ 传入 :table prop
 * ProTable
 *   ├── SearchForm (使用 table.searchForm 管理搜索条件)
 *   │     └── ProForm
 *   ├── SizeControl (表格尺寸切换)
 *   ├── ColumnControl (列显示/隐藏)
 *   └── ElTable (element-plus Table)
 *         └── 转发所有 table 插槽
 * ```
 *
 * ## 搜索流程
 *
 * 1. 用户点击搜索 → SearchForm @search → searchPage1st()
 * 2. searchPage1st 重置分页到第一页，触发 _search()
 * 3. 分页变化 → onTableChange → setPageParam + _search()
 * 4. 重置 → reset() → resetQueryParams + _search()
 */
import {
  Pagination as ElPagination,
  type PaginationProps,
  Table as ElTable,
  type TableProps,
  tableProps,
  paginationProps,
} from '../../../shared/ui';
import { ElLoading } from 'element-plus';
import {
  computed,
  nextTick,
  useAttrs,
  onMounted,
  inject,
  toValue,
  type Slot,
  useSlots,
} from 'vue';
import { INJECT_CONFIG } from '../../component-provider/constants';
import { ContainerFragment } from '../../form';
import type { ContainerComponent } from '../../form/types';
import SearchForm from './SearchForm.vue';
import type { SearchFormProps } from './SearchForm.vue';
import type { Table } from '../useTable';
import { useLocale } from '../../../locale';
import {
  camelizeProperties,
  getObject,
  pick,
  isPromise,
  isPlainObject,
  Path,
} from '../../../shared/core';
import {
  DefaultSearchFormContainer,
  DefaultTableContainer,
  SizeControl,
  ColumnControl,
} from '.';
import type { Columns, ColumnControlConfig } from '../types';
import TableColumnRenderer from './TableColumnRenderer.vue';

defineOptions({
  name: 'ProTable',
  directives: {
    loading: ElLoading.directive,
  },
  inheritAttrs: false,
});

type Control = {
  sizeControl: boolean;
  columnControl: boolean | ColumnControlConfig<Path<RecordType>>;
};

type SearchFormConfig = Omit<SearchFormProps, 'form'> & {
  // 是否隐藏搜索表单
  hidden?: boolean;
  // 搜索区域包裹容器
  container?: ContainerComponent | false;
};

type ReturnTableRecord<V> = V extends Table<any, infer R> ? R : any;
type RecordType = ReturnTableRecord<T>;

type Props = {
  // 列表表格对象，returns from useTable
  table?: T;
  // 列表数据查询方法
  search?: () => Promise<unknown>;
  // 是否在首列插入index列
  addIndexColumn?: boolean;
  // onMounted 时立即触发一次 search 事件
  immediateSearch?: boolean;
  // 是否展示表格 size 和 column 控制按钮
  control?: boolean | Partial<Control>;
  // 搜索栏查询字段表单配置
  searchFormConfig?: SearchFormConfig;
  // 表格区域包裹容器
  tableContainer?: ContainerComponent | false;
  columns?: Columns<RecordType>;
  data?: RecordType[];
  pagination?: false | Partial<PaginationProps>;
} & Omit<TableProps, 'data'>;

const props = withDefaults(defineProps<Props>(), {
  table: undefined,
  search: undefined,
  addIndexColumn: undefined,
  immediateSearch: undefined,
  control: undefined,
  searchFormConfig: undefined,
  tableContainer: undefined,
  columns: undefined,
  data: undefined,
  pagination: undefined,
});

const { t } = useLocale();

const config = INJECT_CONFIG['pro-table'];
const injectPropsRaw = inject(config.injectionKey, config.default);
const injectProps = computed(() => toValue(injectPropsRaw) || {});

const tableProperties = Object.keys(tableProps());
const paginationProperties = Object.keys(paginationProps());

const attrs = useAttrs() as Record<string, any>;

const injectTableAttrs = computed(() => {
  return pick(injectProps.value, tableProperties) as Partial<TableProps>;
});

const attrsTableProps = computed(() => {
  return pick(
    camelizeProperties(attrs),
    tableProperties
  ) as Partial<TableProps>;
});

const size = defineModel<TableProps['size']>('size');
const loading = defineModel<boolean>('loading', { default: false });

// 核心搜索方法：设置 loading 状态，调用外部 search 函数
const _search = async () => {
  const searchPromise = (props.search || attrs.onSearch)?.();
  if (isPromise(searchPromise)) {
    loading.value = true;
    try {
      await searchPromise;
    } finally {
      loading.value = false;
    }
  }
};

// 重置：恢复查询参数到初始值，重新搜索
const reset = () => {
  props.table?.resetQueryParams?.();
  nextTick(() => {
    _search();
  });
};

type CustomSlots = Readonly<
  Partial<Record<'search-form' | 'button-bar' | 'toolbar' | 'table', Slot>>
>;

type Slots = CustomSlots & Readonly<Record<string, Slot>>;

const slots = useSlots() as Slots;
const searchFormSlot = slots['search-form'];
const buttonBarSlot = slots['button-bar'];
const toolbarSlot = slots['toolbar'];

const tableSlots = computed(() => {
  const customNames = new Set([
    'search-form',
    'button-bar',
    'toolbar',
    'table',
  ]);
  return Object.fromEntries(
    Object.entries(slots).filter(([name]) => !customNames.has(name))
  ) as Record<string, Slot>;
});
const tableSlotNames = computed(() => Object.keys(tableSlots.value));

const searchPage1st = () => {
  props.table?.setPageParam?.({ current: 1 });
  _search();
};

const computedSearchFormConfig = computed(() => {
  const container =
    props.searchFormConfig?.container ??
    (injectProps.value.searchFormConfig as any)?.container ??
    DefaultSearchFormContainer;
  return {
    ...injectProps.value.searchFormConfig,
    ...getObject(props.searchFormConfig),
    container: container ? container : undefined,
  };
});

const computedTableContainer = computed(() => {
  const container =
    props.tableContainer ??
    injectProps.value.tableContainer ??
    DefaultTableContainer;
  return container ? container : undefined;
});

const getIndex = (i: number) => {
  if (props.table?.pageParam && computedPagination.value !== false) {
    const current = props.table.pageParam.current ?? 1;
    const pageSize = props.table.pageParam.pageSize ?? 10;
    return (current - 1) * pageSize + i + 1;
  }
  return i + 1;
};

const normalizedRawColumns = computed(() => {
  const source = (props.columns ??
    toValue(props.table?.columns) ??
    []) as any[];
  if (props.addIndexColumn ?? injectProps.value.addIndexColumn) {
    return [
      {
        key: '_index',
        type: 'index',
        label: t('table.index'),
        width: 80,
        index: getIndex,
      },
      ...source,
    ];
  }
  return source;
});

const computedDataSource = computed<any[]>(() => {
  const attrsData = attrsTableProps.value.data as any[] | undefined;
  return (
    props.data ??
    attrsData ??
    toValue((props.table as any)?.dataSource) ??
    toValue(props.table?.data) ??
    []
  );
});

const computedTableProps = computed<TableProps>(() => {
  const merged = {
    ...injectTableAttrs.value,
    ...attrsTableProps.value,
  } as TableProps;
  delete (merged as any).data;
  return merged;
});

// 分页优先级：tableAttrs 显式配置 > provider 全局配置 > 默认合成
const computedPagination = computed<false | Partial<PaginationProps>>(() => {
  const attrsPagination = (attrsTableProps.value as any).pagination;
  if (props.pagination === false || attrsPagination === false) {
    return false;
  }
  const hasUserPagination =
    isPlainObject(props.pagination) || isPlainObject(attrsPagination);
  if (hasUserPagination) {
    const pageConfig = (props.pagination ??
      attrsPagination ??
      {}) as Partial<PaginationProps>;
    const globalPagination =
      (injectProps.value.pagination as any) === false
        ? {}
        : (injectProps.value.pagination as Partial<PaginationProps>) || {};
    const pageParam = props.table?.pageParam;
    return {
      ...globalPagination,
      ...pick(pageConfig as Record<string, any>, paginationProperties),
      currentPage: pageParam?.current ?? (pageConfig as any).currentPage ?? 1,
      pageSize: pageParam?.pageSize ?? (pageConfig as any).pageSize ?? 10,
      total: pageParam?.total ?? (pageConfig as any).total ?? 0,
    };
  }

  if ((injectProps.value.pagination as any) === false) return false;

  const pageParam = props.table?.pageParam;
  return {
    ...(injectProps.value.pagination as Partial<PaginationProps>),
    currentPage: pageParam?.current ?? 1,
    pageSize: pageParam?.pageSize ?? 10,
    total: pageParam?.total ?? 0,
  };
});

const showPagination = computed(() => computedPagination.value !== false);

const onCurrentChange = (current: number) => {
  props.table?.setPageParam?.({ current });
  _search();
};

const onSizeChange = (pageSize: number) => {
  props.table?.setPageParam?.({ pageSize, current: 1 });
  _search();
};

const onPaginationChange = (currentPage: number, pageSize: number) => {
  // 透传 el-pagination change 回调
  attrs.onChange?.(currentPage, pageSize);
};

const showSearch = computed(() => {
  const searchFields = props.table?.searchForm?.fields;
  const fieldList =
    (Array.isArray(searchFields) ? searchFields : searchFields?.value) ?? [];
  return !!(
    searchFormSlot ||
    ((computedSearchFormConfig.value as any)?.hidden !== true &&
      props.table?.searchForm &&
      fieldList.filter((item: any) => !item.hidden)?.length > 0)
  );
});

const computedControl = computed<{
  sizeControl: boolean;
  columnControl: boolean | ColumnControlConfig<Path<RecordType>>;
}>(() => {
  const mergedControl = props.control ?? injectProps.value.control;
  if (typeof mergedControl === 'boolean') {
    return { sizeControl: mergedControl, columnControl: mergedControl };
  }
  const c = mergedControl as Control;
  const sizeControl = c?.sizeControl ?? false;
  const columnControl = c?.columnControl ?? false;
  return { sizeControl: !!sizeControl, columnControl };
});

const columnControlConfig = computed(() => {
  const cc = computedControl.value.columnControl;
  return typeof cc === 'object' ? cc : undefined;
});

const resolvedSize = computed(() => {
  return (
    size.value ??
    (attrsTableProps.value.size as any) ??
    injectTableAttrs.value.size
  );
});

onMounted(() => {
  if (props.immediateSearch ?? injectProps.value.immediateSearch) {
    _search();
  }
});
</script>

<template>
  <div class="pro-table" :class="attrs.class" :style="attrs.style">
    <ContainerFragment
      v-if="showSearch"
      :component="computedSearchFormConfig.container"
    >
      <slot name="search-form">
        <SearchForm
          v-if="props.table?.searchForm"
          :form="props.table.searchForm"
          v-bind="computedSearchFormConfig"
          @search="searchPage1st"
          @reset="reset"
        />
      </slot>
    </ContainerFragment>

    <ContainerFragment :component="computedTableContainer">
      <div class="pro-table_header">
        <div v-if="buttonBarSlot" class="pro-table_header_button-bar">
          <slot name="button-bar" />
        </div>
        <div v-if="toolbarSlot" class="pro-table_header_toolbar">
          <slot name="toolbar" />
        </div>
        <div
          v-if="computedControl.sizeControl"
          class="pro-table_header_size-control"
        >
          <SizeControl v-model:size="size" />
        </div>
        <div
          v-if="computedControl.columnControl"
          class="pro-table_header_column-control"
        >
          <ColumnControl
            :columns="
              normalizedRawColumns.filter(item => item.key !== '_index')
            "
            :table="props.table"
            :column-control="columnControlConfig"
          />
        </div>
      </div>

      <slot name="table">
        <ElTable
          v-loading="loading"
          class="pro-table_content"
          v-bind="computedTableProps"
          :size="resolvedSize"
          :data="computedDataSource"
        >
          <TableColumnRenderer :columns="normalizedRawColumns" />
          <template v-for="name in tableSlotNames" :key="name" #[name]="scoped">
            <slot :name="name" v-bind="scoped" />
          </template>
        </ElTable>
      </slot>

      <ElPagination
        v-if="showPagination"
        class="pro-table_pagination"
        v-bind="computedPagination"
        @current-change="onCurrentChange"
        @size-change="onSizeChange"
        @change="onPaginationChange"
      />
    </ContainerFragment>
  </div>
</template>

<style scoped lang="less">
.pro-table {
  &_header {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    &:empty {
      display: none;
    }

    & + &_content {
      margin-top: 16px;
    }

    &_button-bar {
      flex: 1;
    }

    &_toolbar {
      margin-left: 12px;
    }
  }

  &_pagination {
    justify-content: flex-end;
    padding: 16px 0;
  }
}
</style>
