# packages/antd-vue-pro 修改清单（734e3c0 → 当前）

## 概览

- **提交数**：27（`git log --oneline 734e3c0..HEAD -- packages/antd-vue-pro`）。复核期间 HEAD 由 `74030da` 前进到 `e73293a`（评审侧把复核前尚在工作区的 AI 文档/AI-CONTEXT/`@types/node` 改动收口提交），随后又有 `cc50e9e`（仅 core，`git show --stat cc50e9e` 未触及本包）；本包工作区始终干净（`git status --porcelain -- packages/antd-vue-pro` 无输出），`git diff --stat 734e3c0` 恒为 42 文件 / +2340 / −357，故下述清单 = 734e3c0 → 当前 的全部差异。
- **文件数**：42（`git diff --stat 734e3c0`，+2340 / −357）：`src` 22 个、测试与基建 15 个、文档 2 个（README / AI-CONTEXT）、配置 3 个（package.json / tsconfig.json / vitest.config.ts）。
- **用例数**：**86 → 133**（改前为 734e3c0 树的静态计数：10 个 spec，无 `it.each`；改后为 `npx vitest run` 实测：13 个测试文件 133 用例，其中 `ProTable.spec.ts` 的 29 个 `it` 含 1 个 `it.each`(2 例)）。
- **门禁结果**：`npx vitest run` 133/133 通过 ✅；`npx vue-tsc --noEmit` 退出码 0、无输出 ✅；`pnpm --filter "@qin-ui/antd-vue-pro" build` 成功 ✅。附加校验：`npx eslint` 0 error（305 warning，均为既有 `no-explicit-any`）；`npx prettier --check` 全通过；`node scripts/check-test-ids.mjs` ✓。
- **结论分布**：24 个修改点中 **❌ 1 条**（重复字段校验，见第 13 条）、**⚠️ 10 条**（见「遗留与建议」）、其余 ✅。

---

## 修改点

### 1. 表格属性面命名收敛：`TableComponentProps` → `TableProps`，宿主导入改名 `_TableProps`

- **位置**：`src/shared/ui/index.ts:1-7`、`src/shared/ui/index.ts:44`、`src/shared/ui/index.ts:63-71`；使用方 `src/components/table/components/ProTable.vue:49-54,119,137-139,154-156,271-279`、`src/components/component-provider/types/index.ts:1-12,49`
- **修改点**：改动前 `import { TableProps } from 'ant-design-vue'` 并原样再导出 `type TableProps`，另有 `export type TableEmitProps = {...}` 与 `export type TableComponentProps = TableProps & TableEmitProps`；改动后宿主类型以 `TableProps as _TableProps` 仅作推导，宿主原始 `TableProps` **不再**从 `shared/ui` 再导出，`TableEmitProps`/`TableComponentProps` 取消，改为本包 `export interface TableProps extends _TableProps { 'onUpdate:expandedRowKeys'?: ComponentProps<typeof Table>['onUpdate:expandedRowKeys'] }`；`ProTable` 的 Props 交叉成员同步由 `TableComponentProps` 改为 `TableProps`。
- **解决的问题**：同一文件内三套 `TableProps` 语义并存（宿主 / 本包 / 组合），且 `TableEmitProps` 只补一个键却另立名字；与文件内既有 `FormProps` / `_FormProps` 约定不一致（CR 未编号，见提交 74030da「命名收敛」）。
- **影响**：类型契约收敛（emit 型 attrs 入口 `v-model:expanded-row-keys`、`componentVars['pro-table'].onChange` 的类型提示保持可用）；`shared/ui` 属包内内部模块、`TableComponentProps` 从未出现在公共导出面（`src/components/table/index.ts` 仅导出 `ProTableProps`/`ProTableInstance`/`Column(s)`/`useTable`），故**非 breaking、无需 Changeset**（与 74030da 提交信息一致）。改为 `interface` 是为规避声明产物 TS2742。
- **证据**：`__tests__/ProTable.spec.ts:1126`（PT-A26，含 `TableProps['onUpdate:expandedRowKeys']` 赋值与 `@ts-expect-error` 锁 `onScroll` 不存在）；提交 74030da、2429b61。
- **复核结论**：✅ 无误（宿主导出未被再导出、无 52 键手写清单；`Object.keys(tableProps())` 由宿主提供键名，见第 3 条）。

### 2. `TableProps` 的 emit 键单键补丁来自宿主类型索引，不手写签名

- **位置**：`src/shared/ui/index.ts:67-71`
- **修改点**：由「手写 `TableEmitProps` 键清单」→ 单键 `'onUpdate:expandedRowKeys'`，其类型经 `ComponentProps<typeof Table>[...]` 索引取得。
- **解决的问题**：ant-design-vue 4.2.6 的 `TableProps` 未声明该 emit 键，导致 `v-model:expanded-row-keys` 无类型入口；实测 `onChange` / `onExpand` / `onExpandedRowsChange` / `onResizeColumn` 已在宿主 `TableProps` 内，唯一缺口仅此一键，宿主亦未导出 emits 类型（`Table.emits === undefined`）。
- **影响**：类型契约（事件入口）；不新增键清单、不伪造 `@scroll`。**非 breaking**。
- **证据**：PT-A26（`__tests__/ProTable.spec.ts:1126-1175`，含真实 `hostTable.vm.$emit('update:expandedRowKeys', ['1'])` 回写断言）；`__tests__/ProTable.spec.ts:1161` 的 `@ts-expect-error` 经 `vue-tsc` 仍生效（tsconfig `include: ["src","__tests__"]`，失效会报 TS2578）；提交 2429b61、74030da。
- **复核结论**：⚠️ 见「遗留与建议」W4（该边界说明在 74030da 中被从 JSDoc 删除）。

