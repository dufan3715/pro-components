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
 *   └── ATable (ant-design-vue Table)
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
 * @param {boolean | Partial<Control>} [control] - 是否展示尺寸与列控制按钮；显式传入 columns 时列控入口不渲染
 * @param {SearchFormConfig} [searchFormConfig] - 搜索栏查询字段表单配置
 * @param {ContainerComponent | false} [tableContainer] - 表格区域包裹容器
 *
 * @slot search-form - 搜索区域插槽，作用域参数 form / search / reset
 * @slot button-bar - 表格头部按钮区插槽
 * @slot toolbar - 工具栏插槽
 * @slot default - 透传给宿主表格的默认插槽（可用于以宿主列组件声明列）
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
  omitBy,
  pick,
  useReactiveAttrs,
} from '../../../shared/core';
import type { ComponentSlots } from 'vue-component-type-helpers';
import DefaultSearchFormContainer from './DefaultSearchFormContainer.vue';
import DefaultTableContainer from './DefaultTableContainer.vue';
import SizeControl from './SizeControl.vue';
import ColumnControl from './ColumnControl.vue';
import type { Column, Columns, ColumnControlConfig } from '../types';

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
  /** 列表表格对象，来自 `useTable` */
  table?: T;
  /** 列表数据查询方法 */
  search?: () => Promise<unknown>;
  /** 是否在首列插入序号列 */
  addIndexColumn?: boolean;
  /** 挂载后是否立即触发一次查询 */
  immediateSearch?: boolean;
  /** 是否展示尺寸与列控制按钮；显式传入 columns 时列控入口不渲染 */
  control?: boolean | Partial<Control>;
  /** 搜索栏查询字段表单配置 */
  searchFormConfig?: SearchFormConfig;
  /** 表格区域包裹容器 */
  tableContainer?: ContainerComponent | false;
} & /* @vue-ignore */ TableProps;

const props = withDefaults(defineProps<Props>(), {
  table: undefined,
  search: undefined,
  addIndexColumn: undefined,
  immediateSearch: undefined,
  control: undefined,
  searchFormConfig: undefined,
  tableContainer: undefined,
});

const { t } = useLocale();

const config = INJECT_CONFIG['pro-table'];
const injectPropsRaw = inject(config.injectionKey, config.default);
const injectProps = computed(() => toValue(injectPropsRaw) || {});

/* Provider 注入的不可注入键（columns / dataSource / loading）已在注入层剔除，此处直接取用其注入属性 */
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

/** SearchForm 属性面：容器与显隐由 ProTable 自身消费，不下发 SearchForm */
const searchFormProps = computed(() => {
  const {
    container: _container,
    hidden: _hidden,
    ...rest
  } = computedSearchFormConfig.value;
  return rest;
});

const attrs: Record<string, any> = useReactiveAttrs();

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
  'customFilterDropdown',
  'customFilterIcon',
]);

/**
 * 判定插槽在当前渲染状态下是否可渲染。
 *
 * @description
 * 依赖列信息的插槽（`bodyCell` / `headerCell` / `customFilterDropdown` / `customFilterIcon`）仅在存在可见列且作用域中存在 `column` 时渲染；
 * 非列依赖的表格级插槽（如 `emptyText`、`footer`、`summary` 等）始终渲染。
 *
 * @param name - 插槽名
 * @param scoped - 插槽作用域参数
 * @returns 该插槽是否参与渲染
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

/** 调用方是否显式绑定该 prop（含 kebab-case 与 v-model 写法） */
const isBoundProp = (name: string) => {
  const vnodeProps = instance?.vnode.props || {};
  const kebab = name.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
  return (
    name in vnodeProps ||
    kebab in vnodeProps ||
    `onUpdate:${name}` in vnodeProps
  );
};

/** attrs 的驼峰视图：模板中以 kebab-case 写法的绑定键在此归一 */
const camelAttrs = computed<Record<string, any>>(() =>
  camelizeProperties(attrs)
);

/*
 * 组件自有键取值：`Props` 中声明的键取 prop，其余宿主键取 attrs（模板 kebab-case 绑定经归一后同键）；
 * 均以调用方显式绑定为唯一来源，未绑定时不取值（留给 Provider 注入兜底）
 */
const resolveOwnedProp = (name: string) => {
  const attrValue = camelAttrs.value[name];
  return isBoundProp(name)
    ? ((props as Record<string, any>)[name] ?? attrValue)
    : attrValue;
};

/** 调用方是否显式传入 columns（prop 或 attrs 形态，值为 undefined 时视为未指定） */
const hasExplicitColumns = computed(
  () => resolveOwnedProp('columns') !== undefined
);

