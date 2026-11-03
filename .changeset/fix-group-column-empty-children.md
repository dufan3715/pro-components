---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
---

修复 ProTable 分组列的子列全部隐藏后残留空表头与空单元格的问题：递归过滤后子列为空的分组列整体移除（含嵌套分组），表头列数与行单元格数恢复一致。
