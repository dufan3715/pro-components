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
  type Slot,
} from 'vue';
import { INJECT_CONFIG } from '../../component-provider/constants';
import { ContainerFragment } from '../../form';
import type { ContainerComponent } from '../../form/types';
import SearchForm from './SearchForm.vue';
import { SearchFormProps } from './SearchForm.vue';
import type { Table } from '../useTable';
import { camelizeProperties, getObject, pick } from '../../../shared/core';
import { ComponentSlots } from 'vue-component-type-helpers';
import {
  DefaultSearchFormContainer,
  DefaultTableContainer,
  SizeControl,
  ColumnControl,
} from '.';
import { Column, Columns } from '../types';

defineOptions({ name: 'ProTable', inheritAttrs: false });

type Control = { sizeControl: boolean; columnControl: boolean };

type SearchFormConfig = Omit<SearchFormProps, 'form'> & {
  // 是否隐藏搜索表单
  hidden?: boolean;
  // 搜索区域包裹容器
  container?: ContainerComponent | false;
};

type Props = {
  // 列表表格对象，returns from useTable
  table?: T;
  // 列表数据查询方法
  search?: () => Promise<unknown>;
  // 是否在首列插入index列
  addIndexColumn?: boolean;
  // onMounted 时立即触发一次search事件
  immediateSearch?: boolean;
  // 是否展示表格 size 和 column 控制按钮
  control?: boolean | Partial<Control>;
  // 搜索栏查询字段表单配置
  searchFormConfig?: SearchFormConfig;
  // 表格区域包裹容器
  tableContainer?: ContainerComponent | false;
} & /* @vue-ignore */ TableProps;

const {
  table = undefined,
  search = undefined,
  addIndexColumn = undefined,
  control = undefined,
  tableContainer = undefined,
  immediateSearch = undefined,
  searchFormConfig = undefined,
} = defineProps<Props>();

// 从 ProComponentProvider 获取全局配置，与 props 合并
const config = INJECT_CONFIG['pro-table'];
const injectProps = inject(config.injectionKey, config.default);

const tableProperties = Object.keys(tableProps());

const injectAttrs = pick(injectProps, tableProperties) as TableProps;

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

const attrs: Record<string, any> = useAttrs();
const tableAttrs = computed<TableProps>(() => {
  return pick(camelizeProperties(attrs), tableProperties);
});

const { columns, dataSource, searchForm, pageParam, setPageParam } =
  table || {};

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
type TableSlots = Omit<ComponentSlots<typeof ATable>, 'bodyCell'> &
  Readonly<{
    bodyCell?: (props: {
      text: any;
      value: any;
      record: RecordType;
      index: number;
      column: Column<RecordType>;
    }) => void;
  }>;
type Slots = Omit<TableSlots & CustomSlots, 'default'>;

const slots = defineSlots<Slots>();
const {
  'search-form': searchFormSlot,
  'button-bar': buttonBarSlot,
  toolbar: toolbarSlot,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  table: tableSlot,
  ...tableSlots
} = slots;

const searchPage1st = () => {
  setPageParam?.({ current: 1 });
  _search();
};

const computedTableProps = computed<TableProps>(() => {
  return {
    ...injectAttrs,
    ...tableAttrs.value,
    pagination: undefined,
    onChange: undefined,
  };
});

const computedTableContainer = computed(() => {
  const container =
    tableContainer ?? injectProps.tableContainer ?? DefaultTableContainer;
  return container ? container : undefined;
});

type ReturnGenericParameterTypes<V> = V extends Table<any, infer R> ? R : never;
type RecordType = ReturnGenericParameterTypes<T>;

const indexColumn: ColumnType = {
  title: '序号',
  dataIndex: '_index',
  width: 80,
  render: (_, __, index) => index + 1,
};

const computedColumns = computed(
  () =>
    [
      ...((addIndexColumn ?? injectProps.addIndexColumn) ? [indexColumn] : []),
      ...(tableAttrs.value.columns ?? columns?.value ?? []).flatMap(
        (item: any, index) => {
          if (item.key) return [{ ...item, key: item.key }];
          if (item.dataIndex) {
            const dataIndexKey = Array.isArray(item.dataIndex)
              ? item.dataIndex.join('.')
              : (item.dataIndex as string);
            return [{ ...item, key: dataIndexKey }];
          }
          return [{ ...item, key: index }];
        }
      ),
    ] as Columns<RecordType>
);

const visibleComputedColumns = computed(() => {
  return computedColumns.value.filter(item => !(item as Column).hidden);
});

const computedDataSource = computed<RecordType[]>(() => {
  return (tableAttrs.value.dataSource as any[]) ?? dataSource?.value;
});

const computedPagination = computed<PaginationProps | false>(() => {
  if (tableAttrs.value.pagination === false) return false;
  return {
    ...injectAttrs.pagination,
    ...pageParam,
    ...tableAttrs.value.pagination,
  };
});

const onTableChange: any = (...args: any[]) => {
  setPageParam?.(args[0]);
  attrs.onChange?.(...args);
  _search();
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
  return { sizeControl, columnControl };
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
          <ColumnControl :columns="computedColumns" :table="table" />
        </div>
      </div>

      <slot name="table">
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
          <template
            v-for="(_, name) of tableSlots"
            :key="name"
            #[name]="scoped"
          >
            <slot :name="name" v-bind="scoped" />
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
