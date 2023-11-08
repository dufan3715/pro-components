import { PaginationProps } from 'ant-design-vue';
import { ref } from 'vue';
import { useForm } from '../../form/hooks';
import { UseTable } from '../types';

const getDefaultPagination = () => ({ current: 1, pageSize: 10, total: 0 });

const useTable = (({
  columns: initColumns = [],
  dataSource: initDataSource = [],
  checkedColumns: initCheckedColumns = undefined,
  pagination: initPagination = {},
  searchParam: initSearchParam = getDefaultPagination(),
  searchFields: initSearchFields = [],
}) => {
  // 表格columns
  const columns = ref(initColumns);

  // 表格数据
  const dataSource = ref(initDataSource);

  // 选中的列
  const checkedColumns = ref(
    initCheckedColumns ??
      columns.value.map(
        (item: any, index) => item.key ?? item.dataIndex?.toString() ?? index
      )
  );

  // 修改选中的列
  const setCheckedColumns = (val: Array<string>) => {
    checkedColumns.value = val;
  };

  // 分页参数
  const pagination = ref(initPagination);

  // 修改分页参数
  const setPagination = (val: PaginationProps) => {
    pagination.value = val;
  };

  const { formData, fields, setFormData, setField } = useForm(
    initSearchParam as any,
    initSearchFields
  );

  // 查询参数
  const searchParam = formData;

  // 查询字段
  const searchFields = fields;

  // 修改查询参数
  const setSearchParam = setFormData;

  // 修改查询字段
  const setSearchField = setField;

  // 重置分页查询参数
  const resetQueryParams = () => {
    setPagination(getDefaultPagination());
    setSearchParam(undefined, {});
  };

  return {
    columns,
    dataSource,
    pagination,
    checkedColumns,
    searchParam,
    setSearchParam,
    searchFields,
    setSearchField,
    setCheckedColumns,
    setPagination,
    resetQueryParams,
  };
}) as UseTable;

export default useTable;
