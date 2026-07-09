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
import {
  computed,
  nextTick,
  useAttrs,
  onMounted,
  inject,
  type Slot,
  useSlots,
} from 'vue';
import { INJECT_CONFIG } from '../../component-provider/constants';
import { ContainerFragment } from '../../form';
import type { ContainerComponent } from '../../form/types';
import SearchForm from './SearchForm.vue';
import type { SearchFormProps } from './SearchForm.vue';
import type { Table } from '../useTable';
import { camelizeProperties, getObject, pick } from '../../../shared/core';
import {
  DefaultSearchFormContainer,
  DefaultTableContainer,
  SizeControl,
  ColumnControl,
} from '.';
import type { Columns } from '../types';
import TableColumnRenderer from './TableColumnRenderer.vue';

defineOptions({ name: 'ProTable', inheritAttrs: false });

type Control = { sizeControl: boolean; columnControl: boolean };

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

const {
  table = undefined,
  search = undefined,
  addIndexColumn = undefined,
  control = undefined,
  tableContainer = undefined,
  immediateSearch = undefined,
  searchFormConfig = undefined,
  columns = undefined,
  data = undefined,
  pagination = undefined,
} = defineProps<Props>();

const config = INJECT_CONFIG['pro-table'];
const injectProps = inject(config.injectionKey, config.default) as any;

const tableProperties = Object.keys(tableProps());
const paginationProperties = Object.keys(paginationProps());

const attrs = useAttrs() as Record<string, any>;

const injectTableAttrs = computed(() => {
  return pick(injectProps, tableProperties) as Partial<TableProps>;
});

const attrsTableProps = computed(() => {
  return pick(
    camelizeProperties(attrs),
    tableProperties
  ) as Partial<TableProps>;
});

const {
  columns: tableColumns,
  data: tableData,
  searchForm,
  pageParam,
  setPageParam,
} = table || {};

const size = defineModel<TableProps['size']>('size');
const loading = defineModel<boolean>('loading');

// 核心搜索方法：设置 loading 状态，调用外部 search 函数
const _search = async () => {
  try {
    loading.value = true;
    await search?.();
  } finally {
    loading.value = false;
  }
};

// 重置：恢复查询参数到初始值，重新搜索
const reset = () => {
  table?.resetQueryParams();
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
  setPageParam?.({ current: 1 });
  _search();
};

const computedSearchFormConfig = computed(() => {
  const container =
    searchFormConfig?.container ??
    injectProps.searchFormConfig?.container ??
    DefaultSearchFormContainer;
  return {
    ...injectProps.searchFormConfig,
    ...getObject(searchFormConfig),
    container: container ? container : undefined,
  };
});

const computedTableContainer = computed(() => {
  const container =
    tableContainer ?? injectProps.tableContainer ?? DefaultTableContainer;
  return container ? container : undefined;
});

const normalizedRawColumns = computed(() => {
  const source = (columns ?? tableColumns?.value ?? []) as any[];

  const normalized = source.map((item, index) => {
    const current: any = { ...item };
    if (current.label === undefined && current.title !== undefined) {
      current.label = current.title;
    }
    if (current.prop === undefined && current.dataIndex !== undefined) {
      current.prop = Array.isArray(current.dataIndex)
        ? current.dataIndex.join('.')
        : current.dataIndex;
    }
    if (current.key === undefined) {
      current.key =
        current.prop ??
        (typeof current.columnKey === 'string'
          ? current.columnKey
          : undefined) ??
        `col-${index}`;
    }
    return current;
  });
  if (addIndexColumn ?? injectProps.addIndexColumn) {
    return [
      {
        key: '_index',
        type: 'index',
        label: '序号',
        width: 80,
      },
      ...normalized,
    ];
  }
  return normalized;
});

const computedDataSource = computed<any[]>(() => {
  const attrsData = attrsTableProps.value.data as any[] | undefined;
  return data ?? attrsData ?? tableData?.value ?? [];
});

const computedTableProps = computed<TableProps>(() => {
  const merged = {
    ...injectTableAttrs.value,
    ...attrsTableProps.value,
  } as TableProps;
  delete (merged as any).data;
  return merged;
});

const computedPagination = computed<false | Partial<PaginationProps>>(() => {
  if (pagination === false) return false;
  const pageConfig = pagination ?? {};
  return {
    ...injectProps.pagination,
    ...pick(pageConfig as Record<string, any>, paginationProperties),
    currentPage: (pageConfig as any).currentPage ?? pageParam?.current ?? 1,
    pageSize: (pageConfig as any).pageSize ?? pageParam?.pageSize ?? 10,
    total: (pageConfig as any).total ?? pageParam?.total ?? 0,
  };
});

const showPagination = computed(() => computedPagination.value !== false);

const onCurrentChange = (current: number) => {
  setPageParam?.({ current });
  _search();
};

const onSizeChange = (pageSize: number) => {
  setPageParam?.({ pageSize, current: 1 });
  _search();
};

const onPaginationChange = (currentPage: number, pageSize: number) => {
  attrs.onChange?.(currentPage, pageSize);
};

const showSearch = computed(() => {
  return !!(
    searchFormSlot ||
    (computedSearchFormConfig.value?.hidden !== true &&
      searchForm &&
      searchForm.fields.value.filter(item => !item.hidden)?.length > 0)
  );
});

const computedControl = computed<Control>(() => {
  const mergedControl = control ?? injectProps.control;
  const sizeControl = (mergedControl as Control)?.sizeControl ?? mergedControl;
  const columnControl =
    (mergedControl as Control)?.columnControl ?? mergedControl;
  return { sizeControl: !!sizeControl, columnControl: !!columnControl };
});

const resolvedSize = computed(() => {
  return (
    size.value ??
    (attrsTableProps.value.size as any) ??
    injectTableAttrs.value.size
  );
});

onMounted(() => {
  if (immediateSearch ?? injectProps.immediateSearch) {
    _search();
  }
});
</script>

<template>
  <div
    class="pro-table"
    :class="($attrs as any).class"
    :style="($attrs as any).style"
  >
    <ContainerFragment
      v-if="showSearch"
      :component="computedSearchFormConfig.container"
    >
      <slot name="search-form">
        <SearchForm
          v-if="searchForm"
          :form="searchForm"
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
          <ColumnControl :columns="normalizedRawColumns" :table="table" />
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
