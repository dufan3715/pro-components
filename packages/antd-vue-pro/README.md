## antd-vue-pro

- [x] pro-component-provider
- [x] pro-form
- [x] pro-table

#### 安装

```javascript
npm i @qin-ui/antd-vue-pro
```

> 注意：从v1.0.x 升级至 v1.1.x 版本有api优化调整，主要涉及到pro-component-provider组件component-vars的参数扁平化，版本升级时需注意



#### 1. pro-component-provider

组件接收参数名为component-vars的props，内部provide所接收的props供所有被包裹的组件inject

##### API

+ Props

  | 参数名         | 说明              | 类型          | 默认值 |
  | -------------- | ----------------- | ------------- | ------ |
  | component-vars | 需要provide的配置 | ComponentVars |        |

  

#### 2. pro-form

ant-design-vue ui组件库form组件的二次封装

##### API

+ Props

  | 参数名                                | 说明                                                         | 类型                                                         | 默认值 |
  | ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------ |
  | form                                  | proform useForm返回对象，传递此参数后formData和fields参数将失效（推荐使用配套hook） | Form                                                         |        |
  | grid                                  | 是否启用栅格布局                                             | boolean \| GridProps同[antdv Grid的RowProps](https://antdv.com/components/grid-cn/#api) |        |
  | 继承ant-design-vue form组件的所有参数 | [查看文档](https://antdv.com/components/form-cn#api)         | ...                                                          |        |

- Emits

  | 事件参数名                            | 说明                                                 | 类型                  | 默认值 |
  | ------------------------------------- | ---------------------------------------------------- | --------------------- | ------ |
  | 继承ant-design-vue form组件的所有事件 | [查看文档](https://antdv.com/components/form-cn#api) | ...                   |        |

+ Expose

  | 参数名                                | 说明                                                    | 类型 | 默认值 |
  | ------------------------------------- | ------------------------------------------------------- | ---- | ------ |
  | 继承ant-design-vue form组件的所有方法 | [查看文档](https://antdv.com/components/form-cn#api)    | ...  |        |



##### Types

+ Field

  表单字段类型 由某一个输入项（如Input、Select组件）参数类型+表单项（FormItem组件）参数类型+Grid布局组件Col的参数类型+公共拓展类型Common

  ```typescript
  type Field = FieldType[keyof FieldType] & FormItemProps & GridItemProps & Common
  ```

  + 输入项参数类型FieldType

    ```typescript
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
      'range-picker': { component: 'range-picker', slots?: DatePickerSlots } & DatePickerProps;
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
      'transfer': { component: 'transfer' } & TransferProps;
      /** 自定义组件 */
      'custom': { component?: RenderComponentType } & Record<string, any>;
    };
    ```

    [InputProps](https://antdv.com/components/input-cn/#input)

    [TextAreaProps](https://antdv.com/components/input-cn/#textarea)

    [InputNumberProps](https://antdv.com/components/input-number-cn#api)

    [SelectProps](https://antdv.com/components/select-cn#select-props)

    [CascaderProps](https://antdv.com/components/cascader-cn#api)

    [DatePickerProps](https://antdv.com/components/date-picker-cn#%E5%85%B1%E5%90%8C%E7%9A%84-api)

    [TimePickerProps](https://antdv.com/components/time-picker-cn#api)

    [CheckboxGroupProps](https://antdv.com/components/checkbox-cn#checkbox-group)

    [RadioGroupProps](https://antdv.com/components/radio-cn#radiogroup)

    [SwitchProps](https://antdv.com/components/switch-cn#api)

    [SliderProps](https://antdv.com/components/switch-cn#api)

    [TreeSelectProps](https://antdv.com/components/tree-select-cn#tree-props)

    [TransferProps](https://antdv.com/components/transfer-cn#api)

  + 表单项参数类型FormItemProps

    同ant-design-vue FormItemProps, [查看文档](https://antdv.com/components/form-cn#form-item)

  + 栅格布局参数类型GridItemProps

    同ant-design-vue ColProps, [查看文档](https://antdv.com/components/grid-cn/#col)

  + 公共拓展参数类型Common

    ```typescript
    interface Common {
      /** 标识key */
      key?: string;
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
       * 值处理函数，onUpdateValue前执行，函数返回值将作为更新值
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
    ```

+ UseForm

  自定义hook，由数个hook（useFormData、useFields、useFormRef）内聚产生。接收两个参数（initFormData, initFields）返回一个对象

  ```typescript
  type Form = ReturnType<UseFields> & ReturnType<UseFormData> & ReturnType<UseFormRef>;
  
  type UseForm = <T extends FormData>(
    initFormData?: T,
    initFields?: Fields
  ) => Form;
  ```

  ```typescript
  /**
   * @description useFields hook
   * @param {Fields} initFields - 初始化表单字段
   * @returns {Object} form
   */
  type UseFields = (initFields: Fields) => {
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
    /** 获取指定字段数据路径的字段所在字段分组 */
    getParentFields: GetParentFields;
  };
  
  /**
   * @description useFormData hook
   * @param {array} initFormData - 初始化表单数据
   * @returns {Object}
   */
  type UseFormData = (initFormData: FormData) => {
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
  type UseFormRef = () => {
    /** 表单组件实例引用Ref */
    formRef: Ref<ProFormInstance | undefined>;
  };
  ```

  

##### Demo

```vue
<script lang="ts" setup>
import {
  ProForm,
  useForm,
  ProComponentProvider,
  type ComponentVars,
  type Field,
  type Fields,
} from '@qin-ui/antd-vue-pro/src';
import { h, ref } from 'vue';

const CodeContainer: Field['componentContainer'] = (p, ctx) => {
  return h(
    'div',
    {
      style: { display: 'flex', alignItems: 'center' },
    },
    [
      ctx.slots.default?.(),
      h(
        'a',
        {
          style: { marginLeft: '10px', whiteSpace: 'nowrap' },
          onClick: () => {
            proFormRef.value?.validateFields('username');
          },
        },
        '发送验证码'
      ),
    ]
  );
};

const initFields: Fields = [
  {
    label: '登记所在地（省/市/县、区）',
    key: '登记所在地（省/市/县、区）',
    component: 'cascader',
    slots: {},
    options: [],
  },
  {
    label: '用户名',
    key: 'username',
    component: 'input',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  },
  {
    label: '密码',
    key: 'password',
    component: 'input',
    type: 'password',
    rules: [
      { required: true, message: '请输入密码' },
      { min: 4, message: '密码最小长度为5个字符' },
      { max: 18, message: '密码最大长度为18个字符' },
    ],
    valueFormatter: val => val?.trim()
  },
  {
    label: '验证码',
    key: 'code',
    component: 'input-number',
    rules: [{ required: true, message: '请输入密码' }],
    componentContainer: CodeContainer,
  },
];

const form = useForm({}, initFields);
const { formRef: proFormRef } = form

const componentVars: ComponentVars = {
  input: { maxlength: 50, valueFormatter: val => val?.trim() },
  textarea: { maxlength: 1000, valueFormatter: val => val?.trim() },
  'input-number': { max: 10 ** 12 - 1 },
};

const submit = () => {
  proFormRef.value?.validate().then(() => {
    console.log(form.formData.value);
  });
};
</script>

<template>
  <div style="max-width: 500px; margin: 0 auto">
    <h1>hello world</h1>

    <ProComponentProvider :component-vars="componentVars">
      <ProForm ref="proFormRef" :form="form" />
    </ProComponentProvider>

    <button @click="submit">提交</button>

    <pre>{{ form.formData }}</pre>
  </div>
</template>

<style scoped lang="less"></style>

```

