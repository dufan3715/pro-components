---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

修复兄弟字段共用同一 `path` 时的渲染 key 冲突（四包同构）：

- **现象**：字段列表项使用 `:key="item.path || getFieldKey(item.rawField)"`，两个兄弟字段共用同一 `path` 时 key 相同 → Vue 在列表更新时**原地错位复用**节点（节点身份与字段实例错位），并可能出现重复 key 告警与幽灵节点（vant 为此实现了 `activeFieldId` 多实例隔离）。
- **修复**：渲染 key 一律取**字段对象身份**（`toRaw(field)` 在模块级 WeakMap 中缓存的自增编号），与 `path` 无关 —— 同 `path` 的兄弟字段仍各得其唯一 key。
- **性能（本次修复的重点约束）**：key 从「模板渲染期计算」改为在既有 `computed`（`useGroupFieldAttrs`）中**预计算**，模板仅读取 `item.renderKey` —— **渲染期函数调用由 O(字段数) 降为 0**，WeakMap 只在字段数组变化时查表；同一份模块级 WeakMap（`utils/fieldKey.ts`），字段对象被回收即释放。
- **行为变更**：key 不再随 `path` 变化 —— 修改某字段的 `path` 时不再强制重挂载该字段实例，而是复用实例并更新 props（避免不必要的重建；同时该字段控件的内部状态不再被重置）。
- **回归**：四包新增 `BI-A17` —— 同 `path` 兄弟字段交换后，节点身份随 key 迁移（原 A 节点随 A 移动到新位置），文本与实例保持对应。

破坏性变更：无（同 `path` 字段此前会 key 冲突导致错位，属缺陷；`path` 变更不再重挂载为行为变更，已在 Changeset 说明）。
