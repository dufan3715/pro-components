<script lang="ts" setup generic="T extends Table<any> = Table">
/**
 * 配置驱动的表格组件
 *
 * @component ProTable
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
 * ## 搜索行为
 *
 * 1. 搜索：分页回到第一页后发起查询
 * 2. 分页变化：分页参数同步后发起查询
 * 3. 重置：查询参数恢复初始值后重新查询
 *
 * ## 列来源
 *
 * 显式 `:columns` 优先于 `:table` 实例的 `columns`；显式列按原样透传给宿主，不补齐 `key`，
 * 需由调用方提供 `key` / `dataIndex` / `prop`。显式模式下 `setColumn` 与列控入口均不生效。
 *
 * @template T - 表格实例类型（useTable 返回值）
 *
 * @param {T} [table] - 列表表格对象，来自 useTable
 * @param {() => Promise<unknown>} [search] - 列表数据查询方法
 * @param {boolean} [addIndexColumn] - 是否在首列插入序号列
 * @param {boolean} [immediateSearch] - 挂载后是否立即触发一次查询
 * @param {boolean | Partial<Control>} [control] - 是否展示尺寸与列控制按钮；显式传入 columns 时列控入口不渲染
 * @param {SearchFormConfig} [searchFormConfig] - 搜索栏查询字段表单配置
 * @param {ContainerComponent | false} [tableContainer] - 表格区域包裹容器
 *
 * @slot default - 保留给列渲染器，传入内容不参与渲染，自定义区域请使用下列具名插槽
 * @slot search-form - 搜索区域插槽（无作用域）
 * @slot button-bar - 表格头部按钮区插槽
 * @slot toolbar - 工具栏插槽
 * @slot table - 表格区域插槽（无作用域）
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
  Comment,
  Fragment,
  Text,
  computed,
  effect,
  stop,
  nextTick,
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
import type { Table } from '../hooks';
import { useLocale } from '../../../locale';
import type { Path } from '../../../shared/core';
import {
  camelizeProperties,
  getObject,
  isObjectItem,
  isPlainObject,
  isPromise,
  omitBy,
  pick,
  useReactiveAttrs,
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
  /** 是否展示表格尺寸控制 */
  sizeControl: boolean;
  /** 是否展示列控制，传对象时作为列控面板配置 */
  columnControl: boolean | ColumnControlConfig<Path<RecordType>>;
};

/** 搜索表单配置：SearchFormProps 去掉 form，并加上搜索区显隐与容器 */
type SearchFormConfig = Omit<SearchFormProps, 'form'> & {
  /** 是否隐藏搜索表单 */
  hidden?: boolean;
  /** 搜索区域包裹容器 */
  container?: ContainerComponent | false;
};

type ReturnTableRecord<V> = V extends Table<any, infer R> ? R : any;
type RecordType = ReturnTableRecord<T>;

type Props = {
  /** 列表表格对象，来自 useTable */
  table?: T;
  /** 列表数据查询方法 */
  search?: () => Promise<unknown>;
  /** 是否在首列插入序号列 */
  addIndexColumn?: boolean;
  /** 挂载后是否立即触发一次查询 */
  immediateSearch?: boolean;
  /** 是否展示尺寸与列控制按钮，支持分别控制；显式传入 columns 时列控入口不渲染 */
  control?: boolean | Partial<Control>;
  /** 搜索栏查询字段表单配置 */
  searchFormConfig?: SearchFormConfig;
  /** 表格区域包裹容器 */
  tableContainer?: ContainerComponent | false;
  /** 直接传入列配置（覆盖 :table 实例的 columns）；列需自备 key / dataIndex / prop，显式模式不参与 setColumn 与列控 */
  columns?: Columns<RecordType>;
  /** 直接传入数据源（覆盖 :table 实例的 data） */
  data?: RecordType[];
  /** 分页配置，传 false 禁用 */
  pagination?: false | Partial<PaginationProps>;
} & /* @vue-ignore */ Omit<TableProps, 'data'>;

/*
 * 组件自身仅触发模型事件；宿主表格事件不入运行时 emits，监听入口保留在 attrs 中透传至 ElTable
 */
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

const attrs = useReactiveAttrs() as Record<string, any>;

// 组件自身消费的 attrs 键：class / style 绑定根节点，onSearch / onChange 由搜索与分页流程消费
const PRO_TABLE_CONSUMED_ATTR_KEYS = new Set([
  'class',
  'style',
  'onSearch',
  'onChange',
]);

// 组件自身消费的 props 键：对应值按 prop / provider 单一来源派生，provider 注入不再透传这些键
const PRO_TABLE_PROP_KEYS = new Set(Object.keys(props));

const injectTableAttrs = computed(() => {
  const tableConfig: Record<string, any> = {};
  for (const [key, value] of Object.entries(injectProps.value)) {
    if (!PRO_TABLE_PROP_KEYS.has(key)) {
      tableConfig[key] = value;
    }
  }
  return tableConfig as Partial<TableProps>;
});

const attrsTableProps = computed(() => {
  return omitBy(
    pick(camelizeProperties(attrs), tableProperties),
    value => value === undefined
  ) as Partial<TableProps>;
});

const restTableAttrs = computed(() => {
  const rest: Record<string, any> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (!PRO_TABLE_CONSUMED_ATTR_KEYS.has(key)) {
      rest[key] = value;
    }
  }
  return omitBy(rest, value => value === undefined);
});

const size = defineModel<TableProps['size']>('size');
const loading = defineModel<boolean>('loading', { default: false });

// 递增序号做请求竞态守卫，仅最新一次请求可变更 loading
let searchSequence = 0;
// 告警文案按原因分键，各原因独立去重
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
type Slots = CustomSlots & Readonly<Record<string, Slot>>;

