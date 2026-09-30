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
 *   └── ATable (antdv-next Table)
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
  PaginationProps,
  Table as ATable,
  TableProps,
  ColumnType,
  tableProps,
} from '../../../shared/ui';
import {
  computed,
  nextTick,
  useAttrs,
  onMounted,
  inject,
  toValue,
  type Slot,
} from 'vue';
import { INJECT_CONFIG } from '../../component-provider/constants';
import ContainerFragment from '../../form/components/ContainerFragment/index.vue';
import type { ContainerComponent } from '../../form/types';
import SearchForm from './SearchForm.vue';
import { SearchFormProps } from './SearchForm.vue';
import type { Table } from '../useTable';
import { useLocale } from '../../../locale';
import {
  getObject,
  isPlainObject,
  isPromise,
  pick,
  camelizeProperties,
  Path,
} from '../../../shared/core';
import DefaultSearchFormContainer from './DefaultSearchFormContainer.vue';
import DefaultTableContainer from './DefaultTableContainer.vue';
import SizeControl from './SizeControl.vue';
import ColumnControl from './ColumnControl.vue';
import { ComponentSlots } from 'vue-component-type-helpers';
import { Column, Columns, ColumnControlConfig } from '../types';

defineOptions({ name: 'ProTable', inheritAttrs: false });

const tableProperties = Object.keys(tableProps());

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

type Props = {
  table?: T;
  search?: () => Promise<unknown>;
  addIndexColumn?: boolean;
  control?: boolean | Partial<Control>;
  immediateSearch?: boolean;
  searchFormConfig?: SearchFormConfig;
  // 表格区域包裹容器
  tableContainer?: ContainerComponent | false;
} & /* @vue-ignore */ TableProps;

const props = withDefaults(defineProps<Props>(), {
  table: undefined,
  search: undefined,
  addIndexColumn: undefined,
  control: undefined,
  immediateSearch: undefined,
  searchFormConfig: undefined,
  tableContainer: undefined,
});

const { t } = useLocale();

const config = INJECT_CONFIG['pro-table'];
const injectPropsRaw = inject(config.injectionKey, config.default);
const injectProps = computed(() => toValue(injectPropsRaw) || {});

const injectAttrs = computed<TableProps>(
  () => pick(injectProps.value, tableProperties) as TableProps
);

const computedSearchFormConfig = computed(() => {
  const container =
    props.searchFormConfig?.container ??
    injectProps.value.searchFormConfig?.container ??
    DefaultSearchFormContainer;
  return {
    ...injectProps.value.searchFormConfig,
    ...getObject(props.searchFormConfig),
    container: container ? container : undefined,
  };
});