### 3. `tableProps()` 复用宿主导出，未落地手写键清单

- **位置**：`src/shared/ui/index.ts:47`（`export { type ColumnType, tableProps } from 'ant-design-vue/es/table'`）；消费点 `src/components/table/components/ProTable.vue:90`（`Object.keys(tableProps())`）与 `:137-139,154-156`
- **修改点**：表格透传键集合始终来自宿主 `tableProps()`（宿主内部 `Table.js:32` 的 props 描述表），仓库内不存在 `FALLBACK_TABLE_PROP_KEYS` / `TABLE_PROP_*` 之类常量清单。
- **解决的问题**：避免宿主升级后键集合陈旧（「复用优先」原则，CR-077④ 对齐项）。
- **影响**：运行时行为（attrs 过滤范围随宿主变化）；无公开 API 变化。
- **证据**：`grep -rn "TABLE_PROP" packages/antd-vue-pro/src` 无命中；提交 2429b61（该提交为 antdv-next 删除 52 键清单，antd 侧本就复用宿主）。
- **复核结论**：✅ 无误（禁止项满足）；降级告警能力缺口见 W9。

### 4. Provider 注入的表格 `size` 不再被静默清空

- **位置**：`src/components/table/components/ProTable.vue:158`（`size` model）、`:263-269`（`isBoundProp`）、`:271-286`（`computedTableProps`）
- **修改点**：改动前模板在 `v-bind="computedTableProps"` 之后仍写 `:size="size"`（未绑定时为 `undefined`，后写覆盖注入值）→ 改动后删除该绑定，`size` 在 `computedTableProps` 内求优先级：本地显式绑定（`:size` / `v-model:size`）或已由 `SizeControl` 写入时用本地值，否则保留 `injectAttrs.size`。
- **解决的问题**：`<ProComponentProvider :componentVars="{ 'pro-table': { size: 'small' } }">` 注入的表格尺寸被清空（CR-071 P1）。
- **影响**：运行时行为修复（尺寸来源单一：本地 model → Provider → 宿主默认）；模板不再出现第二条 `size` 通路。
- **证据**：PT-A14（`__tests__/ProTable.spec.ts:616-666`：Provider `size: 'small'` 生效、显式 `size: 'large'` 优先）；SC-A13（`controls.spec.ts:43`，SizeControl 挂载时不静默回写）；提交 5e02ba7。
- **复核结论**：✅ 无误。

### 5. `loading` 退出 `componentVars['pro-table']` 契约（类型 + 运行时 + 契约锁）

- **位置**：`src/components/component-provider/types/index.ts:49`（`Omit<TableProps, 'loading'>`）、`src/components/table/components/ProTable.vue:276`（`loading: undefined` 强制）与 `:507`（`:loading="loading"`）
- **修改点**：类型层允许注入 `loading` → 类型层排除、运行时写死 `undefined`，表格 loading 仅由组件自身状态（含搜索竞态守卫 `searchSequence`，`ProTable.vue:161-196`）驱动。
- **解决的问题**：注入的 `loading` 本就无效却被类型接受，属误导性配置面（CR-071）。
- **影响**：**类型面收紧**（`componentVars['pro-table'].loading` 由「可配但被覆盖」变为「编译期不可配」），运行时行为与原先一致；Changeset `.changeset/fix-pro-table-provider-size.md` 已声明「如项目配置中存在该项请删除」；四包对齐（antdv-next 同改，element/vant 无 `loading` prop，不受影响）。
- **证据**：PT-A14（`ProTable.spec.ts:616-666`：注入 `loading: true` 后宿主 `loading` 仍为 falsy；`ProTable.spec.ts:660` 的 `@ts-expect-error loading 已从 componentVars.pro-table 契约中移除` 在 `vue-tsc` 下仍生效）；提交 5e02ba7。
- **复核结论**：✅ 无误。

### 6. 分组子列 `hidden` 递归生效，未变动列保持原对象引用

- **位置**：`src/components/table/components/ProTable.vue:331-360`（`filterVisibleColumns` + `visibleComputedColumns`）、`:341`（`isObjectItem` + `toValue(column.hidden)`）
- **修改点**：顶层 `filter(item => !item.hidden)` → 递归过滤（含 `children`），仅在确实过滤掉子列时对该列生成浅拷贝，其余列保持原引用；每次 columns 变化执行一次（在 `computed` 内，不在渲染期递归）。
- **解决的问题**：分组列的子列 `hidden: true`（含 `ref`）仍被渲染（三包同构缺陷，CR-073 类）。
- **影响**：运行时行为修复（含响应式 `hidden`）；下发宿主的列对象引用稳定性（其余列 `toRaw(passed[i]) === 原对象`）。
- **证据**：PT-A19（`ProTable.spec.ts:762-820`：表头/表体均不含被过滤子列、`ref(true)→false` 后子列出现、未变动列引用恒等、下发宿主的子列已剔除）；提交 c7f85e7、a5a1542（文档同步）、`.changeset/fix-grouped-column-hidden.md`。
- **复核结论**：✅ 无误（JSDoc 与实现一致：`table/types/index.ts:58-59`「分组列的子列同样参与过滤（递归生效）」）。

### 7. 序号列按「有效分页」偏移

