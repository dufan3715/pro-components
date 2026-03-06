import {
  GridItemProps,
  FormItemProps,
  TableProps,
  Input,
  InputPassword,
  InputSearch,
  InputNumber,
  InputOTP,
  AutoComplete,
  Select,
  Cascader,
  DatePicker,
  RangePicker,
  TimePicker,
  TimeRangePicker,
  CheckboxGroup,
  RadioGroup,
  Switch,
  Slider,
  TreeSelect,
  Transfer,
  TextArea,
} from '../../../shared/ui';
import { Base, Grid, ProFormProps } from '../../form';
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

// prettier-ignore
export type RequiredComponentVars = {
  'pro-table': PP<TableProps & Pick<ProTableProps, 'control' | 'searchFormConfig' | 'immediateSearch' | 'addIndexColumn' | 'tableContainer'>>;
  'pro-form': PP<Omit<ProFormProps, 'form' | 'grid'> & { grid: Exclude<Grid, undefined | boolean>}>;
  'pro-form-item': PP<FormItemProps & Pick<GridItemProps, 'span' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'> & Pick<Base, 'formItemContainer'>>;
  // field
  'input': FP<ComponentProps<typeof Input>>;
  'textarea': FP<ComponentProps<typeof TextArea>>;
  'input-password': FP<ComponentProps<typeof InputPassword>>;
  'input-search': FP<ComponentProps<typeof InputSearch>>;
  'input-number': FP<ComponentProps<typeof InputNumber>>;
  'input-otp': FP<ComponentProps<typeof InputOTP>>;
  'auto-complete': FP<ComponentProps<typeof AutoComplete>>;
  'select': FP<ComponentProps<typeof Select>>;
  'cascader': FP<ComponentProps<typeof Cascader>>;
  'date-picker': FP<ComponentProps<typeof DatePicker>>;
  'date-picker.date': FP<ComponentProps<typeof DatePicker>>;
  'date-picker.week': FP<ComponentProps<typeof DatePicker>>;
  'date-picker.month': FP<ComponentProps<typeof DatePicker>>;
  'date-picker.year': FP<ComponentProps<typeof DatePicker>>;
  'date-picker.quarter': FP<ComponentProps<typeof DatePicker>>;
  'range-picker': FP<ComponentProps<typeof RangePicker>>;
  'time-picker': FP<ComponentProps<typeof TimePicker>>;
  'time-range-picker': FP<ComponentProps<typeof TimeRangePicker>>;
  'checkbox-group': FP<ComponentProps<typeof CheckboxGroup>>;
  'radio-group': FP<ComponentProps<typeof RadioGroup>>;
  'switch': FP<ComponentProps<typeof Switch>>;
  'slider': FP<ComponentProps<typeof Slider>>;
  'tree-select': FP<ComponentProps<typeof TreeSelect>>;
  'transfer': FP<ComponentProps<typeof Transfer>>;
};

export type ComponentVars = Partial<RequiredComponentVars>;
