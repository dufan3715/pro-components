/* eslint-disable no-use-before-define, no-unused-vars, no-redeclare */
import type {
  FormItemProps,
  RowProps as GridProps,
  ColProps as GridItemProps,
  InputProps,
  InputNumberProps,
  SelectProps,
  CascaderProps,
  DatePickerProps,
  TimePickerProps,
  CheckboxGroupProps,
  RadioGroupProps,
  SwitchProps,
  SliderProps,
  TreeSelectProps,
  TransferProps,
  TextAreaProps,
  Select,
  FormItemInstance,
} from 'ant-design-vue';
import type { CSSProperties, DeepReadonly, Ref, Component, Raw } from 'vue';
import { type RangePickerProps } from 'ant-design-vue/es/date-picker';
import { FORM_ITEM_SLOT_KEYS } from '../constants';
import { ProFormInstance } from '..';

export type FormData = { [key: string]: any };

type DefaultProps = { path?: string; [key: string]: any };

type VModelProps<T = any> = {
  value?: T;
  'onUpdate:value'?: (val: T) => void;
};
/**
 * @description 自定义组件
 * @example (p, ctx) => h('div', ctx.attrs)
 */
export type RenderComponentType = Component<VModelProps & DefaultProps>;

export type SlotComponentType = string | Component<DefaultProps>;

export type ContainerComponent = Component<DefaultProps>;

export type Slots = {
  [name: string]: SlotComponentType;
};

type Option = {
  label: string;
  value: any;
  [x: string]: any;
};
export type Options = Array<Option>;

export type Grid = boolean | GridProps;

/**
 * @type {Object} Common - 公共字段类型
 */
export interface Common<D extends FormData = FormData> {
  /** 标识key */
  key?: keyof D & string;
  /** 中文名称 */
  label?: SlotComponentType;
  /** 插槽，可包含formItem插槽和component插槽 */
  slots?: Partial<
    Record<(typeof FORM_ITEM_SLOT_KEYS)[number], SlotComponentType>
  >;
  /** 网格布局属性 */
  grid?: Grid;
  /** 子字段 */
  fields?: Array<Field>;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 自动化指令 */
  autoCommand?: AutoCommand;
  /** formItem样式属性 */
  style?: CSSProperties;
  /** formItem样式类名 */
  className?: string;
  /** formItem容器包裹组件 */
  container?: ContainerComponent;
  /** component样式属性 */
  componentStyle?: CSSProperties;
  /** component样式类名 */
  componentClassName?: string;
  /** component容器包裹组件 */
  componentContainer?: ContainerComponent;
  /**
   * 值处理函数，onUpdateValue前执行，函数返回值将作为更新值, 例如
   * @example (val) => val?.trim()
   */
  valueFormatter?: (val: any) => any;
  /** 是否隐藏校验错误信息（需要浏览器支持has选择器） */
  hideFeedback?: boolean;
  /** 以data-form-item-开头的属性将会被渲染至formItem的dom节点 */
  [key: `data-form-item-${string}`]: string;
  /** 以data-component-开头的属性将会被渲染至component的dom节点 */
  [key: `data-component-${string}`]: string;
}

/* 插槽类型 */
type FieldSlot<T extends string> = Partial<Record<T, SlotComponentType>>;
// prettier-ignore
type InputSlots = FieldSlot<'addonAfter' | 'addonBefore' | 'clearIcon' | 'prefix' | 'suffix'>
// prettier-ignore
type InputNumberSlots = FieldSlot<'addonAfter' | 'addonBefore' | 'prefix' | 'upIcon' | 'downIcon'>
// prettier-ignore
type SelectSlots = FieldSlot<keyof InstanceType<typeof Select>['$slots']>
// prettier-ignore
type CascaderSlots = FieldSlot<'clearIcon' | 'expandIcon' | 'maxTagPlaceholder' | 'notFoundContent' | 'removeIcon' | 'suffixIcon' | 'tagRender'>
// prettier-ignore
type DatePickerSlots = FieldSlot<'dateRender' | 'renderExtraFooter' | 'separator' | 'monthCellRender'>
// prettier-ignore
type RangePickerSlots = FieldSlot<'dateRender' | 'renderExtraFooter' | 'separator'>
// prettier-ignore
type TimePickerSlots = FieldSlot<'clearIcon' | 'renderExtraFooter' | 'suffixIcon'>
// prettier-ignore
type SwitchSlots = FieldSlot<'checkedChildren' | 'unCheckedChildren'>
// prettier-ignore
type SliderSlots = FieldSlot<'mark'>
// prettier-ignore
type TreeSelectSlots = FieldSlot<'maxTagPlaceholder' | 'notFoundContent' | 'placeholder' | 'searchPlaceholder' | 'suffixIcon' |'tagRender' | 'title'>
// prettier-ignore
type TransferSlots = FieldSlot<'footer' | 'render'>

