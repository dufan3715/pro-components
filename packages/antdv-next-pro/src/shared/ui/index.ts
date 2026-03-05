import { Col, Row, Table, FormItem } from 'antdv-next';

export {
  theme,
  useConfig,
  Form,
  FormItem,
  Row as Grid,
  Col as GridItem,
  Table,
  Space,
  MenuDivider,
  Dropdown,
  Menu,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Button,
  Cascader,
  DatePicker,
  DateRangePicker as RangePicker,
  Input,
  InputOTP,
  TextArea,
  InputPassword,
  InputNumber,
  InputSearch,
  Select,
  Slider,
  Switch,
  TimePicker,
  TimeRangePicker,
  Transfer,
  TreeSelect,
  type TextAreaProps,
  type FormProps,
  type FormItemProps,
  type FormInstance,
  type CascaderProps,
  type CheckboxGroupProps,
  type DatePickerProps,
  type RangePickerProps,
  type InputNumberProps,
  type InputProps,
  type InputOTPProps,
  type RadioGroupProps,
  type SelectProps,
  type SliderProps,
  type SwitchProps,
  type TableProps,
  type TimePickerProps,
  type TimeRangePickerProps,
  type TransferProps,
  type TreeSelectProps,
  type PaginationProps,
  type RowProps as GridProps,
  type ColProps as GridItemProps,
  type TableColumnType as ColumnType,
  type CascaderSlots,
  type DatePickerSlots,
  type InputPasswordProps,
  type InputSearchProps,
  type InputSlots,
  type SelectSlots,
  type SwitchSlots,
  type TransferSlots,
  type TreeSelectSlots,
  type MonthPickerProps,
  type WeekPickerProps,
} from 'antdv-next';

export type FormItemInstance = InstanceType<typeof FormItem>;
export const tableProps = () => (Table as any).props || {};
export const colProps = () => (Col as any).props || {};
export const gridItemProps = () => (Row as any).props || {};
export const formItemProps = () => (FormItem as any).props || {};

export {
  useDisabledContext,
  useDisabledContextProvider,
} from 'antdv-next/dist/config-provider/DisabledContext';

export {
  useSizeContext,
  useSizeProvider,
} from 'antdv-next/dist/config-provider/SizeContext';

export type NamePath = string | number | (string | number)[];

export type { TextAreaSlots } from 'antdv-next/dist/input/TextArea';
export type { PasswordSlots } from 'antdv-next/dist/input/Password';
export type { OPTSlots } from 'antdv-next/dist/input/OTP/index';
export type { SearchSlots } from 'antdv-next/dist/input/Search';
export type { InputNumberSlots } from 'antdv-next/dist/input-number/index';
export type { SliderSlots } from 'antdv-next/dist/slider/index';
export type { TimePickerSlots } from 'antdv-next/dist/time-picker/index';
export type { RangePickerSlots } from 'antdv-next/dist/date-picker/generatePicker/generateRangePicker';
