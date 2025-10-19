<script lang="ts" setup generic="T extends Table<any> = Table">
import {
  PaginationProps,
  Table as UITable,
  TableProps,
  ColumnType,
  tableProps,
} from '../../../shared/ui';
import {
  computed,
  nextTick,
  useAttrs,
  onMounted,
  CSSProperties,
  inject,
  type Slot,
} from 'vue';
import { INJECT_CONFIG } from '../../component-provider';
import { ContainerFragment, type ContainerComponent } from '../../form';
import SearchForm from './SearchForm.vue';
import { SearchFormProps } from './SearchForm.vue';
import type { Table } from '../hooks';
import { camelizeProperties, getObject, pick } from '../../../shared/utils';
import { useModel } from '../../../shared/hooks';
import { ComponentSlots } from 'vue-component-type-helpers';
import {
  DefaultSearchFormContainer,
  DefaultTableContainer,
  SizeControl,
  ColumnControl,
} from '.';
import { Column } from '../types';

defineOptions({ name: 'ProTable', inheritAttrs: false });

type Control = { sizeControl: boolean; columnControl: boolean };

type SearchFormConfig = Omit<SearchFormProps, 'form'> & {
  // 是否隐藏搜索表单
  hidden?: boolean;
  // 搜索区域包裹容器
  container?: ContainerComponent;
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
  tableContainer?: ContainerComponent;
} & /* @vue-ignore */ TableProps;

const props = withDefaults(defineProps<Props>(), {
  table: undefined,
  search: undefined,
  addIndexColumn: undefined,
  control: undefined,
  tableContainer: DefaultTableContainer,
  immediateSearch: undefined,
  searchFormConfig: undefined,
});

const config = INJECT_CONFIG['pro-table'];
const injectProps = inject(config.injectionKey, config.default);

const tableProperties = Object.keys(tableProps());

const injectAttrs = pick(injectProps, tableProperties) as TableProps;

const computedSearchFormConfig = computed(() => {
  return {
    container: DefaultSearchFormContainer,
    ...injectProps.searchFormConfig,
    ...getObject(props.searchFormConfig),
  };
});

const attrs: Record<string, any> = useAttrs();
const tableAttrs = computed<TableProps>(() => {
  return pick(camelizeProperties(attrs), tableProperties);
});

const { columns, dataSource, searchForm, pageParam, setPageParam } =
  props.table || {};

const size = useModel<TableProps['size']>(attrs, 'size');
const loading = useModel<boolean>(attrs, 'loading');

const _search = async () => {
  try {
    loading.value = true;
    await props.search?.();
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  props.table?.resetQueryParams();
  nextTick(() => {
    _search();
  });
};

type CustomSlots = Partial<
  Record<'search-form' | 'button-bar' | 'toolbar' | 'table', Slot>
>;
type Slots = Omit<ComponentSlots<typeof UITable> & CustomSlots, 'default'>;
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
  return { ...injectAttrs, ...tableAttrs.value, onChange: undefined };
});

type ReturnGenericParameterTypes<V> = V extends Table<infer U> ? U : never;
type RecordType = ReturnGenericParameterTypes<T>;

const indexColumn: ColumnType = {
  title: '序号',
  dataIndex: '_index',
  width: 80,
  customRender: ({ index }) => index + 1,
};

const computedColumns = computed(() => [
  ...((props.addIndexColumn ?? injectProps.addIndexColumn)
    ? [indexColumn]
    : []),
  ...(tableAttrs.value.columns ?? columns?.value ?? []).flatMap(
    (item: ColumnType<RecordType>, index) => {
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
]);

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

const onTableChange: TableProps['onChange'] = (...args) => {
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
  const control = props.control ?? injectProps.control;
  const sizeControl = (control as Control)?.sizeControl ?? control;
  const columnControl = (control as Control)?.columnControl ?? control;
  return { sizeControl, columnControl };
});

onMounted(() => {
  if (props.immediateSearch ?? injectProps.immediateSearch) {
    _search();
  }
});
</script>

<template>
  <div
    class="pro-table"
    :class="$attrs.class"
    :style="$attrs.style as CSSProperties"
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

    <ContainerFragment :component="tableContainer">
      <div class="pro-table-header">
        <div v-if="buttonBarSlot" style="flex: 1">
          <slot name="button-bar" />
        </div>
        <div v-if="toolbarSlot" style="margin-left: 12px">
          <slot name="toolbar" />
        </div>
        <div v-if="computedControl.sizeControl">
          <SizeControl v-model:size="size" />
        </div>
        <div v-if="computedControl.columnControl">
          <ColumnControl
            :columns="computedColumns as unknown as any"
            :table="props.table"
          />
        </div>
      </div>

      <slot name="table">
        <UITable
          class="pro-table-content"
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
        </UITable>
      </slot>
    </ContainerFragment>
  </div>
</template>

<style scoped lang="less">
.pro-table {
  .pro-table-header {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    &:empty {
      display: none;
    }

    & + .pro-table-content {
      margin-top: 16px;
    }
  }

  :deep(.ant-pagination) {
    .ant-pagination-total-text {
      flex: 1;
    }
  }
}
</style>
