import {
  ElForm as Form,
  ElFormItem as FormItem,
  ElRow as Grid,
  ElCol as GridItem,
  ElTable as Table,
  ElTableColumn as TableColumn,
  ElSpace as Space,
  ElDropdown as Dropdown,
  ElDropdownMenu as DropdownMenu,
  ElDropdownItem as DropdownItem,
  ElCheckbox as Checkbox,
  ElCheckboxGroup as CheckboxGroup,
  ElButton as Button,
  ElAutocomplete as AutoComplete,
  ElCascader as Cascader,
  ElDatePicker as DatePicker,
  ElInput as Input,
  ElInputNumber as InputNumber,
  ElSelect as Select,
  ElSlider as Slider,
  ElSwitch as Switch,
  ElTransfer as Transfer,
  ElTreeSelect as TreeSelect,
  ElRadioGroup as RadioGroup,
  ElTimePicker as TimePicker,
  ElTimeSelect as TimeSelect,
  ElPagination as Pagination,
  useFormDisabled,
  type FormItemInstance,
  type FormInstance,
  type FormProps,
  type FormItemProps,
  type TableProps as _TableProps,
  type TableColumnCtx as ColumnType,
  type PaginationProps,
  type RowProps as GridProps,
  type ColProps as GridItemProps,
} from 'element-plus';
import { type MaybeRefOrGetter, computed, inject, provide, toValue } from 'vue';

export {
  Form,
  FormItem,
  Grid,
  GridItem,
  Table,
  TableColumn,
  Space,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Checkbox,
  CheckboxGroup,
  Button,
  AutoComplete,
  Cascader,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Slider,
  Switch,
  Transfer,
  TreeSelect,
  RadioGroup,
  TimePicker,
  TimeSelect,
  Pagination,
  type FormItemInstance,
  type FormInstance,
  type FormProps,
  type FormItemProps,
  type PaginationProps,
  type GridProps,
  type GridItemProps,
  type ColumnType,
};

export type TableProps = _TableProps<any>;

export const tableProps = () => (Table as any).props || {};
export const paginationProps = () => (Pagination as any).props || {};
export const gridItemProps = () => (GridItem as any).props || {};
export const formItemProps = () => (FormItem as any).props || {};

const DisabledContextKey = Symbol('pro-form-disabled-context');

export const useDisabledContext = () => {
  const formDisabled = useFormDisabled();
  return inject(
    DisabledContextKey,
    computed(() => !!formDisabled.value)
  );
};

export const useDisabledContextProvider = (
  disabled: MaybeRefOrGetter<boolean | undefined>
) => {
  provide(
    DisabledContextKey,
    computed(() => !!toValue(disabled))
  );
};

export type NamePath = string | number | (string | number)[];
