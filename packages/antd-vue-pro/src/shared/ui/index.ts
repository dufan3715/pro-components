import type {
  FormProps as _FormProps,
  Table,
  TableProps as _TableProps,
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
export {
  useInjectFormItemContext,
  useProvideFormItemContext,
} from 'ant-design-vue/es/form/FormItemContext';
export { type NamePath } from 'ant-design-vue/es/form/interface';
export { type MenuItemType } from 'ant-design-vue/es/menu/src/interface';

/** 宿主 Form 属性面；`scrollToFirstError` 放宽为布尔或滚动配置对象 */
export type FormProps = Omit<_FormProps, 'scrollToFirstError'> & {
  scrollToFirstError?: boolean | Options<any>;
};

/**
 * 表格完整属性面
 *
 * @description 由宿主 `TableProps` 与其未声明的 emit 型属性键组成；
 * ant-design-vue 的 Table 未暴露 `scroll` 事件面，故不提供 `@scroll` 入口。
 */
export interface TableProps extends _TableProps {
  'onUpdate:expandedRowKeys'?: ComponentProps<
    typeof Table
  >['onUpdate:expandedRowKeys'];
}