/**
 * @type {FieldType} 字段类型集合
 */
// prettier-ignore
export type FieldType = {
  /** 文本框 */
  'input': { component: 'input', slots?: InputSlots } & InputProps;
  /** 文本域 */
  'textarea': { component: 'textarea', slots?: InputSlots } & TextAreaProps;
  /** 文本框-密码 */
  'input-password': { component: 'input-password', slots?: InputSlots } & InputProps;
  /** 文本框-搜索 */
  'input-search': { component: 'input-search', slots?: InputSlots } & InputProps;
  /** 数字文本框 */
  'input-number': { component: 'input-number', slots?: InputNumberSlots } & InputNumberProps;
  /** 下拉选择器 */
  'select': { component: 'select', slots?: SelectSlots } & SelectProps;
  /** 级联选择器 */
  'cascader': { component: 'cascader', slots?: CascaderSlots } & CascaderProps;
  /** 日期选择器 */
  'date-picker': { component: 'date-picker', slots?: DatePickerSlots } & DatePickerProps;
  /** 日期选择器-范围 */
  'range-picker': { component: 'range-picker', slots?: RangePickerSlots } & RangePickerProps;
  /** 时间选择器 */
  'time-picker': { component: 'time-picker', slots?: TimePickerSlots } & TimePickerProps;
  /** 复选框组 */
  'checkbox-group': { component: 'checkbox-group' } & CheckboxGroupProps;
  /** 单选框组 */
  'radio-group': { component: 'radio-group' } & RadioGroupProps;
  /** 开关 */
  'switch': { component: 'switch', slots?: SwitchSlots } & SwitchProps;
  /** 滑块 */
  'slider': { component: 'slider', slots?: SliderSlots } & SliderProps;
  /** 树形选择器 */
  'tree-select': { component: 'tree-select', slots?: TreeSelectSlots } & TreeSelectProps;
  /** 穿梭框 */
  'transfer': { component: 'transfer', slots?: TransferSlots } & TransferProps;
  /** 自定义组件 */
  'custom': { component?: RenderComponentType | Raw<RenderComponentType>, slots?: Slots } & Record<string, any>;
};
export type Field<D extends FormData = FormData> =
  | FieldType[keyof FieldType] &
      Omit<FormItemProps, 'label'> &
      GridItemProps &
      Common<D>;
export type Fields<D extends FormData = FormData> = Array<Field<D>>;

export type BaseComponentStringName = Exclude<
  Field['component'],
  RenderComponentType | undefined
>;

// components/ProForm
export type Refs = {
  formItemRefs: Record<string, FormItemInstance>;
  fieldRefs: Record<string, any>;
};
export type UpdateFormData = (path: string, value: any) => void;
export type UpdateRefs = (
  type: keyof Refs,
  path: string,
  childRef: Record<string, any>
) => void;
export type GetRef = {
  (type: 'formItemRefs', path: string): FormItemInstance;
  (type: 'fieldRefs', path: string): any;
};
export type GetFormData = (path?: string) => DeepReadonly<any>;
export type SetFormData = {
  (path: string, value: any | ((preValue: DeepReadonly<any>) => any)): void;
  (value: any | ((preValue: DeepReadonly<any>) => any)): void;
};
export type SetActivePath = (path: string | undefined) => void;

// components/Field
type FieldAttrsType = {
  [key in keyof FieldType]: FieldType[key] &
    Pick<
      Common,
      | 'slots'
      | 'componentStyle'
      | 'componentClassName'
      | 'componentContainer'
      | 'autoCommand'
    >;
};
export type BaseFieldAttrs = FieldAttrsType[keyof FieldAttrsType];

// hooks/useFields
export type GetField = (path?: string) => Field | undefined;
export type SetField = (
  path: string | undefined,
  field: Field | ((preField: ReturnType<GetField>) => Field),
  updateType?: 'rewrite' | 'merge'
) => void;
export type DeleteField = (path?: string) => void;
export type GetFieldPath = (path?: string) => string | undefined;
export type AppendField = (path: string | undefined, field: Field) => void;
export type PrependField = (path: string | undefined, field: Field) => void;
export type GetParentField = (path?: string) => Field | undefined;

/**
 * @description useFields hook
 * @param {Fields} initFields - 初始化表单字段
 * @returns {Object} form
 */
