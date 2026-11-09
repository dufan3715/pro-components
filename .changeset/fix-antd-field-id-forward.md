---
'@qin-ui/antd-vue-pro': patch
---

修复自定义控件与插槽控件未透传 `FormItem` id，导致 `scrollToField` / `scrollToFirstError` 失效的问题：

- **现象**：`ProForm` 通过 `component` 渲染的自定义控件（如原生 input 封装）或字段插槽内的非 antd 控件没有 `id`，`Form.scrollToField` / `scrollToFirstError` 内部 `document.getElementById(fieldId)` 返回 `null`，滚动定位静默失效。
- **原因**：`BaseField` 仅将宿主 `FormItem` 上下文中的 `id` 再 provide 给下游，依赖控件自身消费 antd 内部上下文；不消费该上下文的自定义 / 插槽控件因此拿不到 `id`。
- **修复**：`BaseField` 将宿主 `FormItem` 下发的 `id` 作为控件 `id` 的默认值显式并入控件属性，字段显式 `id` 仍优先；内置控件行为不变。
- **回归**：新增判别用例 `BF-A26`（自定义控件与插槽控件的 `id` 与 `label[for]` 相等、`scrollToField` 命中控件、字段显式 `id` 覆盖）。

破坏性变更：无。
