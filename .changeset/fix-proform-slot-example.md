---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

修正 ProForm 路径插槽（以字段 `path` 命名的插槽）的文档与示例：示例由只读的 `:value="value"` 写法改为作用域整体透传 `<a-input v-bind="scoped" />`（element-plus / vant 对应 `el-input` / `van-field`），并补充插槽作用域参数说明——字段值、回写通道（`onUpdate:value` / `onUpdate:modelValue`）、`disabled`、`path` 与合并后的控件属性。原示例缺少回写通道，照抄后控件无法编辑字段值。

文档同时标明：作用域键名随字段 `modelProp` 变化；各宿主校验时机不同（antd / antdv-next 写入后触发变更校验，element-plus 由宿主控件事件触发，vant 遵循 Form 级 `validateTrigger`，默认 `onBlur`）。
