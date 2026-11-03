---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

修复字段配置中的显式 `undefined` 冲掉 Provider 默认值与 locale 占位符兜底的问题：字段 attrs 参与合并前剔除 `undefined` 键，未赋值的属性不再覆盖注入默认值；显式空字符串 / `false` / `null` 仍按字段值下发。
