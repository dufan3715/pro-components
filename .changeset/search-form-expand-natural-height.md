---
'@qin-ui/pro-components-core': patch
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

修复搜索表单展开/收起的两个问题：

- 筛选条件恰好等于 `minExpandRows` 行时不再误显示展开按钮，行尾留白与行高拉伸不再参与溢出行判定；
- 收起后展开按钮保持可用，不再因折叠高度约束下的重测丢失自然高度而消失；栅格行不再随折叠容器高度拉伸，收起过程不会压缩行内容。
