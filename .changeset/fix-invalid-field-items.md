---
'@qin-ui/pro-components-core': patch
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

修复字段配置中含 `null` / 原始值项时的渲染期崩溃：

- **现象**：`fields`（含 ProTable 的 `searchFields`）中若混入 `null` / `undefined` / 字符串等非对象项，渲染期会抛 `TypeError: Cannot read properties of null (reading 'hidden')`；非对象项送入实例登记表时还会抛 `Invalid value used as weak map key`。
- **原因**：字段筛选与渲染 key 生成均假定数组项是对象；同类未守卫点在 core、四包 `BaseFormItem` 与三包 `ProTable` 的搜索字段过滤中共有 6 处，评审时只覆盖到 2 处。
- **修复**：core 新增纯逻辑谓词 `isObjectItem(v)`（`v !== null && typeof v === 'object'`，经各包 `shared/core` 统一再导出），fields 侧所有筛选统一为 `isObjectItem(x) && !toValue(x.hidden)` —— 非对象项一律忽略：
  - core `useSearchFormExpand`（搜索字段可见性判定）；
  - 四包 `BaseFormItem.validFields`；
  - antd / antdv-next / element `ProTable` 的搜索字段过滤；
  - 另补四包 `getFieldKey` 与 vant `setComponentRef` 的非对象守卫（antd / antdv-next / element 的同类守卫原本已存在）。
- **行为边界**：`hidden` 的 `Ref` / getter 响应式语义不变；`useGroupFieldAttrs` 的兜底分支自此只处理对象项。
- **回归**：`BI-A15`（四包：`null` / `undefined` 不再抛错且合法字段可用）、`BI-A15b`（四包：原始值项被忽略，仅渲染 1 个表单项）、`PT-A16`（antd / antdv-next）、`PT-A18`（element）：`searchFields` 含非法项时搜索区正常渲染。

破坏性变更：无（原先能渲染的合法配置行为不变；非法项此前会导致崩溃，现被忽略）。
