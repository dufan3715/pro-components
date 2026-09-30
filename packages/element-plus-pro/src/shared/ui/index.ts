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
  type TableEmits,
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
  type TableEmits,
};

export type TableProps = _TableProps<any>;

const _tableProps = (Table as any).props || {};
const _paginationProps = (Pagination as any).props || {};
const _gridItemProps = (GridItem as any).props || {};
const _formItemProps = (FormItem as any).props || {};

export const tableProps = () => _tableProps;
export const paginationProps = () => _paginationProps;
export const gridItemProps = () => _gridItemProps;
export const formItemProps = () => _formItemProps;

const DisabledContextKey = Symbol.for('pro-form-disabled-context');

export const useDisabledContext = () => {
  const formDisabled = useFormDisabled();
  const customDisabled = inject<MaybeRefOrGetter<boolean | undefined>>(
    DisabledContextKey,
    undefined
  );
  return computed(() => {
    const custom = toValue(customDisabled);
    if (custom !== undefined) return Boolean(custom);
    return Boolean(formDisabled.value);
  });
};

export const useDisabledContextProvider = (
  disabled: MaybeRefOrGetter<boolean | undefined>
) => {
  // 与父级禁用上下文合并：未声明时保持继承，声明时（含 false）覆盖
  const parentDisabled = useDisabledContext();
  provide(
    DisabledContextKey,
    computed(() => toValue(disabled) ?? parentDisabled.value)
  );
};

export const useInjectDisabled = useDisabledContext;
export const useProviderDisabled = useDisabledContextProvider;

export type NamePath = string | number | (string | number)[];
