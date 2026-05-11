import {
  Field,
  Button,
  Picker,
  DatePicker,
  TimePicker,
  Cascader,
  Area,
  Signature,
  Switch,
  Stepper,
  Rate,
  Slider,
  Uploader,
  CheckboxGroup,
  RadioGroup,
} from '../../../shared/ui';

export type BaseComponentMap = {
  field: typeof Field;
  switch: typeof Switch;
  stepper: typeof Stepper;
  rate: typeof Rate;
  slider: typeof Slider;
  uploader: typeof Uploader;
  'checkbox-group': typeof CheckboxGroup;
  'radio-group': typeof RadioGroup;
  picker: typeof Picker;
  'date-picker': typeof DatePicker;
  'time-picker': typeof TimePicker;
  cascader: typeof Cascader;
  area: typeof Area;
  signature: typeof Signature;
  button: typeof Button;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentMap {}

export type ComponentName =
  | keyof BaseComponentMap
  | keyof ComponentMap
  | 'custom';

export type GetComponentType<K extends ComponentName> =
  K extends keyof ComponentMap
    ? ComponentMap[K]
    : K extends keyof BaseComponentMap
      ? BaseComponentMap[K]
      : never;

export const componentMap: BaseComponentMap = {
  field: Field,
  switch: Switch,
  stepper: Stepper,
  rate: Rate,
  slider: Slider,
  uploader: Uploader,
  'checkbox-group': CheckboxGroup,
  'radio-group': RadioGroup,
  picker: Picker,
  'date-picker': DatePicker,
  'time-picker': TimePicker,
  cascader: Cascader,
  area: Area,
  signature: Signature,
  button: Button,
};

export const TeleportComponentNamePrefix = 'TeleportComponent_';

// inject keys
export { InjectionFormKey, InjectionPathKey } from '../../../shared/core';
