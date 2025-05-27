import {
  CascaderProps,
  CheckboxGroupProps,
  DatePickerProps,
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
} from 'ant-design-vue';
// import inputProps from 'ant-design-vue/es/input/inputProps';
import {
  // MonthPickerProps,
  RangePickerProps,
  // WeekPickerProps,
} from 'ant-design-vue/es/date-picker';
import { Base, ProFormProps, ProFormItemProps } from '../../form';
import { ProTableProps } from '../../table';

type AnyProps<T extends Record<string, any>> = Record<keyof T, any> & Base;

// prettier-ignore
export type ComponentVars = Partial<{
  'pro-table': Partial<TableProps & Pick<ProTableProps, 'showControl' | 'searchFormConfig' | 'paramCache'>>;
  'pro-form': Partial<ProFormProps>;
  'pro-form-item': Partial<ProFormItemProps>;
  // field
  'input': Partial<AnyProps<InputProps>>;
  'textarea': Partial<AnyProps<TextAreaProps>>;
  'input-password': Partial<AnyProps<InputProps>>;
  'input-search': Partial<AnyProps<InputProps>>;
  'input-number': Partial<AnyProps<InputNumberProps>>;
  'select': Partial<AnyProps<SelectProps>>;
  'cascader': Partial<AnyProps<CascaderProps>>;
  'date-picker': Partial<AnyProps<DatePickerProps>>;
  'date-picker.date': Partial<AnyProps<DatePickerProps>>;
  'date-picker.week': Partial<AnyProps</* WeekPickerProps */DatePickerProps>>;
  'date-picker.month': Partial<AnyProps</* MonthPickerProps */DatePickerProps>>;
  'date-picker.year': Partial<AnyProps<DatePickerProps>>;
  'date-picker.quarter': Partial<AnyProps<DatePickerProps>>;
  'range-picker': Partial<AnyProps<RangePickerProps>>;
  'time-picker': Partial<AnyProps<TimePickerProps>>;
  'checkbox-group': Partial<AnyProps<CheckboxGroupProps>>;
  'radio-group': Partial<AnyProps<RadioGroupProps>>;
  'switch': Partial<AnyProps<SwitchProps>>;
  'slider': Partial<AnyProps<SliderProps>>;
  'tree-select': Partial<AnyProps<TreeSelectProps>>;
  'transfer': Partial<AnyProps<TransferProps>>;
}>;
