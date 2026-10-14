---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
---

分组列 `children` 纳入公开列类型面（`Column` / `Columns`）：

- **缺陷**：宿主的 `ColumnType` 不含 `children`（分组列由宿主的 `ColumnGroupType` / `ColumnGroupProps` 承载，`children` 未落在 `ColumnType` 上），而本包 `Column` 仅在 `ColumnType` 上做 `Omit` 扩展 —— 导致 `const columns: Column[] = [{ title: '分组', children: [...] }]` **编译不通过**，必须 `as any`；而运行期分组渲染、递归 `hidden` 过滤与列控制均已支持。
- **修复**：
  - `antd-vue-pro` / `antdv-next-pro`：`Column` 新增 `children?: Column<D>[]`（自引用，嵌套分组同样可用）；
  - `antdv-next-pro`：`Omit` 列表补 `'hidden'` —— 其宿主 `ColumnType` 继承自 `@v-c/table` 的 `ColumnSharedType`，**自带 `hidden?: boolean`**；直接交叉会与包内声明形成**交集**（`boolean & MaybeRefOrComputedRef<boolean>`），使 `hidden` 传 `Ref` 报 TS2322。宿主键须先剔除再重声明。
  - `antd-vue-pro` 的 `Omit` 维持 `'dataIndex' | 'key'` 不变：其宿主 `vc-table` 的 `ColumnSharedType` **没有** `hidden`（实测 `'hidden' extends keyof ColumnType` 为 `no`），无从剔除、也无需剔除。`'children'` 也不在其宿主的 `ColumnType` 上（antd 的 `children` 只落在 `ColumnGroupType`），故无需剔除。
  - `element-plus-pro` 无需改动：其 `Column` 早已自带 `children?: Column<D>[]`，且 `Omit` 列表中的 `'children'` 是**必需**的 —— 宿主 `TableColumnCtx` 的 `children` 为 `TableColumnCtx<T>[]`（元素含 `property` 等必填字段），与本包声明的 `Column<D>[]` 形状不兼容，不剔除会形成不可满足的交集（实测去掉即报 `Property 'hidden' does not exist on type 'TableColumnCtx<any>'`）。
- **回归**：新增 `PT-A35`（两包同构）—— 分组列与**嵌套分组**均以 `Column[]` 字面量直接构造（无断言），并锁定嵌套子列 `hidden` 的递归过滤随外部 `ref` 翻转生效；`antd-vue-pro` / `antdv-next-pro` 的 `PT-A19` 同步去掉 `as any`。
- **验证（突变 + 对照实验）**：
  - 移除 `Column` 的 `children` 声明 → TS2353（`'children' does not exist in type 'Column'`）；
  - `antdv-next` 的 `Omit` 去掉 `'hidden'` → TS2322（`boolean & MaybeRefOrComputedRef<boolean>` 交集拒绝 `Ref`）；
  - `element` 的 `Omit` 去掉 `'children'` → TS2339（`Property 'hidden' does not exist on type 'TableColumnCtx<any>'`），证明该键在 element 侧是**必需**的；
  - 对照实验：把 `'children'` 加进 `antd` / `antdv-next` 的 `Omit` → 编译仍通过，证明这两个包的宿主无该键、写进去是空转，故不写入。
- **文档**：两包 `docs/.../pro-table` 的列配置表补 `children` 行。

破坏性变更：无（纯类型面放宽；`children` 此前不可写，新增为可选键）。
