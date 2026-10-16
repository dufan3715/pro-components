---
'@qin-ui/antd-vue-pro': patch
---

修复表格来源单一性与类型面收紧（P1 批次）：

- **`Column.hidden` 类型面**：`hidden?: boolean` → `hidden?: MaybeRefOrComputedRef<boolean>`（`MaybeRef<T> | ComputedRef<T>`）。运行期本就经 `toValue` 取值，此前传 `Ref` 需 `as any`；`PT-A19` / `PT-A30` 已去掉断言，`PT-A30` 另锁定「经列控制写回后仍与外部 `ref` 保持绑定，外层 ref 翻转继续驱动列显隐」。
- **Provider 注入面收紧**：`componentVars['pro-table']` 类型面排除 `columns` / `dataSource`（此前与 `loading` 同为「可配但不生效」的误导性配置面）。表格列与数据源来源收敛为 **显式绑定 > `:table` 实例**，Provider 注入的同名键不再参与透传（`PT-A27` 锁定注入值既不渲染、也不落为宿主表格元素属性）。
- **`table` 插槽作用域 `size`**：由本地 model 改为表格实际使用的有效尺寸（显式绑定 > Provider 注入）。此前 Provider 注入尺寸时插槽拿到的是 `undefined`，与表格真实尺寸不一致（`PT-A28` 锁定两种来源下插槽 `size` 与表格一致）。
- **`searchFormConfig` 不再整体下发 `SearchForm`**：`container` / `hidden` 由 `ProTable` 自身消费（容器用于包裹、显隐由 `searchFormVisible` 承担），修复 `container` 沿 attrs 落到原生 `<form>` 产生非法属性 `container="[object Object]"`（实测修复前命中）；`hidden` 亦不再进入 DOM 属性通路（`PT-A29` 锁定两键不落 DOM，`hidden: true` 仍隐藏搜索区）。
- **文档同步**：`README` / `AI-CONTEXT.md` / `docs/antd-vue-pro` 同步 `hidden` 口径（`boolean` / `Ref` / `ComputedRef`，不含 getter）与 Provider 注入面边界；列显隐持久化示例改为按 `toValue` 取值（原 `!!column.hidden` 在 `hidden` 为 `Ref` 时恒真）；新增 `DOC-04` / `DOC-05` 契约用例锁定上述文案不回流。

**注意（契约收紧）**：`componentVars['pro-table'].columns` / `.dataSource` 由「可配置但被运行时忽略」改为「编译期不可配置」；如项目配置中存在这两项，请删除。若确需覆盖列/数据，请改传 `:table` 实例（`useTable`）或对 `ProTable` 显式绑定 `:columns` / `:data-source`。

破坏性变更：无（`Column.hidden` 为类型面放宽；其余为缺陷修复与类型面收紧）。
