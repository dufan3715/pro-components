---
'@qin-ui/element-plus-pro': patch
---

修复 element 表格的 `default` 插槽误报与空 `key` 列复用问题，并同步文档口径：

- **`default` 插槽提示不再误报（§3 遗留 4）**：原先只要插槽对象上存在 `default` 键就提示一次，**包装组件透传空插槽**（`<ProTable …><slot /></ProTable>` 且外层无内容）会输出误导提示。现按插槽实际产出判定（仅注释节点 / 空白文本不计），确有内容时才提示一次；并在 `ProTable` 的 JSDoc、README 与 docs 显式声明 `default` 保留给列渲染器、不透传宿主表格。
- **空字符串 `key` 的列不再共用渲染 key（§3 遗留 5 附注）**：`key: ''` 此前被视为有效标识，与 `getColumnProps` 的 `columnKey` 取值不一致，多个空 `key` 列会产出相同 vnode key。现空串按「未提供」处理，回退 `prop`，再回退列对象身份。
- **文档同步（§3 遗留 7）**：docs 的 `ProTable` 表补 `addIndexColumn` / `control` 内置默认值 `true` 与 `default` 插槽行、修正列插槽透传说明；`ProForm` 字段表补 `prop` 优先于 `path`、`name` 透传语义与 `disabled` 继承说明；README 与 AI-CONTEXT 补 `useFormData()` 的取值边界（与 `antd-vue-pro` 同句）——`<ProForm :form="form">` 场景下 `useFormData()` 承接的是 ProForm 内部兜底实例的数据 store，与传入实例**非同源**，需同源请用 `useForm(false)` 或直接使用传入实例。
- **注释与死代码**：删除 `useGroupFieldAttrs` 中恒不可达的 `Array.isArray` 分支（`resolveFieldIdentity` 返回 `string`）与 `ProTable` 中 `filter(...)?.length` 的死可选链；列渲染 key 的注释改为行为陈述并纳入 `DOC-01` 守卫。

无公开 API 变更。

破坏性变更：无（`default` 插槽提示仅在确有内容时输出；空 `key` 列此前共用同一渲染 key，修正后列复用正确）。
