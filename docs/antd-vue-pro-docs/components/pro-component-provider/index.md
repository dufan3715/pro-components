# Pro Component Provider

ProComponentProvider 是一个提供全局组件配置的容器组件。通过该组件可以统一配置所有 Pro 组件的默认属性。

## 何时使用

- 需要为整个应用中的 Pro 组件设置统一的默认属性
- 希望减少重复配置，提高开发效率

## API

### Props

| 参数名         | 说明              | 类型          | 默认值 |
| -------------- | ----------------- | ------------- | ------ |
| component-vars | 需要provide的配置 | ComponentVars | -      |

## ComponentVars 配置项

ComponentVars 包含以下可配置组件：

- `pro-table`: ProTable 组件默认配置
- `pro-form`: ProForm 组件默认配置
- `pro-form-item`: ProFormItem 组件默认配置
- 各种表单字段组件如 `input`, `select`, `date-picker` 等

每种组件可以配置其对应的 Ant Design Vue 组件属性。
