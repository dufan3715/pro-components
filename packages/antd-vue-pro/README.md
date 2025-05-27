## antd-vue-pro

> 二次封装 ant-design-vue 组件，提供 ProForm 和 ProTable 高级组件。

---

## ✨ 特性

- 🛡️ 基于 ant-design-vue 封装，支持 Vue 3
- 🔥 提供 ProForm 和 ProTable 高级组件
- ⚙️ 支持表单字段动态生成、表格列动态配置

---

## 📦 安装

```javascript
npm i @qin-ui/antd-vue-pro
```

> 注意：从v1.x 升级至 v2.x 版本有api优化调整，useForm/formData由ref调整为reactive
> 注意：从v1.0.x 升级至 v1.1.x 版本有api优化调整，主要涉及到pro-component-provider组件component-vars的参数扁平化，版本升级时需注意

#### 1. pro-component-provider

组件接收参数名为component-vars的props，内部provide所接收的props供所有被包裹的组件inject

##### API

- Props

  | 参数名         | 说明              | 类型          | 默认值 |
  | -------------- | ----------------- | ------------- | ------ |
  | component-vars | 需要provide的配置 | ComponentVars |        |

#### 2. pro-form

ant-design-vue ui组件库form组件的二次封装

##### API

- Props

  | 参数名                                | 说明                                                                                | 类型                                                                                    | 默认值 |
  | ------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------ |
  | form                                  | proform useForm返回对象，传递此参数后formData和fields参数将失效（推荐使用配套hook） | Form                                                                                    |        |
  | grid                                  | 是否启用栅格布局                                                                    | boolean \| GridProps同[antdv Grid的RowProps](https://antdv.com/components/grid-cn/#api) |        |
  | 继承ant-design-vue form组件的所有参数 | [查看文档](https://antdv.com/components/form-cn#api)                                | ...                                                                                     |        |

* Emits

  | 事件参数名                            | 说明                                                 | 类型 | 默认值 |
  | ------------------------------------- | ---------------------------------------------------- | ---- | ------ |
  | 继承ant-design-vue form组件的所有事件 | [查看文档](https://antdv.com/components/form-cn#api) | ...  |        |
