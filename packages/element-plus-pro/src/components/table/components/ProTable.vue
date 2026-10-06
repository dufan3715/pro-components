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
  type TableEmits,
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
import ContainerFragment from '../../form/components/ContainerFragment/index.vue';
import type { ContainerComponent } from '../../form/types';
import SearchForm from './SearchForm.vue';
import type { SearchFormProps } from './SearchForm.vue';
import type { Table } from '../useTable';
import { useLocale } from '../../../locale';
import {
  Path,
  camelizeProperties,
  getObject,
  isObjectItem,
  isPlainObject,
  isPromise,
  pick,
} from '../../../shared/core';
import DefaultSearchFormContainer from './DefaultSearchFormContainer.vue';
import DefaultTableContainer from './DefaultTableContainer.vue';
import SizeControl from './SizeControl.vue';
import ColumnControl from './ColumnControl.vue';
import type { Columns, ColumnControlConfig } from '../types';
import TableColumnRenderer from './TableColumnRenderer.vue';

defineOptions({
  name: 'ProTable',
  directives: {
    loading: ElLoading.directive,
  },
  inheritAttrs: false,
});

const tableProperties = Object.keys(tableProps());
const paginationProperties = Object.keys(paginationProps());

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
} & /* @vue-ignore */ Omit<TableProps, 'data'>;

type Emits = {} & /* @vue-ignore */ TableEmits<RecordType>;

defineEmits<Emits>();

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

const attrs = useAttrs() as Record<string, any>;

const PRO_TABLE_EXCLUDED_ATTR_KEYS = new Set([
  'class',
  'style',
  'onSearch',
  'onChange',
  'onUpdate:size',
  'onUpdate:loading',
  'data',
  'columns',
  'size',
  'pagination',
]);

const PRO_TABLE_PROVIDER_KEYS = new Set([
  'pagination',
  'searchFormConfig',
  'control',
  'immediateSearch',
  'addIndexColumn',
  'tableContainer',
]);

const injectTableAttrs = computed(() => {
  const tableConfig: Record<string, any> = {};
  for (const [key, value] of Object.entries(injectProps.value)) {
    if (!PRO_TABLE_PROVIDER_KEYS.has(key)) {
      tableConfig[key] = value;
    }
  }
  return tableConfig as Partial<TableProps>;
});

const attrsTableProps = computed(() => {
  return pick(
    camelizeProperties(attrs),
    tableProperties
  ) as Partial<TableProps>;
});

const restTableAttrs = computed(() => {
  const rest: Record<string, any> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (!PRO_TABLE_EXCLUDED_ATTR_KEYS.has(key)) {
      rest[key] = value;
    }
  }
  return rest;
});

const size = defineModel<TableProps['size']>('size');
const loading = defineModel<boolean>('loading', { default: false });

// 递增序号做请求竞态守卫，仅最新一次请求可变更 loading
let searchSequence = 0;
let warnedSearchConfig = false;
const warnSearchConfig = (reason: string) => {
  if (warnedSearchConfig) return;
  warnedSearchConfig = true;
  console.warn(`[ProTable] ${reason}`);
};
const _search = async () => {
  if (props.search && attrs.onSearch) {
    warnSearchConfig(
      '同时配置了 :search prop 与 @search 监听，@search 监听不会被执行，请仅保留其一。'
    );
  }
  const searchPromise = (props.search || attrs.onSearch)?.();
  if (!isPromise(searchPromise)) {
    warnSearchConfig(
      'search 未返回 Promise，本次查询不参与 loading 竞态管理（在途请求的 loading 状态保持不变）。'
    );
    return;
  }
  const seq = ++searchSequence;
  loading.value = true;
  try {
    await searchPromise;
  } finally {
    if (seq === searchSequence) {
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

const customSlotNames = [
  'search-form',
  'button-bar',
  'toolbar',
  'table',
] as const;

type CustomSlots = Readonly<
  Partial<Record<(typeof customSlotNames)[number], Slot>>
>;
type Slots = CustomSlots & Readonly<Record<string, Slot>>;

const slots = useSlots() as Slots;
// default 插槽保留给列渲染器，同名用户插槽不透传宿主表格
let warnedDefaultSlot = false;
const forwardedSlotNames = () => {
  const names = Object.keys(slots).filter(
    name => name !== 'default' && !customSlotNames.includes(name as any)
  );
  if (
    !warnedDefaultSlot &&
    Object.prototype.hasOwnProperty.call(slots, 'default')
  ) {
    warnedDefaultSlot = true;
    console.warn(
      '[pro-components] ProTable 的 default 插槽保留用于列渲染，已忽略传入的 default 插槽内容；自定义区域请使用 search-form / button-bar / toolbar / table 具名插槽。'
    );
  }
  return names;
};

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
  const source = (
    (props.columns ?? toValue(props.table?.columns) ?? []) as any[]
  ).filter(isObjectItem);
  if (props.addIndexColumn ?? injectProps.value.addIndexColumn) {
    return [
      {
        key: '__INDEX__',
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
  return props.data ?? attrsData ?? toValue(props.table?.data) ?? [];
});

const computedTableProps = computed<TableProps>(() => {
  const merged = {
    ...injectTableAttrs.value,
    ...restTableAttrs.value,
    ...attrsTableProps.value,
  } as TableProps;
  delete (merged as any).data;
  delete (merged as any).columns;
  delete (merged as any).size;
  delete (merged as any).pagination;
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

// 改变 pageSize 时重置回第 1 页并重新查询
const onSizeChange = (pageSize: number) => {
  props.table?.setPageParam?.({ pageSize, current: 1 });
  _search();
};

const onPaginationChange = (currentPage: number, pageSize: number) => {
  // 透传 el-pagination change 回调
  attrs.onChange?.(currentPage, pageSize);
};

const searchFormVisible = computed(() => {
  const searchFields = props.table?.searchForm?.fields;
  const fieldList =
    (Array.isArray(searchFields) ? searchFields : searchFields?.value) ?? [];
  return !!(
    (computedSearchFormConfig.value as any)?.hidden !== true &&
    props.table?.searchForm &&
    fieldList.filter((item: any) => isObjectItem(item) && !toValue(item.hidden))
      ?.length > 0
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

defineExpose({
  /** 手动触发一次查询（与内部搜索共用 loading 竞态守卫），便于外部刷新列表 */
  search: _search,
});
</script>

<template>
  <div class="pro-table" :class="attrs.class" :style="attrs.style">
    <ContainerFragment
      v-if="searchFormVisible || $slots['search-form']"
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
        <div v-if="$slots['button-bar']" class="pro-table_header_button-bar">
          <slot name="button-bar" />
        </div>
        <div v-if="$slots['toolbar']" class="pro-table_header_toolbar">
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
              normalizedRawColumns.filter(item => item.key !== '__INDEX__')
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
          <template
            v-for="name in forwardedSlotNames()"
            :key="name"
            #[name]="scoped"
          >
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
