import {
  GridItemProps,
  FormItemProps,
  TableProps,
  PaginationProps,
  DatePicker,
} from '../../../shared/ui';
import {
  Base,
  ComponentName,
  GetComponentType,
  Grid,
  ProFormProps,
} from '../../form';
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

type DatePickerType = NonNullable<ComponentProps<typeof DatePicker>['type']>;

export type RequiredComponentVars = {
  'pro-table': PP<
    TableProps & {
      pagination?: Partial<PaginationProps>;
      control?: boolean | { sizeControl?: boolean; columnControl?: boolean };
      searchFormConfig?: any;
      immediateSearch?: boolean;
      addIndexColumn?: boolean;
      tableContainer?: any;
    }
  >;
  'pro-form': PP<
    Omit<ProFormProps, 'form' | 'grid'> & {
      grid: Exclude<Grid, undefined | boolean>;
    }
  >;
  'pro-form-item': PP<
    FormItemProps &
      Pick<GridItemProps, 'span' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'> &
      Pick<Base, 'formItemContainer'>
  >;
  'input.password': FP<ComponentProps<GetComponentType<'input'>>>;
  'input.textarea': FP<ComponentProps<GetComponentType<'input'>>>;
} & {
  [K in DatePickerType as `date-picker.${K}`]: FP<
    ComponentProps<GetComponentType<'date-picker'>>
  >;
} & {
  [K in Exclude<ComponentName, 'custom'>]: FP<
    ComponentProps<GetComponentType<K>>
  >;
};

export type ComponentVars = Partial<RequiredComponentVars>;
