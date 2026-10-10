---
'@qin-ui/antd-vue-pro': patch
---

修复表单字段控件丢失 `id`、`label[for]` 关联失效的问题（a11y 回归）：

- **现象**：`ProForm` 渲染的输入控件没有 `id`，`<label for>` 指向空值 —— 点击标签不聚焦输入框，`getByLabelText` 等无障碍查询失效。
- **原因**：`BaseField` 调用的 `useInjectFormItemContext()`（ant-design-vue 内部 API）在返回上级 `FormItem` 上下文的同时会向下 `provide` 一份默认上下文，把下游控件拿到的 `id` 与 `onFieldChange` 一并置空。
- **修复**：
  - `BaseField` 不再调用该 API，改为在值写入 `formData` 后广播 `field-value-change` 事件；宿主内置控件（`componentMap` 映射的 ant-design-vue 控件）值变更时自行向 `FormItem` 上报，仅自定义控件经该事件回传，避免同一次值变更触发两条校验通路；
  - `BaseFormItem` 订阅该事件，从既有字段实例登记表（`WeakMap` + `toRaw(field)`）取回 `FormItem` 实例并调用其 `expose` 的 `onFieldChange()` 触发字段校验，保留 `validateTrigger`、`autoLink` 等原生语义（`autoLink: false` 时不自动校验）；
  - 同时移除 `shared/ui` 中该内部 API 的深层引入与再导出（已无引用，属包内私有面）。
- **回归**：新增判别用例 `BF-A15`（`input.id` 与 `label[for]` 相等、必填规则随值变更渲染错误态、无「form item 收集」告警）、`BF-A15b`（自定义控件同样触发变更校验、`autoLink: false` 不触发）与 `BF-A21`（单次输入恰好校验一次：内置控件与自定义控件均不重复校验）。

破坏性变更：无（`field-value-change` 为 `BaseField` 新增内部事件；移除的深层再导出不在包公共 API 面内）。