- **位置**：`src/components/table/components/ProTable.vue:299-313`（`getIndex` 读 `computedPagination`）、`:315-321`（`indexColumn`）
- **修改点**：`pageParam.current/pageSize` → `computedPagination.value.current ?? pageParam.current ?? 1`（pageSize 同理），即 attrs/Provider 的分页配置优先。
- **解决的问题**：分页来自 attrs/Provider 时序号偏移错误（CR-077① 对齐）。
- **影响**：运行时行为修复；`computedPagination` 定义在 `getIndex` 之后，但仅在 `customRender` 渲染期调用，无 TDZ 风险。
- **证据**：PT-A23（`ProTable.spec.ts:990-1016`：`pagination:{current:2,pageSize:5}` → 首行序号 6）；提交 2429b61。
- **复核结论**：✅ 无误。

### 8. 搜索告警按原因分键去重，未配置 `search` 不再误报

- **位置**：`src/components/table/components/ProTable.vue:163-186`（`SEARCH_WARN_MESSAGES` / `warnedSearchReasons` / `_search`）
- **修改点**：单个 `warnedSearchConfig` 布尔 → 按原因分键的 `Set`；`const search = props.search || attrs.onSearch; if (!search) return;` 先判空再校验 Promise。
- **解决的问题**：两类语义不同的告警互相静音；未配置 `search` 时点击搜索误报「未返回 Promise」（CR-077③ 对齐）。
- **影响**：开发期告警行为；去重位为组件实例级（`<script setup>` 顶层 = 每实例一份）。
- **证据**：PT-A24 / PT-A24b（`ProTable.spec.ts:1018-1090`：两类告警各一次、同原因不重复、未配置时 0 条）；提交 2429b61。
- **复核结论**：✅ 无误。

### 9. `search-form` / `table` 插槽补作用域参数

- **位置**：`src/components/table/components/ProTable.vue:453-456`（`{ form, search, reset }`）、`:493-503`（`{ columns, dataSource, pagination, loading, size, onChange }`）
- **修改点**：两个具名插槽由无作用域 → 补齐作用域参数（纯增量，未收紧 Slot 类型面）。
- **解决的问题**：自定义插槽无法拿到表格状态与动作（CR-078④）。
- **影响**：运行时行为 + 能力对齐（与 antdv-next/element 同构）；JSDoc `@slot`（`ProTable.vue:44,47`）与实现一致。
- **证据**：PT-A25（`ProTable.spec.ts:1090-1124`）；提交 2429b61。
- **复核结论**：⚠️ 见 W6（`size` 下发的是本地 model 而非有效值）。

### 10. 列 / 搜索字段中的 `null`、原始值项不再崩溃

- **位置**：`src/components/table/components/ProTable.vue:341`（列）、`:408`（`searchFormVisible` 的字段过滤）；`src/components/table/components/ColumnControl.vue:42`（`props.columns.filter(isObjectItem)`）；`src/components/form/components/BaseFormItem/index.vue:55-60`（`validFields`）
- **修改点**：渲染侧统一 `isObjectItem(field/column) && ...`；`isObjectItem` 由 `shared/core` 再导出（`src/shared/core/index.ts:33`，core `shared/utils/index.ts:54`：「仅非 null 的对象视为有效项」）。
- **解决的问题**：`columns: [null, {...}]` / `fields: [null, 'x', {...}]` 时读取 `.hidden` 抛错（CR 类：5a8a20d / bc0dd02）。
- **影响**：运行时健壮性；非法项被静默丢弃（`changed=true`）。
- **证据**：PT-A16 / PT-A17（`ProTable.spec.ts:712-760`）、BI-A15 / BI-A15b（`BaseFormItem.spec.ts:331-380`）；提交 5a8a20d、bc0dd02。
- **复核结论**：✅ 无误（注意 `isObjectItem` 对数组亦返回 true，属 core 既有语义，本次未改）。

### 11. `SearchForm` 的 `form` 回归严格必填

- **位置**：`src/components/table/components/SearchForm.vue:24-37`（类型 `form: Form`）、`:85-93`（`withDefaults` 已无 `form`）
- **修改点**：删除 `form: undefined` 默认值（其余默认值保留）。
- **解决的问题**：类型声明必填却带运行时默认值，与类型面不一致并触发 `vue/no-required-prop-with-default`（CR-087）。
- **影响**：**契约收紧**（省略 `form` 的用法不再被默认值兜底，需显式传 `table.searchForm`）；Changeset `.changeset/fix-antd-slot-component-and-search-form.md` 已附「使用方注意」。仓库内 34 处 `mount(SearchForm)` 均显式传参，无用例依赖默认值。
- **证据**：SF-A16（`SearchForm.spec.ts:546-556`：`required === true` 且 `'default' in formProp === false`，并以 `@ts-expect-error`（`SearchForm.spec.ts:547`）锁定「不得改回可选」）；提交 0f61b82。
- **复核结论**：✅ 无误。

### 12. 默认查询按钮去掉独立 `@click`，统一经表单 submit 触发

- **位置**：`src/components/table/components/SearchForm.vue:128-131`（`onSearch` 注释）、`:139`（`<ProForm ... @submit.prevent="onSearch">`）、`:164-170`（`Button type="primary" html-type="submit"`，已无 `@click`）
- **修改点**：默认查询按钮同时挂 `@click` 与 `html-type=submit` → 仅保留 submit 通路（`:135-140` 的 `@submit.prevent` 落到 `ProForm` → 宿主 `AForm` 的原生 `<form>`）。
- **解决的问题**：真实浏览器中 click 与 submit 双触发导致同一次查询执行两次（CR-033～CR-050 组内修复）。
- **影响**：运行时行为修复；自定义 `searchButton`（`:157-163`）仍按 `ButtonProps.onClick`（`SearchForm.vue:21`）契约由调用方自行触发，若其内部再渲染 submit 按钮仍可能叠加（见遗留 nr.3）。
- **证据**：SF-A17（`SearchForm.spec.ts:246-275`：回车 submit → 1 次 `search`，点击 → 恰好再 1 次，即回归锁为「点击不叠加独立 click 处理器」）；提交 e689378。
- **复核结论**：✅ 无误（JSDoc/注释与行为一致）。

