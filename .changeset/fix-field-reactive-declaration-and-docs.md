---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

统一字段 `hidden` / `disabled` 的声明口径与文档（不含 getter），四包一致：

- **声明面回到单一真源**：字段 `hidden` / `disabled` 在四包 `BaseCommon` 中一律声明**原始值类型**（`boolean`），类型面与渲染期的响应式形态（`Ref` / `ComputedRef`）由 `WithRef` 统一派生（与 `path` / `label` / `span` 等同族属性一致）。此前 `vant-pro` 把这两个键声明为 `MaybeRefOrComputedRef<boolean>` / `MaybeRef<boolean>`，经 `WithRef` 后形成**二次包装**（`MaybeRefOrComputedRef<MaybeRefOrComputedRef<boolean>>`），类型展示冗余。字段与列的口径差异是设计使然：`Column` 不经 `WithRef`，其 `hidden` 必须显式声明 `MaybeRefOrComputedRef<boolean>`。
- **公开类型面的有效形态不变**：布尔 / `Ref` / `ComputedRef` 均可直接传入，getter 形态仍不在契约内（四包各以 `@ts-expect-error` 锁定）。
- **文档与注释修正**：四包 `BaseFormItem` 的过滤注释与 `docs/*/components/pro-form` 的字段表此前仍宣称支持 getter 形态，现统一为「支持布尔 / `Ref` / `ComputedRef`，渲染期按 `toValue` 取值」；`SlotComponent` 的 JSDoc 补齐「组件定义对象」这一可渲染形态；`BaseFormItem` 的 `@param {Fields<D>}` 改为 `@param {Fields}`（原写法引用了文件内未声明的泛型）；`fieldKey` 标注非对象项兜底分支的适用边界。
- **回归**：`antdv-next` 新增 `DOC-03`（四包类型面声明 / `WithRef` 派生 / 注释 / 文档四处同句，任一包回退或重新引入二次包装即红）与 `SX-06`（17 个包根类型导出可解析，字段 / 列 `hidden` 的 `Ref` / `ComputedRef` 形态无需断言）；`antd` 新增 `BI-A24`；`element` 与 `antdv-next` 的跨包用例改为 `Ref` / `ComputedRef` 形态并去掉 `as any`。

破坏性变更：无（声明与文档口径修正；公开类型面的有效形态不变）。
