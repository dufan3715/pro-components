import type {
  FormProps as _FormProps,
  Table,
  TableProps,
} from 'ant-design-vue';
import type { ComponentProps } from 'vue-component-type-helpers';
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
  type RowProps as GridProps,
  type ColProps as GridItemProps,
  type FormItemProps,
  type TableProps,
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
export { formItemProps } from 'ant-design-vue/es/form';
export { type NamePath } from 'ant-design-vue/es/form/interface';
export { type MenuItemType } from 'ant-design-vue/es/menu/src/interface';

export type FormProps = Omit<_FormProps, 'scrollToFirstError'> & {
  scrollToFirstError?: boolean | Options<any>;
};

/** TableProps 未声明的 emit 型属性（事件处理器），键名取自宿主 Table 的组件属性面 */
export type TableEmitProps = {
  'onUpdate:expandedRowKeys'?: ComponentProps<
    typeof Table
  >['onUpdate:expandedRowKeys'];
};

/**
 * 宿主 Table 的完整属性面
 *
 * @description 由宿主 `TableProps` 与其未声明的 emit 型属性键组成，键名与签名均取自宿主导出；
 * 宿主 Table 未暴露 scroll 事件面，故不提供 `@scroll` 入口。
 */
export type TableComponentProps = TableProps & TableEmitProps;
