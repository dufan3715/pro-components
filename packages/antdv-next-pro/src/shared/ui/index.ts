import { Col, Table, FormItem } from 'antdv-next';
import type { TableProps } from 'antdv-next';
import type { ComponentProps } from 'vue-component-type-helpers';

export {
  theme,
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

/**
 * 读取宿主组件上下文（禁用 / 尺寸）
 *
 * @description 返回宿主 antdv-next 组件上下文中的 `componentDisabled` 与 `componentSize`
 * 响应式引用；与 locale 模块读取 ConfigProvider locale 的宿主配置读取函数语义不同。
 */
export { useConfig as useHostConfig } from 'antdv-next';

const _gridItemProps = (Col as any).props || {};
const _formItemProps = (FormItem as any).props || {};

export const gridItemProps = () => _gridItemProps;
export const formItemProps = () => _formItemProps;

/*
 * 宿主 Table 事件型透传键：由宿主 emits（change / scroll / update:expandedRowKeys）推导，
 * 宿主未暴露 emits 时使用内置清单，模板中的 @change / @scroll / v-model:expanded-row-keys
 * 均以这些键名进入 attrs
 */
const TABLE_EMIT_PROP_KEYS = (() => {
  const emits = (Table as any).emits;
  const names: string[] = Array.isArray(emits)
    ? emits
    : Object.keys(emits || {});
  return names.length > 0
    ? names.map(name => `on${name.charAt(0).toUpperCase()}${name.slice(1)}`)
    : ['onChange', 'onScroll', 'onUpdate:expandedRowKeys'];
})();

/** 宿主 Table 静态 props 缺失时的告警去重位 */
let warnedTablePropsFallback = false;

const toPropRecord = (keys: string[]): Record<string, any> =>
  Object.fromEntries(keys.map(key => [key, undefined]));

/**
 * 宿主 Table 的透传属性记录
 *
 * @description 返回宿主静态 props 与事件型键构成的属性记录；宿主未暴露静态 props 时
 * 返回空记录并输出一次开发期告警，调用方此时不对透传键做键名限定。
 */
export const tableProps = (): Record<string, any> => {
  const snapshot = (Table as any).props || {};
  const keys = Object.keys(snapshot);
  if (keys.length > 0) {
    return { ...snapshot, ...toPropRecord(TABLE_EMIT_PROP_KEYS) };
  }

  if (!warnedTablePropsFallback) {
    warnedTablePropsFallback = true;
    console.warn(
      '[pro-components] 宿主 Table 未暴露静态 props，表格属性不做键名限定，全量透传给宿主表格。'
    );
  }
  return {};
};

/** TableProps 未声明的 emit 型属性（事件处理器），键名对应宿主 Table 的 emits */
export type TableEmitProps = {
  onChange?: ComponentProps<typeof Table>['onChange'];
  onScroll?: ComponentProps<typeof Table>['onScroll'];
  'onUpdate:expandedRowKeys'?: ComponentProps<
    typeof Table
  >['onUpdate:expandedRowKeys'];
};

/** 宿主 Table 的完整属性面：运行时 props 与 emit 型事件处理器 */
export type TableComponentProps = TableProps & TableEmitProps;

export {
  useDisabledContext,
  useDisabledContextProvider,
} from 'antdv-next/dist/config-provider/DisabledContext';

export type NamePath = string | number | (string | number)[];