### 13. BaseField 不再调用 `useInjectFormItemContext`，改 `field-value-change` 广播（修复控件 id / `label[for]`）❌ 附带回退

- **位置**：`src/components/form/components/BaseField/index.vue:74-80`（新增 emit 与 `triggerFormItemChange`）、`:134`（写值后广播）；`src/components/form/components/BaseFormItem/index.vue:113-121`（`onFieldValueChange`）、`:202`（`@field-value-change="onFieldValueChange(item)"`）；`src/shared/ui/index.ts:55`（不再再导出该宿主内部 API）
- **修改点**：删除 `useInjectFormItemContext()`（它在取回上级 FormItem 上下文的同时向下 provide 默认上下文，使内层控件拿到空 `id`/空 `onFieldChange`），改为值写入 `formData` 后 emit `field-value-change`，由上级 FormItem 从既有 `formItemInstanceMap`（`WeakMap` + `toRaw(field)`，`BaseFormItem.vue:84-111`）取回实例并调用其 expose 的 `onFieldChange()`；`autoLink === false` 时保持「用户自行校验」语义（`item.formItemProps?.autoLink` 取自宿主 `formItemProps()` 键集合，宿主 `FormItem.js:91` 确有 `autoLink`）。
- **解决的问题**：输入控件丢失 `id`、`<label for>` 失联、点击标签不聚焦，`getByLabelText` 失效；自定义控件的变更校验为空实现（CR-082 P1）。
- **影响**：运行时行为修复（a11y + 校验联动，内置与自定义控件一致）；`field-value-change` 为 BaseField 内部事件、被移除的深层再导出不在公共 API 面内 → **非 breaking**（Changeset `.changeset/fix-antd-field-id-label.md`）。
- **证据**：BF-A15（`BaseField.spec.ts:422`：`input.id === label[for]`、必填错误态随值变更渲染、无字段项收集告警）、BF-A15b（`BaseField.spec.ts:465`：自定义控件经事件触发校验、`autoLink:false` 不触发）；提交 0ad097a。
- **复核结论**：❌ **问题（本次改动引入重复校验）**。宿主内置控件自身也会调用 FormItem 上下文：`node_modules/ant-design-vue/es/input/Input.js:116`、`es/select/index.js:139`、`es/input-number/index.js:106` 均调用 `formItemContext.onFieldChange()`；修复后该上下文重新有效，于是**一次值写入触发两条校验通路**（控件自报 + BaseField 事件）。在 `/tmp/antd-probe`（仓库外临时目录，未写入仓库）以同一 `rules.validator` 计数实测：仅派发一次真实 `input` 事件时，**当前实现 validator 调用 2 次，734e3c0 旧实现 1 次**（`setValue` 双写场景为 4 次 vs 2 次）。后果是内联/异步（远程）校验器每次输入执行两遍，`validateFirst` 亦无法消除。建议二选一：(a) 在 `BaseFormItem.onFieldValueChange` 内按「同一 tick + 同一字段」合并（如 `nextTick` 去重、或记录已触发值）；(b) 仅对 Ant Design Vue 内置组件（宿主会自报的 `component` 键）不重复触发，自定义控件仍走事件路径。无论哪种都应补一条判别用例锁定「单次输入 → 校验器恰好 1 次」，当前测试只断言「错误态被渲染」（BF-A15），无法发现该回退。

### 14. 字段渲染 key 改用对象身份（新增 `utils/fieldKey.ts`）

- **位置**：`src/components/form/utils/fieldKey.ts:1-26`（新文件，模块级 `WeakMap` + 自增种子）；`src/components/form/components/BaseFormItem/index.vue:164`（`:key="item.renderKey"`）、`src/components/form/hooks/useGroupFieldAttrs.ts:30,110,122`（`renderKey`）
- **修改点**：原先 `<script setup>` 内的 `getFieldKey` + `:key="item.path || getFieldKey(item.rawField)"`（`path` 相同即 key 冲突；`<script setup>` 顶层其实每实例一份而非「模块级」）→ 抽为真实模块的 `getFieldKey`，`renderKey` 一律取对象身份；非对象项按字面量生成 `raw_*` key。
- **解决的问题**：同 `path` 兄弟字段 key 冲突，字段交换后节点/实例错位（CR 类：dc29ccc）。
- **影响**：运行时渲染 key；`BaseFormItem` 不再残留 `fieldKeySeed`/`WeakMap`（原注释「无 path 字段的稳定渲染 key」随之删除）。
- **证据**：BI-A17（`BaseFormItem.spec.ts:408-441`：同 path 两字段交换后 DOM 元素随 key 迁移）、BI-A5（`BaseFormItem.spec.ts:148` 无 path 字段）；提交 dc29ccc、d905ed2（补 JSDoc）。
- **复核结论**：✅ 无误。

### 15. 字段实例访问器纳入公开类型面

