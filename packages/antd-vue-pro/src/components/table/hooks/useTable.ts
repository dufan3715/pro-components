import { PaginationProps } from 'ant-design-vue';
import { ref, unref, watch } from 'vue';
import { cloneDeep } from 'lodash-es';
import { useForm } from '../../form/hooks';
import { UseTable } from '../types';

const getDefaultPagination = () => ({ current: 1, pageSize: 10, total: 0 });

const useTable: UseTable = ({
  columns: initColumns = [],
  dataSource: initDataSource = [],
  showColumnKeys: initShowColumnKeys = undefined,
  pagination: initPagination = getDefaultPagination(),
  searchParam: initSearchParam = {},
  searchFields: initSearchFields = [],
}) => {
  const _initSearchParam = cloneDeep(unref(initSearchParam));

  // 表格columns
  const columns = ref(initColumns);

  // 表格数据
  const dataSource = ref<any>(initDataSource);

  // 选中的列
  const showColumnKeys = ref(
    initShowColumnKeys ??
      columns.value.map(
        (item: any, index) => item.key ?? item.dataIndex?.toString() ?? index
      )
  );

  watch(columns, val => {
    showColumnKeys.value = val.map(
      (item: any, index) => item.key ?? item.dataIndex?.toString() ?? index
    );
  });

  // 修改选中的列
  const setShowColumnKeys = (val: Array<string>) => {
    showColumnKeys.value = val;
  };

  // 分页参数
  const pagination = ref<PaginationProps>(initPagination);

  // 修改分页参数
  const setPagination = (val: PaginationProps) => {
    pagination.value = val;
  };

  const {
    formData: searchParam,
    fields: searchFields,
    setFormData: setSearchParam,
    setField: setSearchField,
  } = useForm(initSearchParam as any, initSearchFields, true);

  // 重置分页查询参数
  const resetQueryParams = () => {
    setPagination(getDefaultPagination());
    setSearchParam(cloneDeep(_initSearchParam));
  };

  return {
    columns,
    dataSource,
    pagination,
    showColumnKeys,
    searchParam,
    setSearchParam,
    searchFields,
    setSearchField,
    setShowColumnKeys,
    setPagination,
    resetQueryParams,
  } as any;
};

export default useTable;
