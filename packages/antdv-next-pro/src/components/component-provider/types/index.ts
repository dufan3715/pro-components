import type {
  GridItemProps,
  FormItemProps,
  TableComponentProps,
} from '../../../shared/ui';
import type { ComponentName, GetComponentType } from '../../form/constants';
import type { Base, Grid } from '../../form/types';
import type { ProFormProps } from '../../form/components';
import type { ProTableProps } from '../../table';
import type { AllowedComponentProps } from 'vue';
import type { ComponentProps } from 'vue-component-type-helpers';

type PP<T extends Record<string, any>> = Partial<T & AllowedComponentProps>;

type FP<T extends Record<string, any>> = Partial<
  T &
    Pick<
      Base,
      | 'valueFormatter'
      | 'componentContainer'
      | 'modelProp'
      | 'componentClass'
      | 'componentStyle'
    > &
    AllowedComponentProps
>;

export type RequiredComponentVars = {
  'pro-table': PP<
    Omit<TableComponentProps, 'loading'> &
      Pick<
        ProTableProps,
        | 'control'
        | 'searchFormConfig'
        | 'immediateSearch'
        | 'addIndexColumn'
        | 'tableContainer'
      >
  >;
  'pro-form': PP<
    Omit<ProFormProps, 'form' | 'grid'> & {
      grid: Exclude<Grid, undefined | boolean>;
    }
  >;
  'pro-form-item': PP<
    FormItemProps &
      Pick<GridItemProps, 'span' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'> &
      Pick<Base, 'formItemContainer'>
  >;
  // field
  'date-picker.date': FP<ComponentProps<GetComponentType<'date-picker'>>>;
  'date-picker.week': FP<ComponentProps<GetComponentType<'date-picker'>>>;
  'date-picker.month': FP<ComponentProps<GetComponentType<'date-picker'>>>;
  'date-picker.year': FP<ComponentProps<GetComponentType<'date-picker'>>>;
  'date-picker.quarter': FP<ComponentProps<GetComponentType<'date-picker'>>>;
} & {
  // field
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