- **位置**：`src/components/form/types/index.ts:309-312`（`Field = (FieldTypeMap<D>[C] | WithFields<D>) & AdditionalMethods<FormItemInstance>`）、`:22-23`（`import type { AdditionalMethods }`、`FormItemInstance`）
- **修改点**：`Field` 交叉 core 的 `AdditionalMethods<FormItemInstance>`（core `form/types.ts:102-122`，四个访问器全为可选方法）。
- **解决的问题**：`field.getFormItemRef()` 等运行时已有、类型面缺失，业务需 `as any`（CR 类：3a99eb0）。
- **影响**：类型契约（纯增量，方法可选故对象字面量配置不受影响）。
- **证据**：BI-A16（`BaseFormItem.spec.ts:382-406`：`const field: Field = ...` 后直接访问四个访问器，无需断言）；提交 3a99eb0。
- **复核结论**：✅ 无误。

### 16. 字段标识统一由 core `resolveFieldIdentity` 解析（`name` > `path`）

- **位置**：`src/components/form/hooks/useGroupFieldAttrs.ts:9,101,114`；消费方 `src/components/form/components/BaseFormItem/index.vue:171-177`（`:name="toPath(item.path)"`、`:path="item.path"`）
- **修改点**：`(toValue(name) ?? toValue(path))` 与数组 `join('.')` 的手写分支 → core `resolveFieldIdentity(field)`（默认键序 `['name','path']`，`packages/core/src/form/useFields.ts:26,38-47`，经 `normalizePathKey` 归一化）；对象项与兜底分支共用同一解析。
- **解决的问题**：渲染标识与 core 字段查找 API（`getField`/`setField` 走同一 `resolveFieldIdentity`）口径不一（CR 类：bd888e9）。
- **影响**：类型/运行时契约统一；**语义无变化**（`name` 优先于 `path` 的行为与改前一致），`name` 仍被解构剥离、不下发控件。
- **证据**：`__tests__/cross-package.spec.ts:287-310`（`{ name:'a', path:'b' }` → 值写入与 `getField` 均按 `a`）；BI-A3（`fields` 变异后实例精准绑定）；提交 bd888e9、0f61b82。
- **复核结论**：⚠️ 见 W8（`name` 优先级未在包文档/类型 JSDoc 中说明，且与 element-plus-pro 的 `name` 语义不同）。

### 17. `SlotComponent` 组件对象渲染修正

- **位置**：`src/components/form/components/SlotComponent/index.vue:18-25`（`isRenderable`）
- **修改点**：`isVNode(c) || typeof c === 'function'` → 「非 `null`/`undefined` 且 `typeof` 为 `function` 或 `object`」，即非原始值一律交 `<component :is>`，`string/number/boolean/null/undefined` 仍文本插值。
- **解决的问题**：`SlotComponentType` 明确允许组件对象，但传对象会落入文本插值，DOM 出现组件对象 JSON 文本、自引用对象抛循环引用错误（CR-086）。
- **影响**：运行时行为修复（antd / antdv-next 同构；element 既有实现已符合、vant 另有登记）。
- **证据**：BI-A20（`BaseFormItem.spec.ts:446-483`：组件对象渲染组件本体、字符串仍为纯文本）；提交 0f61b82、2429b61。
- **复核结论**：✅ 无误（注释列举三类而实现按「非原始值」判定，属行为陈述的合理简化，见遗留 nr.4）。

### 18. `src/index.ts`：JSDoc 分段绑定 + `install` 名称兜底

- **位置**：`src/index.ts:11-30`（`export { ProForm }`）、`:31-48`、`:49-64`、`:80-87`（`ProComponentProvider.name ?? 'ProComponentProvider'`）
- **修改点**：三段组件说明原先写在同一个 JSDoc 块中、仅最后一段绑定导出（IDE 中 ProForm/ProTable 文档丢失）→ 拆为三段各贴对应 `export`；`app.component(ProComponentProvider.name!, ...)` 去掉非空断言。
- **解决的问题**：CR-024（JSDoc 绑定）、CR-025（非空断言）。
- **影响**：文档可见性 + 去掉断言且不产生 `undefined` 注册名；运行时行为不变。
- **证据**：SX-01 / SX-02（`index.spec.ts:35-68`：导出键集合与 `install` 注册名 `['ProForm','ProTable','ProComponentProvider']`）；提交 077f293。
- **复核结论**：✅ 无误。

### 19. `shared/core` 再导出补齐 + 全包 `import type` 收敛

- **位置**：`src/shared/core/index.ts:6-9`（`type AdditionalMethods`/`localePacks`/`normalizeColumn`/`normalizeColumns`）、`:16-17`（`resolveFieldIdentity`/`DEFAULT_FIELD_IDENTITY_KEYS`）、`:33`（`isObjectItem`）；`import type` 收敛涉及 17 个源文件（如 `src/components/form/components/ProForm/index.vue:45-50`、`src/components/table/components/SearchForm.vue:71-74`、`src/components/component-provider/constants/index.ts:1-3`）
- **修改点**：core 已公开但适配层取不到的 API 按 §1.3 统一导入契约补齐再导出；纯类型绑定改为 `import type`（仓库 ESLint 开启 `@typescript-eslint/consistent-type-imports`）。
- **解决的问题**：CR-025（导出面缺失）、CR-089（类型导入混用，历史上会把不存在的运行期依赖引入产物）。
- **影响**：**新增公共导出**（`normalizeColumn` / `normalizeColumns` / `localePacks`）；`import type` 为纯类型层、无运行时影响。
- **证据**：`SX-01` 导出键集合用例（`index.spec.ts:35`）、`setup.spec.ts` SETUP-03（core 符号引用恒等）；提交 077f293、0f61b82；Changeset `.changeset/fix-adapters-export-surface-and-contracts.md`。
- **复核结论**：✅ 无误。

### 20. 注释 / JSDoc 行为化改写与契约文案收敛（含列 `hidden` 文案纠错）

