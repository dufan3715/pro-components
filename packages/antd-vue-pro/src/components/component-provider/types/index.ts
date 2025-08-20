import {
  CascaderProps,
  CheckboxGroupProps,
  GridItemProps,
  DatePickerProps,
  FormItemProps,
  InputNumberProps,
  InputProps,
  RadioGroupProps,
  SelectProps,
  SliderProps,
  SwitchProps,
  TableProps,
  TextAreaProps,
  TimePickerProps,
  TransferProps,
  TreeSelectProps,
  RangePickerProps,
} from '../../../shared/ui';
import { Base, Grid, ProFormProps } from '../../form';
import { ProTableProps } from '../../table';
import { AllowedComponentProps } from 'vue';

type PP<T extends Record<string, any>> = Partial<T & AllowedComponentProps>;

type FP<T extends Record<string, any>> = Partial<
  T &
    Pick<Base, 'valueFormatter' | 'componentContainer' | 'modelName'> &
    AllowedComponentProps
>;

// prettier-ignore
export type RequiredComponentVars = {
  'pro-table': PP<TableProps & Pick<ProTableProps, 'control' | 'searchFormConfig' | 'immediateSearch' | 'addIndexColumn'>>;
  'pro-form': PP<Omit<ProFormProps, 'form' | 'grid'> & { grid: Exclude<Grid, undefined | boolean>}>;
  'pro-form-item': PP<FormItemProps & Pick<GridItemProps, 'span' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'> & Pick<Base, 'container'>>;
  // field
  'input': FP<InputProps>;
  'textarea': FP<TextAreaProps>;
  'input-password': FP<InputProps>;
  'input-search': FP<InputProps>;
  'input-number': FP<InputNumberProps>;
  'select': FP<SelectProps>;
  'cascader': FP<CascaderProps>;
  'date-picker': FP<DatePickerProps>;
  'date-picker.date': FP<DatePickerProps>;
  'date-picker.week': FP<DatePickerProps>;
  'date-picker.month': FP<DatePickerProps>;
  'date-picker.year': FP<DatePickerProps>;
  'date-picker.quarter': FP<DatePickerProps>;
  'range-picker': FP<RangePickerProps>;
  'time-picker': FP<TimePickerProps>;
  'checkbox-group': FP<CheckboxGroupProps>;
  'radio-group': FP<RadioGroupProps>;
  'switch': FP<SwitchProps>;
  'slider': FP<SliderProps>;
  'tree-select': FP<TreeSelectProps>;
  'transfer': FP<TransferProps>;
};

export type ComponentVars = Partial<RequiredComponentVars>;
