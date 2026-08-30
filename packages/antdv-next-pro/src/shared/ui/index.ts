import { Col, Table, FormItem } from 'antdv-next';
import type { ComponentProps } from 'vue-component-type-helpers';

export {
  theme,
  useConfig,
  Form,
  FormItem,
  Row as Grid,
  Col as GridItem,
  Table,
  Space,
  Dropdown,
  Menu,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Button,
  AutoComplete,
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
  type FormProps,
  type FormItemProps,
  type FormInstance,
  type TableProps,
  type PaginationProps,
  type RowProps as GridProps,
  type ColProps as GridItemProps,
  type TableColumnType as ColumnType,
} from 'antdv-next';

export type FormItemInstance = InstanceType<typeof FormItem>;

const _tableProps = (Table as any).props || {};
const _gridItemProps = (Col as any).props || {};
const _formItemProps = (FormItem as any).props || {};

export const tableProps = () => _tableProps;
export const gridItemProps = () => _gridItemProps;
export const formItemProps = () => _formItemProps;

// 补齐导出 TableProps 缺失的 onChange/onExpand 等事件处理器成员
export type TableComponentProps = ComponentProps<typeof Table>;

export {
  useDisabledContext,
  useDisabledContextProvider,
} from 'antdv-next/dist/config-provider/DisabledContext';

export type NamePath = string | number | (string | number)[];
