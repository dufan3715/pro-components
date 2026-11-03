---
'@qin-ui/antdv-next-pro': patch
---

修复 ColumnControl 在 antdv-next 下的两处交互退化：菜单行整行点击即可切换列显隐（此前仅勾选框可点，行内空白区域无响应），与 antd-vue-pro / element-plus-pro 同构包一致；分割线菜单项补齐唯一 `key`，与同数组其他动态项保持一致。