export type UseFields = (initFields: Fields) => {
  /** 表单字段Ref */
  fields: Ref<Fields>;
  /** 获取指定字段数据路径的字段配置 */
  getField: GetField;
  /** 设置指定字段数据路径的字段配置 */
  setField: SetField;
  /** 删除指定字段数据路径的字段配置 */
  deleteField: DeleteField;
  /** 根据字段数据路径获取字段配置路径 */
  getFieldPath: GetFieldPath;
  /** 在指定字段数据路径的字段配置后添加新的字段配置 */
  appendField: AppendField;
  /** 在指定字段数据路径的字段配置前插入新的字段配置 */
  prependField: PrependField;
  /** 获取指定字段数据路径的字段所在分组字段的配置 */
  getParentField: GetParentField;
};

/**
 * @description useFormData hook
 * @param {array} initFormData - 初始化表单数据
 * @returns {Object}
 */
export type UseFormData<D extends FormData = FormData> = (
  initFormData: Partial<D>
) => {
  /** 表单数据Ref */
  formData: Ref<D | FormData>;
  /** 获取指定字段数据路径的值 */
  getFormData: GetFormData;
  /** 设置指定字段数据路径的值 */
  setFormData: SetFormData;
  /** 当前正在编辑的字段path */
  activePath: Ref<string | undefined>;
  /** 设置当前正在编辑的字段path */
  setActivePath: SetActivePath;
};

/**
 * @description useFormRef hook
 * @returns {Object}
 */
export type UseFormRef = () => {
  /** 表单组件实例引用Ref */
  formRef: Ref<ProFormInstance | undefined>;
};

export type Form<D extends FormData = FormData> = ReturnType<UseFormData<D>> &
  ReturnType<UseFields> &
  ReturnType<UseFormRef>;

export type UseForm<T extends FormData = FormData> = <D extends T = T>(
  initFormData?: Partial<D>,
  initFields?: Fields<D>
) => Form<D>;

// hooks/useCommand
export type UseCommand = (param: { refs: Refs; form: Form }) => {
  run: (path: string, trigger: CommandTrigger) => void;
};

/**
 * @type {string} RuleType - 逻辑规则类型
 * @ value - 字段赋值
 * @ hidden - 字段隐藏/显示
 * @ disabled - 字段禁用/启用
 * @ options - 字段选项枚举变更
 * @ validateRule - 字段校验规则变更
 * @ fieldMergeOverrides - 字段配置
 * @ validate - 字段触发校验
 * @ clearValidate - 字段触发清除校验
 * @ message - 字段触发提示
 */
export type RuleType =
  | 'value'
  | 'hidden'
  | 'disabled'
  | 'options'
  | 'validateRule'
  | 'fieldMergeOverrides'
  | 'validate'
  | 'clearValidate'
  | 'message';

/**
 * @type {string} Expression - 表达式字符串 需要是一个js表达式字符串或者一个函数字符串，表达式的执行结果或者函数的返回值将作为结果返回
 */
export type Expression = string;

/**
 * @type {object} Condition - 逻辑执行条件
 */
export type Condition = {
  /** 条件关系 与 ｜ 或 */
  type: 'AND' | 'OR';
  /** 表达式 */
  expression: Expression;
  /** 是否禁用 */
  disabled?: boolean;
};

/**
 * @type {object} Rule - 逻辑运行规则
 * @property {string} path - 字段路径
 * @property {RuleType} type - 逻辑规则类型
 * @property {Expression} expression - 表达式对象
 * @property {boolean} [disabled] - 是否禁用
 */
export type Rule = {
  path: string;
  type: RuleType;
  expression: Expression;
  disabled?: boolean;
};

/**
 * @type {object} Logic - 逻辑运行规则
 */
export type Logic = {
  /** 逻辑执行条件 */
  conditions: Array<Condition>;
  /** 逻辑规则集合 */
  rules: Array<Rule>;
  /** 是否禁用 */
  disabled?: boolean;
};

export type Logics = Array<Logic>;

/**
 * @type {object} Command - 指令
 */
export type Command = {
  /** 指令编号 */
  no: number;
  /** 指令名称 */
  name: string;
  /** 指令描述 */
  description: string;
  /** 指令逻辑 */
  logics: Logics;
  /** 是否禁用 */
  disabled?: boolean;
};

export type Commands = Array<Command>;

/**
 * @type {string} CommandTrigger - 指令触发方式
 */
export type CommandTrigger = 'onInit' | 'onUpdateValue' | 'onBlur' | 'onFocus';

/**
 * @type {Object<CommandTrigger, Commands>} AutoCommand - 自动化指令
 */
export type AutoCommand = Record<CommandTrigger, Commands>;
