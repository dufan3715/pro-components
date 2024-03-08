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
import { Common } from '../../form';

// prettier-ignore
export type ComponentVars = Partial<{
  'pro-table': Partial<TableProps>;
  'pro-form': Partial<FormProps>;
  'pro-form-item': Partial<FormItemProps>;
  // field
  'input': Partial<InputProps & Common>;
  'textarea': Partial<TextAreaProps & Common>;
  'input-password': Partial<InputProps & Common>;
  'input-search': Partial<InputProps & Common>;
  'input-number': Partial<InputNumberProps & Common>;
  'select': Partial<SelectProps & Common>;
  'cascader': Partial<CascaderProps & Common>;
  'date-picker': Partial<DatePickerProps & Common>;
  'date-picker.date': Partial<DatePickerProps & Common>;
  'date-picker.week': Partial<WeekPickerProps & Common>;
  'date-picker.month': Partial<MonthPickerProps & Common>;
  'date-picker.year': Partial<DatePickerProps & Common>;
  'date-picker.quarter': Partial<DatePickerProps & Common>;
  'range-picker': Partial<RangePickerProps & Common>;
  'time-picker': Partial<TimePickerProps & Common>;
  'checkbox-group': Partial<CheckboxGroupProps & Common>;
  'radio-group': Partial<RadioGroupProps & Common>;
  'switch': Partial<SwitchProps & Common>;
  'slider': Partial<SliderProps & Common>;
  'tree-select': Partial<TreeSelectProps & Common>;
  'transfer': Partial<TransferProps & Common>;
}>;
