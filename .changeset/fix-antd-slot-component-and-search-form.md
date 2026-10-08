---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

修复插槽组件对象渲染与 `SearchForm` 的必填 `form` 契约（CR-086～CR-089）：

- **插槽渲染组件对象（CR-086）**：`SlotComponent` 的分支判定此前只识别 VNode 与函数，而 `SlotComponentType` 允许直接传组件对象 —— 传入组件对象时会落入文本插值，DOM 中渲染出组件对象的 JSON 文本（自引用对象还可能抛循环引用错误）。现改为**非原始值（非 `string`/`number`/`boolean`/`null`/`undefined`）一律交给 `<component :is>` 渲染**，原始值仍按文本插值。影响 `antd-vue-pro` 与 `antdv-next-pro`（`element-plus-pro` 既有实现已符合该语义）。
- **`SearchForm` 的 `form` 属性默认值移除（CR-087）**：`form` 声明为必填却带 `default: undefined`，运行时 props 选项与类型面不一致（`vue/no-required-prop-with-default` 告警）。现删除该默认值，`form` 保持必填。
  ⚠️ **使用方注意**：若你此前省略 `form`（依赖默认值走「孤立表单」路径，搜索条件与表格脱钩），现在需要在开发期得到明确缺失提示前显式传入 `form`（通常传 `table.searchForm`）；正常用法不受影响。涉及 `antd-vue-pro`、`antdv-next-pro`、`element-plus-pro`。
- **字段 `span` 的栅格语义文档化（CR-088）**：**行为不变** —— 字段显式指定 `span` 时**整体接管栅格**，不再叠加 Provider 注入的响应式断点（`xs`/`sm`/`md`/`lg`/`xl`/`xxl`）；未指定 `span` 时使用注入的断点配置。此前 `useGroupFieldAttrs` 的注释与类型契约表述相反，现已统一为上述行为陈述，并在三包 `pro-form` 文档中同句声明。
- **类型导入收敛（CR-089）**：包内纯类型绑定统一改为 `import type`（不再引入不存在的运行期依赖），并在仓库 ESLint 配置中开启 `@typescript-eslint/consistent-type-imports` 防止回归。该改动为纯类型层，无运行时影响。