- **位置**：`ProTable.vue:2-48`、`SearchForm.vue:41-70`、`BaseFormItem/index.vue:2-25,80-83,95`、`useGroupFieldAttrs.ts:60-72`、`form/types/index.ts:106-120,263-268`、`table/types/index.ts:53-61`、`BaseField/index.vue:126`
- **修改点**：删除实现手段/动机/改动史表述（「替代数组 includes 线性扫描」「WeakMap 不参与响应式追踪」「shallowRef 形态…建立依赖」「守卫过渡状态或空列下 column 为 undefined」等）改为行为陈述；`ProTable`/`SearchForm` 补 `@template`/`@param`/`@slot`；栅格边界在源码注释、字段类型 JSDoc、组件文档三处同句；列 `hidden` 文案由「仅接受布尔值，列侧不按 `toValue` 解包」纠正为「支持布尔、Ref 与 getter，渲染期按 `toValue` 取值」（`1ada73a`），再到「分组列的子列同样参与过滤（递归生效）」（`a5a1542`）。
- **解决的问题**：CR-088（自相矛盾的注释）、CR-090（注释规范）、列 `hidden` 契约与实现矛盾；core 侧遗留 `console.log('[DBG] updateHeights')` 一并移除（1ada73a）。
- **影响**：仅注释/文档；`comment-conventions.spec.ts` 以静态契约锁住「禁用表述缺席 + 标签在场」。
- **证据**：DOC-01 / DOC-02 / DOC-03（`comment-conventions.spec.ts:34-79`）；`grep -rn "console\.\(log\|debug\)\|TODO\|FIXME" packages/antd-vue-pro/src` 无命中；提交 1ada73a、0f61b82、2429b61、a5a1542。
- **复核结论**：⚠️ 见 W1/W2/W3（新增 JSDoc 与旧 JSDoc 叠加成重复块；`getter`/`Ref` 与类型面不一致）。

### 21. 测试基建：core 源码直连、mock 隔离、flush 提速、未放行告警判失败

- **位置**：`vitest.config.ts:8-15`（`@qin-ui/pro-components-core` → `../core/src/index.ts`）、`:19-20`（`restoreMocks: true` + 注释）；`__tests__/helpers/mount.ts:12-17`（`flushPromises` 改 `nextTick + setTimeout(0) + nextTick`）、`:57-88`（`mountProTable` 新增 `attachTo`，供原生 submit 路径使用）；`__tests__/setup.ts:116-181`（预期告警白名单按来源与片段精确匹配 + `unexpectedWarnings` 在 `afterEach` 抛错）、`:24-96`（RO/IO mock 以 `entry` 对象登记/注销，修 `disconnect` 身份不匹配）
- **修改点**：如上；另 `__tests__/setup.spec.ts:1-39` 新增 SETUP-01～03 自检基建本身。
- **解决的问题**：测试期经 `es` 构建产物消费 core 的隐性依赖（a9b4f13）、mock 泄漏（0ea21e0）、RO/IO `disconnect` 删不掉条目（938fcb7）、跨用例告警静音导致的假绿（e689378）。
- **影响**：仅测试；用例数 86 → 133；`restoreMocks` 使 `vi.spyOn` 替身不再跨用例泄漏。
- **证据**：SETUP-01～03 通过；`node scripts/check-test-ids.mjs` ✓；提交 a9b4f13、0ea21e0、938fcb7、e689378。
- **复核结论**：⚠️ 见 W7（`restoreMocks` 注释的时序描述不准）。

### 22. 测试覆盖与断言质量补齐（新增 47 条用例）

- **位置**：`__tests__/` 全部 13 个 spec；`tsconfig.json:14,21`（`types` 增 `node`）、`package.json`（devDependency `@types/node ^24`）
- **修改点**：新增判别性用例覆盖第 4～17 条各修复（PT-A14/A15/A16/A17/A19/A22/A23/A24/A24b/A25/A26、BF-A15/A15b、BI-A15/A15b/A16/A17/A20/A21、SF-A16/A17、SX-01/02、SETUP-01～03、AC-01～07、DOC-01～03）；并把 0a47cfe 指出的失信断言改为真实交互（如 `controls.spec.ts` CC-01/CC-02 由「直接调 `table.setColumn`」改为「打开列控浮层点击真实面板项」、去掉 `if (menu.exists())` 条件断言）。
- **解决的问题**：CR-022（恒真/零信息/死代码断言）、CR-031（适配层覆盖缺口）、CR-033～CR-050（测试质量组）。
- **影响**：测试；`ProTable.spec.ts` 16 → 30 例、`BaseFormItem.spec.ts` 9 → 15 例、`SearchForm.spec.ts` 8 → 14 例等；无文件净减用例。
- **证据**：见上各条；提交 f299454、0a47cfe、32c5ea8、e689378、dc29ccc 等。
- **复核结论**：✅ 无误（唯一覆盖缺口见第 13 条「校验次数」与 W6）。

### 23. 文档与 AI 上下文（e73293a）

