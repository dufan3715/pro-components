import { GridItemProps, FormItemProps, TableProps } from '../../../shared/ui';
import { Base, Grid } from '../../form/types';
import { ProFormProps } from '../../form';
import { ProTableProps } from '../../table';
import { AllowedComponentProps } from 'vue';

import { GetComponentType, ComponentName } from '../../form/constants';
import type { ComponentProps } from 'vue-component-type-helpers';

type PP<T extends Record<string, any>> = Partial<T & AllowedComponentProps>;

type FP<T extends Record<string, any>> = Partial<
  T &
    Pick<Base, 'valueFormatter' | 'componentContainer' | 'modelProp'> &
    AllowedComponentProps
>;

/**
 * @qin-ui/antd-vue-pro 全局配置变量类型
 *
 * @description 定义可通过 ProComponentProvider 配置的所有组件默认属性。
 * 支持配置表单、表格、表单项以及所有内置组件的默认属性。
 *
 * @example
 * ```ts
 * // 通过 ProComponentProvider 配置全局默认值
 * const componentVars: ComponentVars = {
 *   'pro-form': {
 *     grid: { gutter: 24 },
 *     labelCol: { span: 4 },
 *   },
 *   'input': {
 *     placeholder: '请输入内容',
 *     maxlength: 200,
 *   },
 *   'select': {
 *     placeholder: '请选择',
 *   },
 * }
 * ```
 */
export type RequiredComponentVars = {
  /** ProTable 全局默认属性 */
  'pro-table': PP<
    TableProps &
      Pick<
        ProTableProps,
        | 'control'
        | 'searchFormConfig'
        | 'immediateSearch'
        | 'addIndexColumn'
        | 'tableContainer'
      >
  >;
  /** ProForm 全局默认属性，grid 必须为 GridProps 对象而非 boolean */
  'pro-form': PP<
    Omit<ProFormProps, 'form' | 'grid'> & {
      grid: Exclude<Grid, undefined | boolean>;
    }
  >;
  /** ProFormItem 全局默认属性 */
  'pro-form-item': PP<
    FormItemProps &
      Pick<GridItemProps, 'span' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'> &
      Pick<Base, 'formItemContainer'>
  >;
  // field
  /** DatePicker date 模式全局默认属性 */
  'date-picker.date': FP<ComponentProps<GetComponentType<'date-picker'>>>;
  /** DatePicker week 模式全局默认属性 */
  'date-picker.week': FP<ComponentProps<GetComponentType<'date-picker'>>>;
  /** DatePicker month 模式全局默认属性 */
  'date-picker.month': FP<ComponentProps<GetComponentType<'date-picker'>>>;
  /** DatePicker year 模式全局默认属性 */
  'date-picker.year': FP<ComponentProps<GetComponentType<'date-picker'>>>;
  /** DatePicker quarter 模式全局默认属性 */
  'date-picker.quarter': FP<ComponentProps<GetComponentType<'date-picker'>>>;
} & {
  /** 其他所有内置组件的全局默认属性 */
  [K in Exclude<ComponentName, 'custom'>]: FP<
    ComponentProps<GetComponentType<K>>
  >;
};

/**
 * 组件全局配置
 * @description RequiredComponentVars 的 Partial 版本，用于 ProComponentProvider 的 props
 * @public
 */
export type ComponentVars = Partial<RequiredComponentVars>;
