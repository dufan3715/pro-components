import type { FormProps as _FormProps } from 'ant-design-vue';
import type { Options } from 'scroll-into-view-if-needed';

export {
  theme,
  Form,
  FormItem,
  Row as Grid,
  Col as GridItem,
  Table,
  Space,
  MenuDivider,
  Dropdown,
  Menu,
  MenuItem,
  Checkbox,
  Button,
  Cascader,
  CheckboxGroup,
  DatePicker,
  Input,
  InputNumber,
  InputPassword,
  InputSearch,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Textarea,
  TimePicker,
  Transfer,
  TreeSelect,
  RangePicker,
  type FormItemInstance,
  type FormInstance,
  type CascaderProps,
  type CheckboxGroupProps,
  type RowProps as GridProps,
  type ColProps as GridItemProps,
  type DatePickerProps,
  type FormItemProps,
  type InputNumberProps,
  type InputProps,
  type RadioGroupProps,
  type SelectProps,
  type SliderProps,
  type SwitchProps,
  type TableProps,
  type TextAreaProps,
  type TimePickerProps,
  type TransferProps,
  type TreeSelectProps,
  type PaginationProps,
} from 'ant-design-vue';

export { type ColumnType, tableProps } from 'ant-design-vue/es/table';
export { type RangePickerProps } from 'ant-design-vue/es/date-picker';
export { useConfigContextInject } from 'ant-design-vue/es/config-provider/context';
export {
  useInjectDisabled,
  useProviderDisabled,
} from 'ant-design-vue/es/config-provider/DisabledContext';
export { colProps as gridItemProps } from 'ant-design-vue/es/grid/Col';
export {
  formItemProps,
  useInjectFormItemContext,
} from 'ant-design-vue/es/form';
export { type NamePath } from 'ant-design-vue/es/form/interface';
export { type MenuItemType } from 'ant-design-vue/es/menu/src/interface';

export type FormProps = Omit<_FormProps, 'scrollToFirstError'> & {
  scrollToFirstError?: boolean | Options<any>;
};
