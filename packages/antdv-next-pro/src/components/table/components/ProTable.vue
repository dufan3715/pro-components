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
 * ## 搜索行为
 *
 * 1. 搜索：分页回到第一页后发起查询
 * 2. 分页变化：分页参数同步后发起查询
 * 3. 重置：查询参数恢复初始值后重新查询
 *
 * @template T - 表格实例类型（useTable 返回值）
 *
 * @param {T} [table] - 列表表格对象，来自 useTable
 * @param {() => Promise<unknown>} [search] - 列表数据查询方法
 * @param {boolean} [addIndexColumn] - 是否在首列插入序号列
 * @param {boolean} [immediateSearch] - 挂载后是否立即触发一次查询
 * @param {boolean | Partial<Control>} [control] - 是否展示尺寸与列控制按钮
 * @param {SearchFormConfig} [searchFormConfig] - 搜索栏查询字段表单配置
 * @param {ContainerComponent | false} [tableContainer] - 表格区域包裹容器
 *
 * @slot search-form - 搜索区域插槽，作用域参数 form / search / reset
 * @slot button-bar - 表格头部按钮区插槽
 * @slot toolbar - 工具栏插槽
 * @slot table - 表格区域插槽，作用域参数 columns / dataSource / pagination / loading / size / onChange
 */

import type {
  PaginationProps,
  TableProps,
  ColumnType,
} from '../../../shared/ui';
import { Table as ATable, tableProps } from '../../../shared/ui';
import {
  computed,
  getCurrentInstance,
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
import type { SearchFormProps } from './SearchForm.vue';
import type { Table } from '../hooks/useTable';
import { useLocale } from '../../../locale';
import type { Path } from '../../../shared/core';
import {
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
import type { ComponentSlots } from 'vue-component-type-helpers';
import type { Column, Columns, ColumnControlConfig } from '../types';

defineOptions({ name: 'ProTable', inheritAttrs: false });

const tableProperties = Object.keys(tableProps());

/*
 * 组件自身消费、不向宿主表格透传的 attrs 键：class / style 由根容器消费，
 * onSearch 由内部搜索流程消费
 */
const consumedAttrKeys = ['class', 'style', 'onSearch'];

/*
 * 透传取值：宿主静态 props 可用时按宿主导出的键名筛选；不可用时除组件自身消费的键外
 * 全部透传，宿主表格忽略无法识别的属性
 */
const pickTableProps = (source: Record<string, any>): Record<string, any> => {
  if (tableProperties.length > 0) return pick(source, tableProperties);
  const consumedKeys = new Set([...Object.keys(props), ...consumedAttrKeys]);
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !consumedKeys.has(key))
  );
};

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
  () => pickTableProps(injectProps.value) as TableProps
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
  return pickTableProps(camelizeProperties(attrs)) as TableProps;
});

const size = defineModel<TableProps['size']>('size');
const loading = defineModel<boolean>('loading', { default: false });

// 递增序号做请求竞态守卫，仅最新一次请求可变更 loading
let searchSequence = 0;
/** 告警文案按原因分键，各原因独立去重 */
const SEARCH_WARN_MESSAGES = {
  duplicate:
    '同时配置了 :search prop 与 @search 监听，@search 监听不会被执行，请仅保留其一。',
  'not-promise':
    'search 未返回 Promise，本次查询不参与 loading 竞态管理（在途请求的 loading 状态保持不变）。',
} as const;
const warnedSearchReasons = new Set<keyof typeof SEARCH_WARN_MESSAGES>();
const warnSearchConfig = (reason: keyof typeof SEARCH_WARN_MESSAGES) => {
  if (warnedSearchReasons.has(reason)) return;
  warnedSearchReasons.add(reason);
  console.warn(`[ProTable] ${SEARCH_WARN_MESSAGES[reason]}`);
};
const _search = async () => {
  const search = props.search || attrs.onSearch;
  if (props.search && attrs.onSearch) {
    warnSearchConfig('duplicate');
  }
  if (!search) return;
  const searchPromise = search();
  if (!isPromise(searchPromise)) {
    warnSearchConfig('not-promise');
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

const instance = getCurrentInstance();

/** 调用方是否显式绑定该 prop（含 v-model 写法） */
const isBoundProp = (name: string) => {
  const vnodeProps = instance?.vnode.props || {};
  return name in vnodeProps || `onUpdate:${name}` in vnodeProps;
};

const computedTableProps = computed<TableProps>(() => {
  const merged = {
    ...injectAttrs.value,
    ...tableAttrs.value,
    // loading 由组件自身状态驱动，不从注入与散落 attrs 取值
    loading: undefined,
    pagination: undefined,
    onChange: undefined,
  } as TableProps;
  // 始终读取本地模型以建立依赖；本地显式绑定或已由 SizeControl 写入时覆盖注入值
  const localSize = size.value;
  if (isBoundProp('size') || localSize !== undefined) {
    merged.size = localSize;
  }
  return merged;
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

/*
 * 序号列随有效分页偏移：第 n 页首行序号 = (n-1)*pageSize + i + 1；
 * 有效分页取自 computedPagination（attrs/provider 的 pageSize 优先于 table.pageParam），
 * 分页关闭时退化为 index+1
 */
const getIndex = (i: number) => {
  const pagination = computedPagination.value;
  const pageParam = props.table?.pageParam;
  if (pageParam && pagination !== false) {
    const current = pagination.current ?? pageParam.current ?? 1;
    const pageSize = pagination.pageSize ?? pageParam.pageSize ?? 10;
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

/*
 * 递归过滤 hidden 列（含分组子列）：仅对被过滤过子列的列生成浅拷贝，
 * 未发生变动的列保持原对象引用（每次 columns 变化执行一次，不在渲染期递归）
 */
const filterVisibleColumns = (
  columns: any[]
): { list: any[]; changed: boolean } => {
  const list: any[] = [];
  let changed = false;
  for (const column of columns) {
    if (!isObjectItem(column) || toValue((column as Column).hidden)) {
      changed = true;
      continue;
    }
    if (Array.isArray(column.children) && column.children.length > 0) {
      const filtered = filterVisibleColumns(column.children);
      if (filtered.changed) {
        changed = true;
        list.push({ ...column, children: filtered.list });
        continue;
      }
    }
    list.push(column);
  }
  return { list, changed };
};

const visibleComputedColumns = computed(() => {
  return filterVisibleColumns(computedColumns.value).list;
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

const onTableChange: TableProps['onChange'] = (...args) => {
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
    fieldList.filter(item => isObjectItem(item) && !toValue(item.hidden))
      .length > 0
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
