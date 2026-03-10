import { GridItemProps, FormItemProps, TableProps } from '../../../shared/ui';
import {
  Base,
  ComponentName,
  GetComponentType,
  Grid,
  ProFormProps,
} from '../../form';
import { ProTableProps } from '../../table';
import { AllowedComponentProps } from 'vue';
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
  [K in ComponentName]: FP<ComponentProps<GetComponentType<K>>>;
};

export type ComponentVars = Partial<RequiredComponentVars>;