const slots = useSlots() as Slots;

/** 插槽产出是否含可渲染内容：注释节点与空白文本不计 */
const hasRenderableContent = (nodes: unknown): boolean => {
  if (nodes === null || nodes === undefined || nodes === false) return false;
  if (typeof nodes === 'string') return nodes.trim() !== '';
  if (typeof nodes === 'number') return true;
  if (Array.isArray(nodes)) return nodes.some(hasRenderableContent);
  const vnode = nodes as { type?: unknown; children?: unknown };
  if (vnode.type === Comment) return false;
  if (vnode.type === Text) return String(vnode.children ?? '').trim() !== '';
  if (vnode.type === Fragment) return hasRenderableContent(vnode.children);
  return true;
};

/*
 * 求值一次 default 插槽产出，用于判定是否有可渲染内容（空插槽 / 包装组件透传不提示）。
 * 求值由一次性 effect 执行并立即停止，插槽内的响应式读取不进入 ProTable 的渲染依赖。
 */
const evaluateSlotContent = (): boolean => {
  let hasContent = false;
  const runner = effect(() => {
    try {
      hasContent = hasRenderableContent(slots.default?.());
    } catch {
      // 产出无法求值时按有内容处理，照常提示 default 插槽被保留
      hasContent = true;
    }
  });
  stop(runner);
  return hasContent;
};

// default 插槽保留给列渲染器，同名用户插槽不透传宿主表格
let defaultSlotChecked = false;
const checkDefaultSlot = () => {
  if (defaultSlotChecked) return;
  if (!Object.prototype.hasOwnProperty.call(slots, 'default')) return;
  defaultSlotChecked = true;
  if (evaluateSlotContent()) {
    console.warn(
      '[pro-components] ProTable 的 default 插槽保留用于列渲染，已忽略传入的 default 插槽内容；自定义区域请使用 search-form / button-bar / toolbar / table 具名插槽。'
    );
  }
};

const forwardedSlotNames = () => {
  checkDefaultSlot();
  return Object.keys(slots).filter(
    name => name !== 'default' && !customSlotNames.includes(name as any)
  );
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

/** SearchForm 属性面：容器与显隐由 ProTable 自身消费，不下发 SearchForm */
const searchFormProps = computed(() => {
  const {
    container: _container,
    hidden: _hidden,
    ...rest
  } = computedSearchFormConfig.value;
  return rest;
});

const computedTableContainer = computed(() => {
  const container =
    props.tableContainer ??
    injectProps.value.tableContainer ??
    DefaultTableContainer;
  return container ? container : undefined;
});

/*
 * 序号列随有效分页偏移：分页关闭时退化为 index + 1；
 * current / pageSize 取有效分页（显式 :pagination 或 Provider 注入），table.pageParam 仅作兜底
 */
const getIndex = (i: number) => {
  const pagination = computedPagination.value;
  if (pagination === false) return i + 1;
  const pageParam = props.table?.pageParam;
  const current = pagination.currentPage ?? pageParam?.current ?? 1;
  const pageSize = pagination.pageSize ?? pageParam?.pageSize ?? 10;
  return (current - 1) * pageSize + i + 1;
};

/** 调用方是否显式传入 columns（值为 undefined 时视为未指定） */
const hasExplicitColumns = computed(() => props.columns !== undefined);

/** 显式列原样透传（key 由调用方提供）；table 列经 core 规范化 */
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
  return props.data ?? toValue(props.table?.data) ?? [];
});

const computedTableProps = computed<TableProps>(() => {
  return {
    ...injectTableAttrs.value,
    ...restTableAttrs.value,
    ...attrsTableProps.value,
  } as TableProps;
});

/*
 * 分页来源：分页开关与展示配置取 props.pagination 显式配置 > provider 全局配置 > 默认合成；
 * currentPage / pageSize / total 以 table.pageParam 为实时状态，显式配置仅在 pageParam 缺省时兜底
 */
const computedPagination = computed<false | Partial<PaginationProps>>(() => {
  if (props.pagination === false) return false;
  if (isPlainObject(props.pagination)) {
    const pageConfig = props.pagination as Partial<PaginationProps>;
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

// pageSize 变更窗口：窗口内忽略宿主级联的 current-change
let sizeChangeWindow = false;

const onCurrentChange = (current: number) => {
  if (sizeChangeWindow) return;
  props.table?.setPageParam?.({ current });
  _search();
};

// 改变 pageSize 时重置回第 1 页并重新查询
const onSizeChange = (pageSize: number) => {
  sizeChangeWindow = true;
  props.table?.setPageParam?.({ pageSize, current: 1 });
  _search();
  nextTick(() => {
    sizeChangeWindow = false;
  });
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
      .length > 0
  );
});

/*
 * 控制项来源：显式控制配置 > Provider 全局配置
 */
const resolvedControl = computed<{
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

/* 显式 columns 模式下渲染源不受 table.setColumn 影响，列控入口隐藏 */
const computedControl = computed(() =>
  hasExplicitColumns.value && resolvedControl.value.columnControl
    ? { ...resolvedControl.value, columnControl: false }
    : resolvedControl.value
);

const columnControlConfig = computed(() => {
  const cc = computedControl.value.columnControl;
  return typeof cc === 'object' ? cc : undefined;
});

// 尺寸来源：size 模型 > provider 全局配置
const resolvedSize = computed(() => {
  return size.value ?? injectProps.value.size;
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
          v-bind="searchFormProps"
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
          <SizeControl v-model:size="size" :effective-size="resolvedSize" />
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