/*
 * 表格尺寸单一来源：本地模型（显式绑定或 SizeControl 回写）> Provider 注入；
 * 本地模型为 undefined 时视为未指定，Provider 注入值继续生效
 */
const effectiveSize = computed<TableProps['size']>(() => {
  return size.value ?? injectAttrs.value.size;
});

/*
 * 下发给宿主表格的属性：Provider 注入为底（其不可注入键已在注入层剔除），调用方绑定与 v-model 透传值覆盖同键。
 * size / loading 为声明模型，其 onUpdate:* 回写通道不进入 attrs，无需另行剔除
 */
const computedTableProps = computed<TableProps>(() => {
  const merged = {
    ...injectAttrs.value,
    ...omitBy(
      pick(camelAttrs.value, tableProperties),
      value => value === undefined
    ),
  } as Record<string, any>;
  // onChange 由模板监听器收口，散落 attrs 中的同名监听器并入会形成重复回调
  delete merged.onChange;
  merged.size = effectiveSize.value;
  merged.loading = undefined;
  return merged as TableProps;
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
 * 序号列随有效分页偏移：分页关闭时退化为 index + 1；
 * current / pageSize 取有效分页（显式 :pagination 或 Provider 注入），table.pageParam 仅作兜底
 */
const getIndex = (i: number) => {
  const pagination = computedPagination.value;
  if (pagination === false) return i + 1;
  const pageParam = props.table?.pageParam;
  const current = pagination.current ?? pageParam?.current ?? 1;
  const pageSize = pagination.pageSize ?? pageParam?.pageSize ?? 10;
  return (current - 1) * pageSize + i + 1;
};

const indexColumn = computed<ColumnType>(() => ({
  title: t('table.index'),
  dataIndex: '__INDEX__',
  key: '__INDEX__',
  width: 80,
  customRender: ({ index }) => getIndex(index),
}));

// 列来源优先级：显式绑定 > table 实例（useTable 创建的 columns）
const computedColumns = computed<Columns<RecordType>>(() => {
  const cols = (resolveOwnedProp('columns') ??
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
  columns: any[],
  ancestors: Set<object> = new Set()
): { list: any[]; changed: boolean } => {
  const list: any[] = [];
  let changed = false;
  for (const column of columns) {
    if (!isObjectItem(column) || toValue((column as Column).hidden)) {
      changed = true;
      continue;
    }
    if (Array.isArray(column.children) && column.children.length > 0) {
      // 环状分组列不再深入，重复出现的祖先引用直接剔除
      if (ancestors.has(column)) {
        changed = true;
        continue;
      }
      ancestors.add(column);
      const filtered = filterVisibleColumns(column.children, ancestors);
      ancestors.delete(column);
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

// 数据源优先级：显式绑定 > table 实例（useTable 创建的 dataSource）
const computedDataSource = computed<RecordType[]>(() => {
  return (
    resolveOwnedProp('dataSource') ?? toValue(props.table?.dataSource) ?? []
  );
});

/*
 * 分页优先级：显式绑定 > provider 全局配置 > 默认合成；
 * provider 作为基础配置与 table.pageParam 合并，显式绑定的对象形态在其之上覆盖
 */
const computedPagination = computed<PaginationProps | false>(() => {
  const attrsPagination = resolveOwnedProp('pagination') as
    | PaginationProps
    | false
    | undefined;
  if (attrsPagination === false) return false;
  if (isPlainObject(attrsPagination)) {
    const globalPagination =
      injectAttrs.value.pagination === false
        ? {}
        : injectAttrs.value.pagination;
    return {
      ...globalPagination,
      ...props.table?.pageParam,
      ...attrsPagination,
      showTotal:
        attrsPagination?.showTotal ??
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
  const searchFields = props.table?.searchForm?.fields;
  const fieldList =
    (Array.isArray(searchFields) ? searchFields : searchFields?.value) ?? [];
  return !!(
    computedSearchFormConfig.value?.hidden !== true &&
    props.table?.searchForm &&
    fieldList.filter(item => isObjectItem(item) && !toValue(item.hidden))
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
      <slot
        name="search-form"
        v-bind="{ form: props.table?.searchForm, search: searchPage1st, reset }"
      >
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
          <SizeControl v-model:size="size" :effective-size="effectiveSize" />
        </div>
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

      <slot
        name="table"
        v-bind="{
          columns: visibleComputedColumns,
          dataSource: computedDataSource,
          pagination: computedPagination,
          loading: loading,
          size: effectiveSize,
          onChange: onTableChange,
        }"
      >
        <ATable
          class="pro-table_content"
          v-bind="computedTableProps"
          :loading="loading"
          :columns="visibleComputedColumns"
          :data-source="computedDataSource"
          :pagination="computedPagination"
          @change="onTableChange"
        >
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