- **位置**：`packages/antd-vue-pro/AI-CONTEXT.md:46,65-80`（导语补「以现场读取的实际配置为准」+ 新增「项目级覆盖层」）、`README.md:194-197`（AI 协作小节）、`README.md:224-233`（`search`/`addIndexColumn`/`tableContainer` 默认值更正，见 `:228,232`）、`__tests__/ai-context.spec.ts:1-42`（AC-01～07 守卫）
- **修改点**：AI-CONTEXT 增「生成 Field/Column 代码前先读项目 `ProComponentProvider` 实际配置」（优先级 Field > Provider > 内置默认，不含配置快照）；README 表格由「`addIndexColumn` 默认 false / `search` 需返回 Promise 或数据 / `tableContainer` 默认 false」更正为「默认 `true` / 无入参、返回 Promise 时接管 loading / 默认 `DefaultTableContainer`」。
- **解决的问题**：文档与代码默认值不一致（`constants/index.ts:37-38` 确为 `control: true`、`addIndexColumn: true`；`ProTable.vue:288-294` 默认 `DefaultTableContainer`）。
- **影响**：文档 + AI 协作契约；新增 `@types/node ^24` 与 `tsconfig.types` 以支持 spec 内的 `node:fs`/`node:path`；`.changeset/ai-provider-context-antd.md`（patch）。
- **证据**：AC-01～07 通过；README 默认值与 `constants/index.ts`、`ProTable.vue` 逐条对照一致；提交 e73293a。
- **复核结论**：✅ 无误。

### 24. 类型面零残留核查（调试日志 / 未用导入 / TODO / `@ts-expect-error` 时效）

- **位置**：整包
- **修改点**：无（核查项）。`grep -rn "console\.\(log\|debug\|info\)|debugger|TODO|FIXME|XXX" packages/antd-vue-pro/src` 零命中；`@ts-expect-error` 共 3 处（`ProTable.spec.ts:660`、`:1161`、`SearchForm.spec.ts:547`）均在 `tsconfig.include` 覆盖的 `__tests__` 内，`vue-tsc` 退出 0 证明三者**仍生效**（失效会报 TS2578）；`eslint` 0 error（未用导入/变量规则未告警）。
- **解决的问题**：核查项，非改动。
- **影响**：无。
- **证据**：上述命令输出；`npx vue-tsc --noEmit` → `VUE_TSC_EXIT=0`。
- **复核结论**：✅（残留检查通过）。

---

## 遗留与建议

**❌ 附带缺陷（需修，见第 13 条）**：修复 a11y 后，内置控件每次值写入触发 **2 次**字段校验（`input`/`select`/`input-number` 自报 + `field-value-change` 事件），实测 2 vs 旧 1（`setValue` 场景 4 vs 2）。无测试锁定校验次数，建议合并去重并补判别用例。

**⚠️ 建议改进**

- **W1 重复 JSDoc 块（四包同构）**：`src/components/form/types/index.ts:106-113`（`hidden`）与 `:114-120`（`disabled`）、`src/components/table/types/index.ts:53-61`（`hidden`）均残留旧 JSDoc 块后紧接新块，TS 只绑定最后一块，前一块为死注释且与新说法重复。建议删除旧块（`@description 字段是否隐藏` / `字段是否禁用` / `是否隐藏该列 @default false`）。
- **W2 字段 `hidden` 的「getter」承诺类型面不可达**：`form/types/index.ts:110` 称「支持布尔、Ref 与 getter，渲染期按 `toValue` 取值」，但 `WithRef`（`:255-261`）用的是 `MaybeRefOrComputedRef<T> = MaybeRef<T> | ComputedRef<T>`（`:249`，Vue 3.5.34 的 `MaybeRef` = `T | Ref | ShallowRef | WritableComputedRef`，**不含 `() => T`**）；`cross-package.spec.ts:140-152` 的 getter 用例必须 `as any`（`:150`）才能通过。建议改用 `MaybeRefOrGetter<T>`（一次覆盖 Ref/Computed/getter），或把 JSDoc 收敛为「Ref / ComputedRef」。
- **W3 列 `hidden` 的响应式承诺类型面更弱 + 控件会解绑**：`table/types/index.ts:61` 类型仍是 `boolean`（JSDoc 却称 Ref/getter），PT-A19 传 `ref(true)` 需 `as any`（`ProTable.spec.ts:778`）。建议类型改 `MaybeRef<boolean>`。另：`ColumnControl` 勾选走 `props.table?.setColumn(key, { hidden })`（`ColumnControl.vue:88-90,136`），core 的 merge 分支是 `Object.assign(preColumn, merged)`（`packages/core/src/table/useTable.ts:490-498` 附近），会用布尔值**覆盖**列上的 Ref，使该列与外部 ref 解绑——建议在 JSDoc/README 标注该边界，或让 `setColumn` 识别 Ref 形态。
- **W4 `TableProps` JSDoc 丢失 `@scroll` 边界**：74030da 删除了旧 `TableComponentProps` 上「宿主 Table 未暴露 scroll 事件面，故不提供 `@scroll` 入口」一句，新 `interface TableProps`（`shared/ui/index.ts:63-71`）只保留组成说明，与提交信息「把该事实与不提供 @scroll 入口写入 JSDoc」不符；该边界目前仅存于 `docs/antd-vue-pro/components/pro-table/index.md:79`。建议在该 JSDoc 补回一句。
- **W5 Changeset 文案已过期（会写进 CHANGELOG）**：`.changeset/fix-reuse-host-exports-and-parity.md` 仍描述 `TableEmitProps` 与 `TableComponentProps = TableProps & TableEmitProps`（74030da 已取消/更名）；`.changeset/fix-adapters-export-surface-and-contracts.md` 仍写「三包列类型的 `hidden` 明确『仅布尔、不做 `toValue` 解包』」，与 1ada73a 之后的代码相反。建议同步措辞。
- **W6 `table` 插槽作用域的 `size` 非有效值**：`ProTable.vue:500` 下发本地 model，而真实表格用的是 `computedTableProps.size`（Provider 注入时 `:271-286` 才补上）；PT-A25 只覆盖未注入场景。建议下发有效 size 或注明「作用域 size 为本地绑定值」。
- **W7 `vitest.config.ts:19` 注释时序不准**：`restoreMocks` 的语义是「每个用例**前**」对所有 spy 调 `mockRestore()`（vitest 4.1.11 类型声明原文：`Will call .mockRestore() on all spies before each test`），注释写「每个用例后自动还原」。
- **W8 `name` 与 `path` 的优先级未在包内文档/类型 JSDoc 说明**：实现为 `name` 优先（`DEFAULT_FIELD_IDENTITY_KEYS = ['name','path']`，`cross-package.spec.ts:287` 已锁），而 `packages/element-plus-pro` 的字段文档规定 `name` 仅透传控件、`prop > path`。建议在 `BaseCommon`（`form/types/index.ts:100-105`）或 README 补一句 antd 侧的标识口径，避免跨包误用。
- **W9 宿主静态导出缺降级（待确认）**：`ProTable.vue:90` 在模块求值期直接调用宿主导出的 `tableProps()`，未实现「宿主不可用时返回 `{}` 并一次性告警」的降级（该降级由 `packages/antdv-next-pro/src/shared/ui/index.ts:87-101` 自实现，因宿主未导出 `tableProps`）；ant-design-vue 4.2.6 确实导出该函数，故当前无碍，但若宿主升级移除该导出会在 import 期抛错而非告警。是否对齐四包请确认。
- **W10 Provider 注入的 `columns` / `dataSource` 被静默忽略（低）**：`ComponentVars['pro-table']` 类型接受全部 `TableProps`，但 `computedColumns` / `computedDataSource`（`ProTable.vue:323-329,362-364`）不读 `injectAttrs`，模板 `:columns` / `:data-source`（`:508-509`）又后写覆盖 `computedTableProps`，故注入的这两键不生效。建议文档注明或从类型面排除。