const attrs: Record<string, any> = useAttrs();
const tableAttrs = computed<TableProps>(() => {
  return pick(camelizeProperties(attrs), tableProperties) as TableProps;
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
type TableSlots = Omit<ComponentSlots<typeof ATable>, 'bodyCell'> &
  Readonly<{
    bodyCell?: (props: {
      text: any;
      record: RecordType;
      index: number;
      column: Column<RecordType>;
    }) => void;
  }>;
type Slots = Omit<TableSlots & CustomSlots, 'default'>;

const slots = defineSlots<Slots>();
const forwardedSlotNames = () =>
  (Object.keys(slots) as Array<Extract<keyof Slots, string>>).filter(
    name => !customSlotNames.includes(name as any)
  );

const columnRequiredSlotNames = new Set([
  'bodyCell',
  'headerCell',
  'filterDropdown',
  'filterIcon',
]);

/**
 * 判定插槽是否具备渲染条件（守卫过渡状态或空列下 column 为 undefined 的情况）
 * 当列被动态隐藏或所有列均隐藏时，旧单元格销毁过渡帧或空占位中 column 可能为 undefined，
 * 此时阻断依赖 column 的业务插槽调用；
 * 非列依赖的表格级插槽（如 emptyText、footer、summary 等）始终正常渲染。
 */
const isSlotRenderable = (name: string, scoped: any) => {
  if (columnRequiredSlotNames.has(name)) {
    return visibleComputedColumns.value.length > 0 && Boolean(scoped?.column);
  }
  return true;
};

const searchPage1st = () => {
  props.table?.setPageParam?.({ current: 1 });
  _search();
};

const computedTableProps = computed<TableProps>(() => {
  return {
    ...injectAttrs.value,
    ...tableAttrs.value,
    pagination: undefined,
    onChange: undefined,
  };
});

const computedTableContainer = computed(() => {
  const container =
    props.tableContainer ??
    injectProps.value.tableContainer ??
    DefaultTableContainer;
  return container ? container : undefined;
});

type ReturnGenericParameterTypes<V> = V extends Table<any, infer R> ? R : never;
type RecordType = ReturnGenericParameterTypes<T>;

// 序号列随分页偏移：第 n 页首行序号 = (n-1)*pageSize + i + 1（无分页时退化为 index+1）
const getIndex = (i: number) => {
  const pageParam = props.table?.pageParam;
  if (pageParam && computedPagination.value !== false) {
    const current = pageParam.current ?? 1;
    const pageSize = pageParam.pageSize ?? 10;
    return (current - 1) * pageSize + i + 1;
  }
  return i + 1;
};

const indexColumn = computed<ColumnType>(() => ({
  title: t('table.index'),
  dataIndex: '__INDEX__',
  key: '__INDEX__',
  width: 80,
  // antdv-next 的 render 为位置参数签名：(value, record, index)
  render: (_value: any, _record: any, index: number) => getIndex(index),
}));

const computedColumns = computed<Columns<RecordType>>(() => {
  const cols = (tableAttrs.value.columns ??
    toValue(props.table?.columns) ??
    []) as any;
  const needIndex = props.addIndexColumn ?? injectProps.value.addIndexColumn;
  return needIndex ? [indexColumn.value, ...cols] : cols;
});

const visibleComputedColumns = computed(() => {
  return computedColumns.value.filter(
    item => !toValue((item as Column).hidden)
  );
});

const computedDataSource = computed<RecordType[]>(() => {
  return (
    (tableAttrs.value.dataSource as RecordType[]) ??
    (toValue(props.table?.dataSource) as RecordType[]) ??
    []
  );
});

// 分页优先级：tableAttrs 显式配置 > provider 全局配置 > 默认合成
const computedPagination = computed<PaginationProps | false>(() => {
  if (tableAttrs.value.pagination === false) return false;
  if (isPlainObject(tableAttrs.value.pagination)) {
    const globalPagination =
      injectAttrs.value.pagination === false
        ? {}
        : injectAttrs.value.pagination;
    return {
      ...globalPagination,
      ...props.table?.pageParam,
      ...tableAttrs.value.pagination,
      showTotal:
        tableAttrs.value.pagination?.showTotal ??
        globalPagination?.showTotal ??
        ((total: number) => t('pagination.total', { total })),
    };
  }
  if (injectAttrs.value.pagination === false) return false;
  return {
    ...injectAttrs.value.pagination,
    ...props.table?.pageParam,
    showTotal:
      injectAttrs.value.pagination?.showTotal ??
      ((total: number) => t('pagination.total', { total })),
  };
});

const onTableChange: any = (...args: any[]) => {
  props.table?.setPageParam?.(args[0]);
  // change 回放：模板监听器优先，未绑定时回退 Provider 全局配置
  (attrs.onChange ?? injectProps.value.onChange)?.(...args);
  _search();
};

const searchFormVisible = computed(() => {
  const rawFields = props.table?.searchForm?.fields;
  const fieldList =
    (Array.isArray(rawFields) ? rawFields : rawFields?.value) ?? [];
  return !!(
    computedSearchFormConfig.value?.hidden !== true &&
    props.table?.searchForm &&
    fieldList.filter(item => !toValue(item.hidden)).length > 0
  );
});

const computedControl = computed<{
  sizeControl: boolean;
  columnControl: boolean | ColumnControlConfig<Path<RecordType>>;
}>(() => {
  const controlConfig = props.control ?? injectProps.value.control;
  if (controlConfig === true) {
    return { sizeControl: true, columnControl: true };
  }
  if (controlConfig === false) {
    return { sizeControl: false, columnControl: false };
  }
  return {
    sizeControl: !!controlConfig?.sizeControl,
    columnControl: controlConfig?.columnControl ?? false,
  };
});

const columnControlConfig = computed(() => {
  const cc = computedControl.value.columnControl;
  return typeof cc === 'object' ? cc : undefined;
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
    <!-- 搜索表单区域 -->
    <ContainerFragment
      v-if="searchFormVisible || $slots['search-form']"
      :component="computedSearchFormConfig.container"
    >
      <slot
        name="search-form"
        v-bind="{ form: props.table?.searchForm, search: searchPage1st, reset }"
      >
        <SearchForm
          v-if="props.table?.searchForm"
          :form="props.table.searchForm"
          v-bind="computedSearchFormConfig"
          @search="searchPage1st"
          @reset="reset"
        />
      </slot>
    </ContainerFragment>

    <!-- 表格主体容器 -->
    <ContainerFragment :component="computedTableContainer">
      <!-- 工具栏区域：操作按钮（左）+ 视图控制按钮（右） -->
      <div class="pro-table_header">
        <!-- 自定义操作按钮区（如新增、批量删除等） -->
        <div v-if="$slots['button-bar']" class="pro-table_header_button-bar">
          <slot name="button-bar" />
        </div>

        <div v-if="$slots['toolbar']" class="pro-table_header_toolbar">
          <slot name="toolbar" />
        </div>

        <!-- 表格尺寸控制（紧凑 / 默认 / 宽松） -->
        <div
          v-if="computedControl.sizeControl"
          class="pro-table_header_size-control"
        >
          <SizeControl v-model:size="size" />
        </div>

        <!-- 列显示/隐藏控制 -->
        <div
          v-if="computedControl.columnControl"
          class="pro-table_header_column-control"
        >
          <ColumnControl
            :columns="computedColumns"
            :table="props.table"
            :column-control="columnControlConfig"
          />
        </div>
      </div>

      <!-- 表格插槽：完全自定义表格渲染 -->
      <slot
        name="table"
        v-bind="{
          columns: visibleComputedColumns,
          dataSource: computedDataSource,
          pagination: computedPagination,
          loading: loading,
          size: size,
          onChange: onTableChange,
        }"
      >
        <!-- 默认 antdv-next Table -->
        <ATable
          class="pro-table_content"
          v-bind="computedTableProps"
          :size="size"
          :loading="loading"
          :columns="visibleComputedColumns"
          :data-source="computedDataSource"
          :pagination="computedPagination"
          @change="onTableChange"
        >
          <!-- 透传非默认插槽给 ATable（如 headerCell、bodyCell 等） -->
          <template
            v-for="name of forwardedSlotNames()"
            :key="name"
            #[name]="scoped"
          >
            <slot
              v-if="isSlotRenderable(name, scoped)"
              :name="name"
              v-bind="scoped"
            />
          </template>
        </ATable>
      </slot>
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

  :deep([class*='-pagination']) {
    [class*='-pagination-total-text'] {
      flex: 1;
    }
  }
}
</style>
