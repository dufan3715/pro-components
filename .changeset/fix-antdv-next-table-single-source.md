---
'@qin-ui/antdv-next-pro': patch
---

表格来源单一性、注入面收紧与尺寸控件高亮修复（CR-094 / CR-098 跨包对齐）：

- **`searchFormConfig` 不再整体下发 `SearchForm`**：`container` / `hidden` 由 `ProTable` 自身消费（容器用于包裹、显隐由 `searchFormVisible` 承担）。此前 `container` 沿 `SearchForm` → `ProForm` → 宿主 `Form` 的 attrs 落到原生 `<form>`，DOM 出现非法属性 `container="[object Object]"`（实测修复前命中）；`hidden` 亦不再进入 DOM 属性通路（`PT-A36` 锁定两键不落 DOM，`hidden: true` 仍隐藏搜索区；与 `antd-vue-pro` / `element-plus-pro` 同构）。
- **Provider 注入面收紧**：`componentVars['pro-table']` 类型面排除 `columns` / `dataSource` / `loading`（此前为「可配但不生效」的误导性配置面），三键由注入层统一静默剔除（见 `@qin-ui/antd-vue-pro` / `antdv-next-pro` / `element-plus-pro` / `vant-pro` 共同的注入面说明）。表格列与数据源来源收敛为 **显式绑定 > `:table` 实例**（`PT-A37` 锁定注入值既不渲染、也不落为宿主表格元素属性）。
- **表格尺寸单一来源与控件高亮**：`size` 取值收敛为 `effectiveSize`（显式绑定 > 尺寸控件回写 > Provider 注入），`SizeControl` 新增 `effectiveSize` 并以它高亮。此前 Provider 注入 `size: 'small'` 时表格实际为紧凑尺寸、尺寸菜单却高亮「默认」（实测修复前 `ATable.size = 'small'` 而 `currentSize = 'large'`）；`table` 插槽作用域的 `size` 此前下发本地 model（未绑定时为 `undefined`），现下发表格有效尺寸（`PT-A38` / `SC-A15` 锁定高亮项、回写优先级与插槽取值）。
- **文档同步**：`README` / `AI-CONTEXT.md` / `docs/antdv-next-pro` 补记 Provider 注入面边界与 `searchFormConfig` 的下发边界；新增 `DOC-04` 契约用例锁定文案不回流。

**注意（契约收紧）**：`componentVars['pro-table'].columns` / `.dataSource` 由「可配置但被运行时忽略」改为「编译期不可配置」；如项目配置中存在这两项，请删除。若确需覆盖列/数据，请改传 `:table` 实例（`useTable`）或对 `ProTable` 显式绑定 `:columns` / `:data-source`。

破坏性变更：无（均为缺陷修复与类型面收紧）。
