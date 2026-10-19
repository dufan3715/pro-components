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

/** 宿主 Table 属性面（放宽泛型以兼容任意行数据） */
export type TableProps = _TableProps<any>;

const _tableProps = (Table as any).props || {};
const _paginationProps = (Pagination as any).props || {};
const _gridItemProps = (GridItem as any).props || {};
const _formItemProps = (FormItem as any).props || {};

/** 宿主 Table 的静态 props 快照（透传键名白名单用） */
export const tableProps = () => _tableProps;
/** 宿主 Pagination 的静态 props 快照（分页配置键名白名单用） */
export const paginationProps = () => _paginationProps;
/** 宿主 Row/Col 的静态 props 快照 */
export const gridItemProps = () => _gridItemProps;
/** 宿主 FormItem 的静态 props 快照 */
export const formItemProps = () => _formItemProps;

const DisabledContextKey = Symbol.for('pro-form-disabled-context');

/** 禁用上下文取值
 *
 * @description 字段级禁用优先，未声明时回退宿主 `el-form` 的禁用状态
 * @returns {ComputedRef<boolean>} 当前生效的禁用状态
 */
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

/** 禁用上下文提供者
 *
 * @description 与父级禁用上下文合并：未声明时保持继承，声明时（含 false）覆盖
 * @param {MaybeRefOrGetter<boolean | undefined>} disabled - 本层声明的禁用状态
 */
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

/** {@link useDisabledContext} 的别名 */
export const useInjectDisabled = useDisabledContext;
/** {@link useDisabledContextProvider} 的别名 */
export const useProviderDisabled = useDisabledContextProvider;

/** 字段路径：字符串、数字或分段数组 */
export type NamePath = string | number | (string | number)[];
