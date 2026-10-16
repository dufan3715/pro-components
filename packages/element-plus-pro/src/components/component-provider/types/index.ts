import type {
  GridItemProps,
  FormItemProps,
  TableProps,
  PaginationProps,
  DatePicker,
} from '../../../shared/ui';
import type { ComponentName, GetComponentType } from '../../form/constants';
import type { Base, Grid, ContainerComponent } from '../../form/types';
import type { ProFormProps } from '../../form/components';
import type { SearchFormProps } from '../../table/components/SearchForm.vue';
import type { AllowedComponentProps } from 'vue';
import type { ComponentProps } from 'vue-component-type-helpers';
import type { ColumnControlConfig } from '../../table/types';

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
  /**
   * ProTable 全局默认属性
   *
   * @description `data` 不参与全局注入：由 `:table` 实例（`useTable`）或显式 `:data` 驱动；`columns` / `loading` 非本注入项的类型面成员，传入时在注入层忽略。
   */
  'pro-table': PP<
    Omit<TableProps, 'data'> & {
      pagination?: false | Partial<PaginationProps>;
      control?:
        | boolean
        | {
            sizeControl?: boolean;
            columnControl?: boolean | ColumnControlConfig;
          };
      searchFormConfig?: Partial<Omit<SearchFormProps, 'form'>> & {
        hidden?: boolean;
        container?: ContainerComponent | false;
      };
      immediateSearch?: boolean;
      addIndexColumn?: boolean;
      tableContainer?: ContainerComponent | false;
    }
  >;
  /** ProForm 全局默认属性，grid 必须为 GridProps 对象而非 boolean */
  'pro-form': PP<
    Omit<ProFormProps, 'form' | 'grid'> & {
      grid?: Exclude<Grid, undefined | boolean>;
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

/**
 * 组件全局配置
 * @description RequiredComponentVars 的 Partial 版本，用于 ProComponentProvider 的 props
 * @public
 */
export type ComponentVars = Partial<RequiredComponentVars>;
