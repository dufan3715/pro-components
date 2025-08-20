# ProForm

ProForm 是基于 Ant Design Vue Form 的高级表单封装，提供了更简洁的表单数据管理和字段配置方式。

## 何时使用

- 需要通过配置生成表单而不是编写大量模板代码
- 需要表单字段的动态增减
- 需要统一表单布局和样式

::: tip 配合 useForm 使用
antd-vue-pro 导出了一个名为 `useForm` 的自定义 Hook，用于处理表单数据和字段配置， 配合`useForm` 可以更轻松地使用 ProForm。
:::

## API

### Props

| 参数名 | 说明                                    | 类型                                                              | 默认值 |
| ------ | --------------------------------------- | ----------------------------------------------------------------- | ------ |
| form   | useForm 返回对象                        | Form                                                              | -      |
| grid   | 是否启用栅格布局                        | boolean \| [GridProps](https://antdv.com/components/grid-cn/#api) | -      |
| ...    | 继承 Ant Design Vue Form 组件的所有参数 | [FormProps](https://antdv.com/components/form-cn/#form)           | -      |

### Events

| 事件名 | 说明                                    | 类型                                                                   |
| ------ | --------------------------------------- | ---------------------------------------------------------------------- |
| ...    | 继承 Ant Design Vue Form 组件的所有事件 | [FormEvents](https://antdv.com/components/form-cn/#%E4%BA%8B%E4%BB%B6) |

### Methods

| 方法名 | 说明                                    | 类型                                                                    |
| ------ | --------------------------------------- | ----------------------------------------------------------------------- |
| ...    | 继承 Ant Design Vue Form 组件的所有方法 | [FormMethods](https://antdv.com/components/form-cn/#%E6%96%B9%E6%B3%95) |

## Types

### Field

表单字段类型，由以下类型组合而成：

- 某一个输入项（如 Input、Select 组件）参数类型
- 表单项（FormItem 组件）参数类型
- Grid 布局组件 Col 的参数类型
- 公共拓展类型 Base

#### Base

| 参数名             | 说明                                                                                                                       | 类型                                                             | 默认值  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------- |
| path               | 字段标识namePath，同[FormItemProps](https://antdv.com/components/form-cn/#form-item)的name属性，可根据FormData推断可能的值 | Path                                                             | -       |
| hidden             | 字段是否隐藏，隐藏后字段不会渲染                                                                                           | boolean                                                          | -       |
| slots              | 字段插槽配置，可包含formItem插槽和component插槽                                                                            | Slots                                                            | -       |
| style              | 字段formItem样式属性                                                                                                       | CSSProperties                                                    | -       |
| className          | 字段formItem样式类名                                                                                                       | string                                                           | -       |
| fields             | 嵌套子字段配置                                                                                                             | Field[]                                                          | -       |
| grid               | 网格布局属性，true表示使用默认网格布局，针对具有嵌套字段的字段，会继承父级字段的网格布局属性                               | boolean \|[GridProps](https://antdv.com/components/grid-cn/#api) | -       |
| container          | 字段formItem容器包裹组件，会渲染在a-form-item的外层，需要有default slot                                                    | Component                                                        | -       |
| componentStyle     | 字段component样式属性                                                                                                      | CSSProperties                                                    | -       |
| componentClassName | 字段component样式类名                                                                                                      | string                                                           | -       |
| componentContainer | 字段component容器包裹组件，会渲染在component的外层，需要有default slot                                                     | Component                                                        | -       |
| valueFormatter     | 字段值处理函数，在onUpdateValue前执行，函数返回值将作为更新值，例如：(val) => val?.trim()                                  | (_val_: any, _oldVal_: any) => any;                              | -       |
| modelName          | 组件v-model双向绑定更新属性名，默认'value'                                                                                 | String                                                           | 'value' |

#### useForm

创建表单对象的hook

##### 入参

| 参数名        | 说明                                 | 类型    | 默认值 |
| ------------- | ------------------------------------ | ------- | ------ |
| 参数1（可选） | 表单初始数据对象                     | Object  | {}     |
| 参数2（可选） | 表单字段配置                         | Fields  | []     |
| 参数3（可选） | 是否是根表单，存在表单嵌表单时会使用 | boolean | true   |

##### 出参 **Form**

| 属性名         | 说明                             |
| -------------- | -------------------------------- |
| formData       | 表单数据对象                     |
| getFormData    | 根据字段path获取对应字段值       |
| setFormData    | 根据字段path更新对应字段值       |
| fields         | 字段配置                         |
| setField       | 根据字段path设置字段配置         |
| getField       | 根据字段path获取字段配置         |
| deleteField    | 根据字段path删除字段配置         |
| appendField    | 在指定字段后追加一个字段         |
| prependField   | 在指定字段前插入一个字段         |
| getParentField | 根据字段path获取字段所属父级字段 |
| getParentField | 根据字段path获取字段所属父级字段 |
| formRef        | 表单组件实例引用                 |
| setFormRef     | 设置组件实例引用                 |