**其它小项**

1. `SlotComponent` 注释列举「VNode / 函数 / 组件定义对象」而实现按「非原始值」判定（数组、普通对象也会进 `<component :is>`）；`SlotComponentType` 未包含它们，风险低，可对齐措辞。
2. 自定义 `searchButton` 仍按 `@click` 触发（`SearchForm.vue:157-163`）；若自定义按钮内部渲染 submit 按钮，会与表单 submit 叠加——建议在 `ButtonProps.onClick` 契约处加一句注意。
3. `ProForm/index.vue:83` 的兜底表单实例改为 setup 同步期创建：未传 `:form` 的语义更清晰（PF-B2b 已锁），代价是每次 `ProForm` setup 都会多创建一个 `useForm()` 实例（未传 `:form` 时使用），可接受。
4. 未发现跨包漂移导致的实质缺陷：`Omit<TableProps,'loading'>`（antd/antdv-next 同构）、分组列递归过滤（antd/antdv-next/element 同构）、`SlotComponent` 语义（三包同构，vant 另有登记）、`form` 必填（三包同构）均已对齐；差异仅剩 `name` 标识口径（W8）与 `tableProps` 降级实现（W9）。
5. 复核期间 HEAD 从 `74030da` 前进到 `e73293a`（原工作区改动被评审侧收口提交），本清单已按当前工作区状态（干净的 `e73293a`）复核；`git status` 中 `examples/**` 的改动与 `CODE-REVIEW-REPORT.md` 非本次范围。

---

## 门禁实测

| 命令                                                                           | 结果原文摘要                                                                                                                                                                                                                   |
| :----------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cd packages/antd-vue-pro && npx vitest run`                                   | `Test Files 13 passed (13)` / `Tests 133 passed (133)` / `Duration 39.66s`（RUN v4.1.11）                                                                                                                                      |
| `cd packages/antd-vue-pro && npx vue-tsc --noEmit`                             | 无输出，`VUE_TSC_EXIT=0`（含 `__tests__`，故 3 处 `@ts-expect-error` 均被校验、未报 TS2578）                                                                                                                                   |
| `pnpm --filter "@qin-ui/antd-vue-pro" build`                                   | prebuild 生成 `api.json` / `bin/init-ai.mjs` → `vue-tsc --noEmit && vite build` → `✓ 53 modules transformed.` / `es/index.js 61.56 kB │ gzip: 13.99 kB` / `[vite:dts] Declaration files built in 3306ms.` / `✓ built in 3.76s` |
| （附加）`npx eslint packages/antd-vue-pro/src packages/antd-vue-pro/__tests__` | `✖ 305 problems (0 errors, 305 warnings)`（全部为既有 `no-explicit-any`）                                                                                                                                                     |
| （附加）`npx prettier --check "packages/antd-vue-pro/**/*.{ts,vue,json,md}"`   | `All matched files use Prettier code style!`                                                                                                                                                                                   |
| （附加）`node scripts/check-test-ids.mjs`                                      | `[check-test-ids] 用例编号在同一包内唯一 ✓`                                                                                                                                                                                    |
| （附加）第 13 条校验次数探针 `/tmp/antd-probe`（仓库外）                       | `[NEW] 仅 input 事件一次 → setter=1 validator=2` / `[OLD] … setter=1 validator=1`；`setValue` 场景 `NEW setter=2 validator=4` vs `OLD setter=2 validator=2`                                                                    |

> 说明：`build` 的 prebuild 会重写 `packages/antd-vue-pro/api.json` 与 `bin/init-ai.mjs`；二者已被 `.gitignore:35,38` 忽略，实测 `git status` 中本包无任何文件变更，**本次复核未修改仓库任何受版本控制的文件**（唯一写入为 `/tmp/change-review/antd.md`）。
