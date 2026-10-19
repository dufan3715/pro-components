import { Col, Table, FormItem } from 'antdv-next';
import type { TableEmits, TableProps as _TableProps } from 'antdv-next';

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
  type PaginationProps,
  type RowProps as GridProps,
  type ColProps as GridItemProps,
  type TableColumnType as ColumnType,
} from 'antdv-next';

/** 宿主 FormItem 的实例类型 */
export type FormItemInstance = InstanceType<typeof FormItem>;

/**
 * 读取宿主组件上下文（禁用 / 尺寸）
 *
 * @description 宿主 `useConfig` 的别名，返回 ConfigProvider 上下文的响应式引用；
 * 包内取用其中的 `componentDisabled` 与 `componentSize`，locale 文案读取见 `useLocale`。
 */
export { useConfig as useHostConfig } from 'antdv-next';

const _gridItemProps = (Col as any).props || {};
const _formItemProps = (FormItem as any).props || {};

/** 宿主 Col 的静态 props 快照（透传键名白名单用） */
export const gridItemProps = () => _gridItemProps;
/** 宿主 FormItem 的静态 props 快照（透传键名白名单用） */
export const formItemProps = () => _formItemProps;

/*
 * 宿主 Table 事件型透传键：由宿主 emits（change / scroll / update:expandedRowKeys）推导，
 * 模板中的 @change / @scroll / v-model:expanded-row-keys 均以这些键名进入 attrs
 */
const TABLE_EMIT_PROP_KEYS = (() => {
  const emits = (Table as any).emits;
  const names: string[] = Array.isArray(emits)
    ? emits
    : Object.keys(emits || {});
  return names.map(name => `on${name.charAt(0).toUpperCase()}${name.slice(1)}`);
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

/**
 * 表格完整属性面
 *
 * @description 宿主 `TableProps` 未声明 emit 型事件键，故并入由宿主根导出的 `TableEmits` 推导的同族键
 * （`on${Capitalize<K>}`，与宿主的 `TableEmitsProps` 同式）；键名与签名均取自宿主导出。
 */
export type TableProps = _TableProps & {
  [K in keyof TableEmits as `on${Capitalize<string & K>}`]?: TableEmits[K];
};

export {
  useDisabledContext,
  useDisabledContextProvider,
} from 'antdv-next/dist/config-provider/DisabledContext';

/** 字段路径：字符串、数字或分段数组 */
export type NamePath = string | number | (string | number)[];
