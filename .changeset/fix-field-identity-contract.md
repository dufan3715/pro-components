---
'@qin-ui/pro-components-core': patch
'@qin-ui/element-plus-pro': patch
---

统一「字段标识」契约（宿主标识键优先于 `path`）并修复 element 的两处相关问题：

- **element：`ProLocale` 类型放宽**。此前 `ProLocale = typeof zhCN`（`as const` 字面量）使 `Partial<ProLocale>` 只接受与内置文案逐字相同的值，`:locale="{ 'table.query': '搜索' }"` 必然类型报错。现为 `Record<keyof typeof zhCN, string>`，保留本包 `date-picker.*` 等扩展键，取值放宽为任意字符串。
- **element：字段标识改为 `prop` 优先**。`el-form-item` 的标识属性是 `prop`（对应 antd/vant 的 `name`），但此前实现照搬了 `name ?? path`：`{ path: 'a', name: 'b' }` 会绑到 `b` 且 `name` 被吞掉，`{ prop: 'a', path: 'b' }` 会被 `path` 覆盖。现统一为「宿主标识键优先于 `path`」——element 取 `prop ?? path`，`name` 不再参与标识解析，作为控件自身属性透传（`el-form-item` 无 `name` prop）。
- **core：标识键可配置化（新增 API）**。新增 `resolveFieldIdentity(field, keys)`、`DEFAULT_FIELD_IDENTITY_KEYS = ['name', 'path']` 与 `UseFieldsOptions`；`useFields(fields, { fieldIdentityKeys })` 与 `useForm(initData, fields, root?, options?)` 支持自定义标识键序。此前 core 的字段查找 API（`getField` / `setField` / `deleteField` / `getParentField`）固定按 `name ?? path` 解析，与 element 的渲染标识不一致（`{ prop: 'a' }` 时 `getField('a')` 静默 miss），现字段读写、表单域标识与查找 API 共用同一解析结果。
- **`antd-vue-pro` / `antdv-next-pro` / `vant-pro`**：hook 内联的 `name ?? path` 收口到 `resolveFieldIdentity(field)`（默认键序，行为不变），并各补 1 条规则锁用例；`shared/core` 补再导出以符合统一导入契约。无用户可见行为变更。

**行为差异披露**：标识解析结果统一经 `normalizePathKey` 归一化，方括号写法（如 `path: 'a[0]'`）渲染到 DOM `path` 属性与 `:path` 的值为 `a.0`；语义等价，且此前 hook 与 core 查找对该写法本就不一致。

**迁移提示**：

1. element 下若曾用 `prop` 表示「仅校验路径、值绑定用 `path`」的解耦写法，现 `prop` 即字段标识（优先于 `path`），请改用 `path` 单独声明绑定路径；
2. element 下若曾仅用 `name` 作字段标识，请改用 `path`（该写法在 element 类型层本就不受支持：`BaseCommon` 只声明 `path`，`name` 由控件 props 合入）。
