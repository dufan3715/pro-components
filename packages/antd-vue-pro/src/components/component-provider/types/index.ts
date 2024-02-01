import {
  CheckboxGroupProps,
  DatePickerProps,
  FormItemProps,
  FormProps,
  InputNumberProps,
  InputProps,
  RadioGroupProps,
  SliderProps,
  SwitchProps,
  TableProps,
  TextAreaProps,
  TimePickerProps,
  TransferProps,
  TreeSelectProps,
} from 'ant-design-vue';
import {
  MonthPickerProps,
  RangePickerProps,
  WeekPickerProps,
} from 'ant-design-vue/es/date-picker';
import { CascaderProps } from 'ant-design-vue/es/vc-cascader';
import { SelectProps } from 'ant-design-vue/es/vc-select';

// prettier-ignore
export type ComponentVars = Partial<{
  'pro-table': Partial<TableProps>;
  'pro-form': Partial<FormProps>;
  'pro-form-item': Partial<FormItemProps>;
  // field
  'input': Partial<InputProps>;
  'textarea': Partial<TextAreaProps>;
  'input-password': Partial<InputProps>;
  'input-search': Partial<InputProps>;
  'input-number': Partial<InputNumberProps>;
  'select': Partial<SelectProps>;
  'cascader': Partial<CascaderProps>;
  'date-picker': Partial<DatePickerProps>;
  'date-picker.date': Partial<DatePickerProps>;
  'date-picker.week': Partial<WeekPickerProps>;
  'date-picker.month': Partial<MonthPickerProps>;
  'date-picker.year': Partial<DatePickerProps>;
  'date-picker.quarter': Partial<DatePickerProps>;
  'range-picker': Partial<RangePickerProps>;
  'time-picker': Partial<TimePickerProps>;
  'checkbox-group': Partial<CheckboxGroupProps>;
  'radio-group': Partial<RadioGroupProps>;
  'switch': Partial<SwitchProps>;
  'slider': Partial<SliderProps>;
  'tree-select': Partial<TreeSelectProps>;
  'transfer': Partial<TransferProps>;
}>;
