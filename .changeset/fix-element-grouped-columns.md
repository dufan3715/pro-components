---
'@qin-ui/element-plus-pro': patch
---

修复表格分组列（多级表头）永不渲染的问题：

- **现象**：列配置中带 `children` 的分组列（如 `{ label: '一级分组', children: [{ prop: 'c1', label: '子列1' }] }`）下，所有子列静默消失——父列表头为空，子列的标题与单元格数据均不出现在表格中，且无任何告警。
- **原因**：`TableColumnRenderer` 原实现把列树递归封装为状态组件；element-plus 仅在父列默认插槽中收集子列，且只接受 `ElTableColumn` 直系 vnode、函数式组件（`shapeFlag & 2`）与 Fragment，状态组件 vnode 被收集逻辑直接丢弃。
- **修复**：`TableColumnRenderer` 改为渲染函数组件，递归生成 `el-table-column` 树，子列以同层 vnode 数组进入父列默认插槽，任意分组层数均成立；自定义 `render` 列改由 scoped slot 函数承载，稳定 key、`hidden` 响应式解包与点分路径取值语义保持不变。
- **回归**：新增 `PT-A17 [判别]` 用例（一级分组 + 三层分组 + 普通列，断言多级表头标题与三列单元格数据），该用例在修复前失败、修复后通过。

破坏性变更：无。
