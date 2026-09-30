---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
---

修复表格尺寸无法经 `ProComponentProvider` 配置的问题，并收紧 `loading` 的配置面：

- **缺陷**：`ProTable` 模板中 `:size` / `:loading` 绑定位于 `v-bind="computedTableProps"` 之后，props 合并时后写覆盖 —— 未显式绑定时 `size` 为 `undefined`、`loading` 为默认 `false`，导致 `<ProComponentProvider :componentVars="{ 'pro-table': { size: 'small' } }">` 注入的表格尺寸被静默清空。
- **修复**：
  - `size` 改为在 `computedTableProps` 内求解优先级：本地显式绑定（`:size` / `v-model:size`）或已由 `SizeControl` 写入时使用本地值，否则保留 Provider 注入值；模板移除多余的 `:size` 显式绑定。
  - `loading` 从 `componentVars['pro-table']` 契约中移除（类型层 `Omit<TableProps, 'loading'>`，运行时 `computedTableProps` 写死 `undefined`）——表格 loading 仅由组件自身状态（含搜索竞态守卫）驱动，不再接受全局默认值注入。
  - 新增 `PT-A14 [判别]` 用例：Provider `size` 未绑定时生效、显式绑定优先、Provider `loading` 不生效，并以 `@ts-expect-error` 锁定「`loading` 不可配置」的编译期契约。
- **注意（契约收紧）**：`componentVars['pro-table'].loading` 由「可配置但被运行时覆盖」改为「编译期不可配置」；运行时行为与原先一致（原本就不会生效），如项目配置中存在该项，请删除该键。`element-plus-pro` / `vant-pro` 不受影响（前者 `resolvedSize` 已按 本地 → attrs → Provider 取值，且其 `ElTable` 无 `loading` prop）。

破坏性变更：无（仅类型面收紧 `loading`，`size` 为缺陷修复）。
