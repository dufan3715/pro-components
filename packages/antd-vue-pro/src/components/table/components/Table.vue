<!-- eslint-disable no-unused-vars -->
<script lang="ts" setup generic="D extends Record<string, any>">
import {
  PaginationProps,
  Table,
  TableProps as ATableProps,
} from 'ant-design-vue';
import { omit } from 'lodash-es';
import { ColumnsType, ColumnType } from 'ant-design-vue/es/table';
import {
  computed,
  nextTick,
  ref,
  unref,
  useSlots,
  useAttrs,
  inject,
  onMounted,
} from 'vue';
import { ContainerFragment, type ContainerComponent } from '../../form';
import {
  SearchForm,
  Control,
  DefaultSearchContainer,
  DefaultControlContainer,
  DefaultTableContainer,
} from '.';
import type {
  Table as TableType,
  UseTable,
  Columns,
  ParamCache,
} from '../types';
import { PRO_TABLE_INJECT_COMPONENT_PROPS_KEYS } from '../constants';

defineOptions({
  name: 'ProTable',
  inheritAttrs: false,
});

// ?? 打包时dts插件抛异常 https://github.com/microsoft/TypeScript/issues/47663
interface TableProps extends ATableProps {
  loading?: boolean;
  showSorterTooltip?: boolean;
}

interface Props extends /* @vue-ignore */ TableProps {
  // 列表表格对象，useTable hook
  table?: ReturnType<UseTable<D>>;
  // 是否在首列插入index列
  addIndexColumn?: boolean;
  // 是否展示搜索区域
  showSearch?: boolean;
  // 是否展示表格设置控制按钮
  showControl?: boolean;
  // 搜索区域包裹容器
  searchContainer?: ContainerComponent | any;
  // 按钮控制区域包裹容器
  controlContainer?: ContainerComponent | any;
  // 表格区域包裹容器
  tableContainer?: ContainerComponent | any;
  // 分页查询参数缓存对象, 传null则禁用参数缓存
  paramCache?: ParamCache | null;
  // onMounted 时立即触发一次search事件
  immediateSearch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  table: undefined,
  addIndexColumn: true,
  showSearch: true,
  showControl: true,
  searchContainer: DefaultSearchContainer,
  controlContainer: DefaultControlContainer,
  tableContainer: DefaultTableContainer,
  paramCache: undefined,
  immediateSearch: false,
});

const injectProps = inject<Record<string, any>>(
  PRO_TABLE_INJECT_COMPONENT_PROPS_KEYS.table
);

const cache =
  props.paramCache === undefined ? injectProps?.paramCache : props.paramCache;

const size = ref(unref(props.size));

const attrs: TableProps = useAttrs();
// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { table = {} } = props
const {
  columns,
  dataSource,
  pagination,
  setPagination,
  checkedColumns,
  searchParam,
  setSearchParam,
} = table as ReturnType<UseTable<D>>;

type Emits = {
  search: [
    param: TableType['searchParam'] &
      Pick<PaginationProps, 'current' | 'pageSize'>
  ];
};
const emit = defineEmits<Emits>();

const search = () => {
  const { current, pageSize } = props.table?.pagination.value || {};
  emit('search', {
    ...props.table?.searchParam.value,
    current,
    pageSize,
  });
  cache?.set((pre = {}) => ({
    ...pre,
    pagination: unref(pagination),
    searchParam: unref(searchParam),
  }));
};

const reset = () => {
  props.table?.resetQueryParams();
  nextTick(() => {
    search();
  });
};

const customSlotNames = ['search', 'buttons', 'table'];
type TableInstance = InstanceType<typeof Table>;
type TableSlots = TableInstance['$slots'];
const slots = useSlots();
const tableSlots = omit(slots, customSlotNames) as TableSlots;

const form = {
  formData: props.table?.searchParam || {},
  fields: props.table?.searchFields || [],
  setFormData: props.table?.setSearchParam,
  setField: props.table?.setSearchField,
};

if (cache) {
  setPagination({
    ...unref(pagination),
    ...unref(cache.get()?.pagination ?? {}),
  });
  setSearchParam(undefined, {
    ...unref(searchParam),
    ...unref(cache.get()?.searchParam ?? {}),
  });
}

const searchPage1st = () => {
  if (props.table) {
    props.table?.setPagination({ ...props.table.pagination.value, current: 1 });
    search();
  }
};

const onPaginationChange = () => {
  nextTick(() => search());
};

const mergeTableProps = computed<TableProps>(() => {
  return {
    ...attrs,
    columns: (attrs.columns ?? columns?.value ?? []).map(
      (item: any, index) => ({
        ...item,
        key: item.key ?? item.dataIndex.toString() ?? index,
      })
    ),
    dataSource: attrs.dataSource ?? dataSource?.value,
    pagination: attrs.pagination ?? {
      showTotal: total => `共 ${total} 条`,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '30', '40', '50', '100', '400'],
      showQuickJumper: true,
      ...pagination?.value,
      'onUpdate:current': onPaginationChange,
      'onUpdate:pageSize': onPaginationChange,
    },
    onChange: table
      ? (...args) => {
          setPagination(args[0]);
          (attrs.onChange as TableProps['onChange'])?.(...args);
        }
      : attrs.onChange,
  };
});

const indexColumn: ColumnType<D> = {
  title: '序号',
  dataIndex: 'index',
  width: 80,
  customRender: ({ index }) => index + 1,
};

const visibleColumns = computed(() => {
  let list = <ColumnsType<D>>[];
  if (!props.table) {
    list = mergeTableProps?.value.columns || [];
  } else {
    list =
      mergeTableProps.value.columns?.filter(
        item => item.key && checkedColumns.value.includes(item.key as any)
      ) || [];
  }
  if (props.addIndexColumn) {
    list = [indexColumn, ...list];
  }
  return list;
});

onMounted(() => {
  if (props.immediateSearch) {
    search();
  }
});
</script>

<template>
  <div class="pro-table" :style="($attrs.style as any)">
    <ContainerFragment v-if="showSearch" :component="searchContainer">
      <slot v-if="Object.hasOwn($slots, 'search')" name="search" />
      <SearchForm
        v-else
        :form="(form as any)"
        @search="searchPage1st"
        @reset="reset" />
    </ContainerFragment>

    <ContainerFragment v-if="showControl" :component="controlContainer">
      <div v-if="Object.hasOwn($slots, 'buttons')" style="flex: 1">
        <slot name="buttons" />
      </div>

      <Control
        v-if="showControl"
        v-model:size="size"
        style="align-self: flex-end"
        :columns="mergeTableProps.columns as Columns<D>"
        :table="table" />
    </ContainerFragment>

    <ContainerFragment :component="tableContainer">
      <slot v-if="Object.hasOwn($slots, 'table')" name="table" />
      <Table
        v-else
        v-bind="mergeTableProps"
        :columns="visibleColumns"
        class="base-table"
        :size="size">
        <template
          v-for="(slot, name) of tableSlots"
          :key="name"
          #[name]="scoped">
          <slot :name="name" v-bind="scoped" />
        </template>
      </Table>
    </ContainerFragment>
  </div>
</template>

<style scoped lang="less">
.pro-table {
  display: flex;
  flex-direction: column;
  min-width: 800px;

  :deep {
    .ant-pagination {
      .ant-pagination-total-text {
        flex: 1;
      }
    }
  }
}
</style>
