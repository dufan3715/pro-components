---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

fix(base-field): 字段级 `onUpdate:*` 监听器不再被静默丢弃 (R-04)

- 此前字段配置或 attrs 上传入的 `onUpdate:value`（element-plus/vant 为 `onUpdate:modelValue`）会在 BaseField 属性解构时被剥离丢弃，监听器永不触发；
- 现改为与内部写值组合：先写入 formData（含 valueFormatter 转换），随后以组件**原始 emit 值**回放该监听器；`mergeProps` 合并为数组的多个监听器按序全部回放；
- vant-pro 的 popup 型字段同样生效：监听器在 confirm 提交时触发，滚动选择过程的中间值不会误触；
- 四包同构同步修复，新增判别测试 BF-B5 / VP-B5。
