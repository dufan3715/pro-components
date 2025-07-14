<!-- eslint-disable no-unused-vars -->
<script lang="ts" setup>
import {
  PaginationProps,
  Table,
  TableProps as ATableProps,
} from 'ant-design-vue';
import { cloneDeep, omit } from 'lodash-es';
import { ColumnsType, ColumnType } from 'ant-design-vue/es/table';
import {
  computed,
  nextTick,
  ref,
  unref,
  useAttrs,
  onMounted,
  CSSProperties,
  toValue,
} from 'vue';
import { INJECT_KEYS, useInjectProps } from '../../component-provider';
import { ContainerFragment, type ContainerComponent } from '../../form';
import {
  SearchForm,
  Control,
  DefaultSearchContainer,
  DefaultControlContainer,
  DefaultTableContainer,
} from '.';
import type { Table as TableType, UseTable, ParamCache } from '../types';

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
  table?: ReturnType<UseTable>;
  // 是否在首列插入index列
  addIndexColumn?: boolean;
  // 是否展示表格设置控制按钮
  showControl?: boolean;
  // 搜索区域包裹容器
  searchContainer?: ContainerComponent;
  // 按钮控制区域包裹容器
  controlContainer?: ContainerComponent;
  // 表格区域包裹容器
  tableContainer?: ContainerComponent;
  // 分页查询参数缓存对象, 传null则禁用参数缓存
  paramCache?: ParamCache | null;
  // onMounted 时立即触发一次search事件
  immediateSearch?: boolean;
  // 搜索栏查询字段表单配置
  searchFormConfig?: {
    // 布局 网格 ｜ 行内
    layout?: 'grid' | 'inline';
    // 网格布局时默认展开行数量
    minExpandRows?: number;
    // 网格布局时默认展开状态
    defaultExpandStatus?: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  table: undefined,
  addIndexColumn: true,
  showControl: true,
  searchContainer: DefaultSearchContainer,
  controlContainer: DefaultControlContainer,
  tableContainer: DefaultTableContainer,
  paramCache: undefined,
  immediateSearch: false,
  searchFormConfig: undefined,
});

const injectProps = useInjectProps(INJECT_KEYS['pro-table']);
const injectAttrs = omit(injectProps, Object.keys(props));

const cache =
  props.paramCache === null
    ? null
    : props.paramCache ?? injectProps?.paramCache;

const size = ref(unref(props.size ?? injectProps.size));

const showControl = props.showControl ?? injectProps.showControl;

const searchFormConfig = {
  ...injectProps.searchFormConfig,
  ...props.searchFormConfig,
};

const attrs: TableProps = useAttrs();
const { table = {} } = props;
const {
  columns,
  dataSource,
  pagination,
  setPagination,
  showColumnKeys,
  searchParam,
  setSearchParam,
} = table as ReturnType<UseTable>;

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
  cache?.set((pre = {}) =>
    cloneDeep({
      ...pre,
      pagination: unref(pagination),
      searchParam: unref(searchParam),
    })
  );
};

const reset = () => {
  props.table?.resetQueryParams();
  nextTick(() => {
    search();
  });
};

type TableInstance = InstanceType<typeof Table>;
type TableSlots = TableInstance['$slots'];
type CustomSlots = {
  search(): any;
  buttons(): any;
  table(): any;
};
const slots = defineSlots<CustomSlots & TableSlots>();

const tableSlots = omit(slots, ['search', 'buttons', 'table']);

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
  setSearchParam({
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

const mergeTableProps = computed<TableProps>(() => {
  return {
    ...injectAttrs,
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
      pageSizeOptions: ['10', '20', '30', '40', '50', '100'],
      showQuickJumper: true,
      ...pagination?.value,
    },
    onChange: table
      ? (...args) => {
          setPagination(args[0]);
          (attrs.onChange as TableProps['onChange'])?.(...args);
          search();
        }
      : attrs.onChange,
  };
});

const indexColumn: ColumnType = {
  title: '序号',
  dataIndex: 'index',
  width: 80,
  customRender: ({ index }) => index + 1,
};

const visibleColumns = computed(() => {
  let list = <ColumnsType>[];
  if (!props.table) {
    list = mergeTableProps?.value.columns || [];
  } else {
    list =
      mergeTableProps.value.columns?.filter(
        item => item.key && showColumnKeys.value.includes(item.key as string)
      ) || [];
  }
  if (props.addIndexColumn ?? injectProps.addIndexColumn) {
    list = [indexColumn, ...list];
  }
  return list;
});

const showSearch = computed(() => toValue(form.fields).length > 0);

onMounted(() => {
  if (props.immediateSearch ?? injectProps.immediateSearch) {
    search();
  }
});
</script>

<template>
  <div class="pro-table" :style="($attrs.style as CSSProperties)">
    <ContainerFragment v-if="showSearch" :component="searchContainer">
      <slot name="search">
        <SearchForm
          :form="(form as any)"
          :cache="cache"
          v-bind="searchFormConfig"
          @search="searchPage1st"
          @reset="reset" />
      </slot>
    </ContainerFragment>

    <ContainerFragment
      v-if="showControl || Object.hasOwn($slots, 'buttons')"
      :component="controlContainer">
      <div v-if="Object.hasOwn($slots, 'buttons')" style="flex: 1">
        <slot name="buttons" />
      </div>

      <Control
        v-if="showControl"
        v-model:size="size"
        :columns="(mergeTableProps as any).columns"
        :table="table" />
    </ContainerFragment>

    <ContainerFragment :component="tableContainer">
      <slot name="table">
        <Table
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
      </slot>
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
