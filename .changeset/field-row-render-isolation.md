---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

表单字段行渲染隔离：`setField` 更新单个字段配置或 `hidden` 联动翻转时，仅重渲染对应字段行，其余字段控件保持不动；`getFormItemComputedProps` 返回当前字段的实时 FormItem 属性。字段行的栅格与自定义容器包裹改由行组件直接渲染，字段列表的顶层栅格改为条件分支渲染；未配置 `grid` / `formItemContainer` 时不再产生空包裹组件。内部渲染组件命名对齐为 `BaseFormItems`（字段列表）/ `BaseFormItem`（单字段行）。
