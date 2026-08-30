---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
---

fix(pro-table): 修复 ProTable 丢弃 Provider 级 onChange 配置的问题 (R-02)

- `onTableChange` 现按「模板监听器优先，未绑定时回退 Provider 全局配置」回放 onChange（与其余属性覆盖语义一致），修复 `componentVars['pro-table'].onChange` 因 `computedTableProps` 显式置空 onChange 而永不被调用的问题；
- `@qin-ui/antd-vue-pro` 与 `@qin-ui/antdv-next-pro` 同构同步修复；
- `@qin-ui/antdv-next-pro` 补齐 Provider 配置类型的事件成员：新增 `TableComponentProps` 类型（基于组件 SetupFn props 提取，含 `onChange`/`onExpand` 等强类型处理器；此前导出的 `TableProps` 类型不含事件成员），`componentVars['pro-table']` 现支持 `onChange` 等事件的类型提示；
- 新增判别测试 PT-A11（仅 Provider 配置时回放生效）/ PT-A12（与模板 @change 并存时模板优先）。
