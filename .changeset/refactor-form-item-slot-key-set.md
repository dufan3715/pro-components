---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

refactor(use-group-field-attrs): `FORM_ITEM_SLOT_KEYS` 判定改为模块级 Set（SIMP-07）

字段循环内的 FormItem 插槽名判定由数组 `includes`（O(n) 线性扫描 + `as any` 断言）改为模块级 `Set.has`（O(1)），与同文件 `gridItemPropKeySet` / `formItemPropKeySet` 的既有优化对齐；导出的 `FORM_ITEM_SLOT_KEYS` 常量数组及其元组类型（`GroupedField.formItemSlots` 的键类型来源）保持不变，公开 API 无影响。纯内部实现优化，行为零变化（slots 分组行为由既有 hooks-locale / BaseFormItem 测试覆盖）。
