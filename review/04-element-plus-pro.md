# packages/element-plus-pro 修改清单（734e3c0 → 当前）

> 位置标注均相对 `packages/element-plus-pro/`（跨包引用另注明 `packages/...`）。
> 复核方式：`git diff 734e3c0 -- packages/element-plus-pro` 取全量差异（含未提交），逐文件打开当前源码读上下文，配合 `git show <commit>` / `git log -S` 追意图，并实测 Vue 3.5.34 与 element-plus 2.13.6 / 2.14.5 的运行时行为。

## 概览

- **提交数**：25（`git log --oneline 734e3c0..HEAD -- packages/element-plus-pro | wc -l`），HEAD = `e73293a`；工作区对本包已无未提交改动（`git status --porcelain -- packages/element-plus-pro` 输出 0 行）。
  - 说明：复核开始时会话内 HEAD 为 `74030da`、本包尚有 4 个已改文件与 1 个未跟踪测试；复核过程中这批改动被提交为 **`e73293a`**。当前 `git diff 734e3c0` 与复核起点的快照逐字节一致，唯一新增内容是 `__tests__/ai-context.spec.ts`（已单独通读）。
- **文件数**：48（源码 27 / 测试 16 / 文档与配置 5），`+2877 −622`。
- **用例数**：88（改前，10 个 spec，无 `it.each`）→ **142**（改后，14 个 spec；其中 `ProTable.spec.ts` 的 `it.each` 展开 4 例，故比字面 `it(` 计数 139 多 3）。
- **门禁结果**：三项全绿 —— vitest 14 files / 142 tests passed；`vue-tsc --noEmit` 0 错误；`pnpm --filter "@qin-ui/element-plus-pro" build` 成功（57 modules，`es/index.js` 68.24 kB，产物含 `es/components/table/hooks/useTable.d.ts`，无旧扁平路径残留）。

## 修改点

### 1. 表格分页 / 尺寸 / 数据 / 列收敛为「prop（或 Provider）单一来源」

- **位置**：`src/components/table/components/ProTable.vue:358-386`（分页）、`:346-348`（数据源）、`:437-440`（尺寸）、`:327-344`（列）、`:310-316`（容器）、`:350-356`（宿主属性合并）
- **修改点**：`computedPagination` 去掉 `attrsTableProps.pagination` 分支，只认 `props.pagination` > Provider；`computedDataSource` 去掉 `attrsTableProps.data`，只认 `props.data` > `table.data`；`resolvedSize` 去掉 `attrsTableProps.size`，只认 `size` 模型 > Provider；列/容器同理。同时删除 `computedTableProps` 中 `delete merged.data/columns/size/pagination` 4 条语句。
- **解决的问题**：CR-094。这些键在 `Props` 中均已是声明 prop（编译产物 `props` 声明可证：`table/search/addIndexColumn/immediateSearch/control/searchFormConfig/tableContainer/columns/data/pagination` + 两个 model），**永不进入 `attrs`**，原先"从 attrs 兜底"的分支恒不可达；4 条 `delete` 亦为死代码。契约改为"每个键只有一个来源"，避免多渠道各自兜底造成的优先级歧义。
- **影响**：公开 API 无变化（这些键本来就是 prop）；运行时行为消除死分支；类型契约不变。无需新增 Changeset（已由 `fix-element-protable-single-source.md` 覆盖并声明"无行为变更"）。
- **证据**：PT-A28（`__tests__/ProTable.spec.ts:849`）断言五个键均在 `(ProTable).props` 且不在 `vm.$attrs`，并逐项验证分页/数据/尺寸按 prop 生效；PT-A33（`__tests__/ProTable.spec.ts:1136`）覆盖 props×Provider×pageParam 四场景合并优先级；提交 `c4b47db`。
- **复核结论**：✅ 无误。已独立验证：① 用 `@vue/compiler-sfc` 编译当前 `ProTable.vue`，运行时 props 仅上述 10 项 + `size`/`loading`，`Omit<TableProps,'data'>` **未**展开为运行时 prop；② 在 happy-dom 中复刻该 props 声明实测 `Object.keys(props)` 恒为 12 键（含未传入的键）——依据 Vue 3.5.34 `runtime-core` `initProps` 中 `for (const key in instance.propsOptions[0]) if (!(key in props)) props[key] = void 0`；③ `data/columns/size/pagination` 为声明 prop 故 4 条 `delete` 确为死代码。

### 2. attrs 排除面与 Provider 键清单改为推导

- **位置**：`src/components/table/components/ProTable.vue:166-202`
- **修改点**：`PRO_TABLE_EXCLUDED_ATTR_KEYS`（10 键，含 `onUpdate:size`/`onUpdate:loading`/`data`/`columns`/`size`/`pagination`）→ `PRO_TABLE_CONSUMED_ATTR_KEYS`（4 键：`class`/`style`/`onSearch`/`onChange`）；`PRO_TABLE_PROVIDER_KEYS`（手写 6 键）→ `PRO_TABLE_PROP_KEYS = new Set(Object.keys(props))`（推导）。
- **解决的问题**：CR-094 附带清理。被删的 6 个 attrs 键实测不可能出现在 `attrs`（4 个是声明 prop；`onUpdate:size`/`onUpdate:loading` 是已注册 emit 的监听器，被 Vue `isEmitListener` 拦下）；被删的 6 个 Provider 键改为按组件自有 prop 全集过滤，Provider 注入的宿主表格属性（`stripe`/`border`/`rowKey` 等非声明键）仍照常透传。
- **影响**：运行时行为——Provider 级 `columns` 不再作为原生属性落到表格 DOM；`size` 仍由 `resolvedSize` 消费，值不变。类型无变化。Changeset 同上。
- **证据**：PT-A28b（`__tests__/ProTable.spec.ts:904`）断言 Provider `size:'small'`/`stripe:true` 透传、Provider `columns` 不落 DOM；PT-E5/PT-E6 覆盖 Provider 与 prop 两条事件/属性通道；PT-A31 锁定运行时 `emits` 恰为 `['update:loading','update:size']`。提交 `c4b47db`。
- **复核结论**：✅ 无误（附 1 条低风险建议见"遗留与建议"第 5 条）。

### 3. `searchFormConfig.container` / `hidden` 不再泄漏到搜索表单与原生 `<form>`

- **位置**：`src/components/table/components/ProTable.vue:300-308`（`searchFormProps` 剥离 `container`/`hidden`）、模板 `:456-468`
- **修改点**：原先 `v-bind="computedSearchFormConfig"` 把 `container`（组件对象）与 `hidden` 一并下发给 `SearchForm`；现拆成 `computedSearchFormConfig`（ProTable 自用：容器交给 `ContainerFragment`、显隐交给 `searchFormVisible`）与 `searchFormProps`（仅下发 SearchForm 的真实 props）。
- **解决的问题**：CR-098。`container` 沿 `SearchForm → ProForm → ElForm` 的 attrs 落到原生 `<form>`，产生非法属性 `container="[object Object]"`；`hidden` 命中 HTML 全局属性，等于用属性副作用隐藏表单。显隐语义改由 `searchFormVisible` 承担（行为不变）。
- **影响**：运行时行为——DOM 更干净，`hidden: true` 仍隐藏搜索区（PT-06 `__tests__/ProTable.spec.ts:363` 覆盖）；`SearchForm` 自身 attrs 透传能力未改。Changeset：`fix-element-protable-single-source.md`（CR-098）。
- **证据**：PT-A29（`__tests__/ProTable.spec.ts:936`）断言自定义容器参与渲染、`SearchForm.vm.$attrs` 不含 `container`/`hidden`、原生 `<form>` 无这两个属性；PT-06 覆盖 `hidden:true`。提交 `c4b47db`。
- **复核结论**：✅ 无误。

### 4. 搜索配置告警按「原因键」去重，且未配置 `search` 时不误报

- **位置**：`src/components/table/components/ProTable.vue:209-242`
- **修改点**：单标志 `warnedSearchConfig` → `SEARCH_WARN_MESSAGES`（`duplicate` / `not-promise` 两条文案）+ `warnedSearchReasons: Set<keyof …>` 按原因去重；`_search` 先取 `props.search || attrs.onSearch`，无 search 直接返回（不再把"缺配置"当作"未返回 Promise"）。
- **解决的问题**：CR-099。原先两类原因共用 1 个去重标志，先触发者会永久静音另一条（冲突提示被"未返回 Promise"抢先吞掉）；且未配置 `search` 时也会误报。
- **影响**：运行时行为（仅在确有配置时告警，且每条原因各一次）；`searchSequence` loading 竞态语义未变。Changeset 同上。
- **证据**：PT-A30（`__tests__/ProTable.spec.ts:979`）同时命中两类原因，断言各出现 1 次；PT-A10（`__tests__/ProTable.spec.ts:246`）断言非 Promise 提示出现；PT-A10b（`__tests__/ProTable.spec.ts:292`）断言同一实例内"未返回 Promise"仅 1 次。提交 `c4b47db`。
- **复核结论**：✅ 无误（与 `packages/antd-vue-pro`/`packages/antdv-next-pro` 同口径，已比对 `warnedSearchReasons` 实现一致）。

### 5. 宿主表格事件与运行时 emits 口径（保留类型面 + 补行为说明）

- **位置**：`src/components/table/components/ProTable.vue:138-143`（`type Emits = {} & @vue-ignore TableEmits`）、`:403-404`（`onChange` 手工透传）
- **修改点**：不改声明，新增块注释说明"组件自身仅触发模型事件，宿主事件不入运行时 emits、监听入口保留在 attrs 中透传"。
- **解决的问题**：CR-100。实测运行时 emits 仅 `update:size`/`update:loading`（`defineModel` 注册），19 个表格事件经 attrs 到达宿主；若 `TableEmits` 变为可解析，事件名进入 emits 会把同名 `onXxx` 从 attrs 剔除导致**静默失效**。删除该声明会使产物 d.ts 的事件键消失（公开类型面回归），故本次保留并加守卫。
- **影响**：无行为变更；类型契约不动。Changeset 同上已披露"彻底移除需另立破坏性提案"。
- **证据**：PT-A31（`__tests__/ProTable.spec.ts:1023`）锁定 `(ProTable).emits` 恰为 2 个模型事件且与 `ElTable.emits` 无交集，并验证 `row-click`/`change` 经 attrs 生效、`update:size` 驱动 `ElTable.size`。提交 `c4b47db`。
- **复核结论**：✅ 无误。

### 6. `default` 插槽保留给列渲染器，修复"写了 default 就整表无列"

- **位置**：`src/components/table/components/ProTable.vue:264-281`（`forwardedSlotNames` 排除 `default` + 一次性告警）、模板 `:508-514`
- **修改点**：`forwardedSlotNames()` 由"排除 4 个具名插槽"改为"排除 4 个具名插槽 + `default`"，并在检测到用户传入 `default` 时输出一次提示（`warnedDefaultSlot` 守卫），引导改用 `search-form`/`button-bar`/`toolbar`/`table`。
- **解决的问题**：`createSlots` 语义下动态 `default` 会覆盖模板中承载 `<TableColumnRenderer>` 的静态 `default`，导致列全部消失（表格静默无列）。
- **影响**：运行时行为——传入 `default` 的内容不再透传宿主表格（此前该内容本身就是缺陷来源）；破坏性：无（Changeset 已声明）。Changeset：`fix-element-protable-default-slot.md`。
- **证据**：PT-A20（`__tests__/ProTable.spec.ts:807`）断言表头仍 1 列、表体数据正常、用户内容不出现、提示出现。提交 `083c6b7`。
- **复核结论**：⚠️ 建议改进（见"遗留与建议"第 4 条：空/透传插槽的包装组件会误报；且 JSDoc 与文档未声明 `default` 被保留）。

### 7. `TableColumnRenderer` 重写为 `h()` 同层递归，分组列 `children` 恢复渲染

- **位置**：`src/components/table/components/TableColumnRenderer.vue:59-107`（`renderColumn` + `defineComponent`）、`:22-39`（稳定 key / columnKey）
- **修改点**：由 `<script setup generic>` + 模板 `<TableColumnRenderer :columns="column.children">` 自递归，改为 `defineComponent` + `h(TableColumn, vnodeProps, { default: () => children.filter(...).map(renderColumn) })`，子列以**同层 vnode 数组**展开。
- **解决的问题**：element-plus 只在父列默认插槽中收集 `ElTableColumn` 直系 vnode / 函数式组件，原先再包一层状态组件使分组列 `children` 永不渲染（整表缺列）。
- **影响**：运行时行为（多层分组表头 + 子列数据恢复）；组件为 `@internal`，未导出，非公开 API。
- **证据**：PT-A17（`__tests__/ProTable.spec.ts:716`）与 PT-A22（`__tests__/TableColumnRenderer.spec.ts:56`）覆盖两层分组，`findColumns` 计数 5 精准断言；PT-A21 / PT-A24 / PT-A25 / PT-A26（`__tests__/TableColumnRenderer.spec.ts:29/129/179/200`） 覆盖普通列、key 兜底与重排、空列、render 作用域。提交 `41daa4d` + `2429b61`（结构对齐）。
- **复核结论**：⚠️ 建议改进（低：`:16-19` 注释为设计动机式表述且未被注释守卫覆盖；`:34-39` 对 `key: ''` 无守卫）。

### 8. 列 `hidden` 语义补齐：响应式取值 + 分组子列递归生效

- **位置**：`TableColumnRenderer.vue:69-75`（子列过滤）与 `:102-105`（顶层过滤）；`ColumnControl.vue:47`、`:75`；`ProTable.vue:328-330`、`:413`
- **修改点**：一律 `isObjectItem(child) && !toValue(child.hidden)`；`ColumnControl` 的 `checked` 改 `!toValue(item.hidden)`；`ProTable` 的列与搜索字段过滤先做 `isObjectItem` 再 `toValue(hidden)`。
- **解决的问题**：CR-030 后续。类型文案曾写"仅顶层列参与过滤"，实现与文档不符；且 `hidden` 为 `Ref(false)` 时被对象真值误判为隐藏。
- **影响**：运行时行为（隐藏列实时消失、子列可独立隐藏）；类型契约不变（`Column.hidden` 文案已同步为"支持布尔/Ref/getter，子列递归生效"）。Changeset：`fix-grouped-column-hidden.md`。
- **证据**：PT-A23（`__tests__/TableColumnRenderer.spec.ts:92`，响应式 hidden 双分支 + 运行期切换）、PT-A27（`:232`，嵌套分组 + `ref` 子列）、CC-01（`__tests__/controls.spec.ts:63`，列控面板状态）。提交 `c7f85e7`、`a5a1542`（文档）、`1ada73a`（文案纠偏）。
- **复核结论**：✅ 无误（`docs/element-plus-pro/components/pro-table/index.md:35` 已同步同口径）。

### 9. 字段标识契约统一为「宿主标识键优先于 `path`」（element 为 `prop ?? path`）

- **位置**：`src/components/form/constants/index.ts:109-113`（`ELEMENT_FIELD_IDENTITY_KEYS = ['prop','path']`）、`src/components/form/hooks/useGroupFieldAttrs.ts:52`、`:99-101`、`:112-114`、`src/components/form/hooks/useForm.ts:110-118`、`src/components/form/hooks/useFields.ts:62-64`
- **修改点**：`name ?? path`（内联）→ `resolveFieldIdentity(field, ['prop','path'])`；`prop` 与 `path` 一并在解构中剥离（`prop` 仍经 `path` 落到 `BaseFormItem` 的 `:prop`，`name` 留在 `rest` 作为控件原生属性透传）；适配层 `useForm`/`useFields` 显式传 `fieldIdentityKeys`（`useForm` 增加"单参 boolean 走 root 重载"的运行时分派，避免 4 参调用被 core 误判为 数据+字段+root+options）。
- **解决的问题**：CR 批次（`fix-field-identity-contract.md`）。el-form-item 的标识属性是 `prop`，照搬 antd 的 `name ?? path` 会导致 `{path:'a',name:'b'}` 错绑到 `b`、`{prop:'a',path:'b'}` 被 `path` 覆盖，且 core 字段查找 API 与渲染标识不一致（`getField('a')` 静默 miss）。
- **影响**：**类型契约 + 运行时行为**。`Field` 类型文案明确"与 prop 同时配置时以 prop 为准"；对既有 `name` 当标识的配置属**行为变更**（Changeset 已写迁移提示 1/2）；core 侧新增 `resolveFieldIdentity` / `DEFAULT_FIELD_IDENTITY_KEYS` / `UseFieldsOptions`。
- **证据**：BF-08（`__tests__/BaseField.spec.ts:386`，`name` 透传 `input[name]`）、BF-09（`:412`，`prop` 优先，`ElFormItem.props('prop')==='a'`）、`cross-package.spec.ts:167`（未编号判别用例：值绑定 + `getField` 同源）、PF-A3（`__tests__/hooks-locale.spec.ts:240`，`useFields` 增删改查以 `prop` 检索）、IT-06（`__tests__/integration.spec.ts:79`，点分 `path` 原样作 `:prop` 并驱动嵌套校验）。提交 `bd888e9`。
- **复核结论**：⚠️ 建议改进（低：`:101`/`:114` 残留恒不可达的 `Array.isArray(raw)` 分支，见"遗留与建议"第 2 条）。

### 10. 字段渲染 key 改为对象身份，消除同 `path` 兄弟字段 key 冲突

- **位置**：`src/components/form/utils/fieldKey.ts:14-25`（新模块）、`src/components/form/hooks/useGroupFieldAttrs.ts:108`/`:120`（`renderKey`）、`src/components/form/components/BaseFormItem/index.vue:159`（`:key="item.renderKey"`）
- **修改点**：key 由 `item.path || getFieldKey(item.rawField)` 改为**只用** `getFieldKey(field)`：模块级 `WeakMap<object, number>` + 自增种子，`toRaw(field)` 为键；非对象项返回 `raw_${String(field)}`。
- **解决的问题**：同 `path` 的两个字段此前 key 相同（Vue 复用错节点）；字段插删/重排/过滤后 key 与对象绑定，不随数组下标漂移。
- **影响**：运行时行为（渲染复用正确）；`fieldKey.ts` 为包内工具，非公开 API。Changeset：`fix-field-render-key-identity.md`。
- **证据**：BI-A17（`__tests__/BaseFormItem.spec.ts:397`，交换两个同 `path` 字段后断言 `after[0].element === elB`）、BI-A15b（`:345`，原始值项走非对象回退不抛 WeakMap 错误）。提交 `dc29ccc`（+ `d905ed2` 补设计说明）。
- **复核结论**：✅ 无误。

### 11. 分组字段 `disabled` 经禁用上下文向下继承

- **位置**：`src/shared/ui/index.ts:96-121`、`src/components/form/components/BaseFormItem/index.vue:48-60`、`:186`
- **修改点**：`useDisabledContextProvider` 先取父级上下文，再 `computed(() => toValue(disabled) ?? parentDisabled.value)`（**未声明即继承**，显式 `false` 才覆盖）；`useDisabledContext` 收敛为单次 `toValue`；`BaseFormItem` 新增 `disabled` prop 并 `useProviderDisabled(computed(() => props.disabled))`，嵌套 `BaseFormItem` 传 `:disabled="toValue(item.rawField.disabled)"`。
- **解决的问题**：原先 provider 无条件 `!!toValue(disabled)`（undefined → `false`）会**遮蔽**上层禁用上下文，分组字段的 `disabled` 无法传播，也阻断宿主 `ElForm.disabled` 继承。
- **影响**：运行时行为（分组内字段继承禁用，组外不受影响）；`useDisabledContextProvider` / `useProviderDisabled` 为包内工具，非顶层导出。Changeset：`review-top10-fixes.md` 已记载。
- **证据**：BI-A18（`__tests__/BaseFormItem.spec.ts:435`，3 个 `ElInput` 断言分组内 2 个 `disabled===true`、组外 1 个 `false`）；HK-04（`__tests__/hooks-locale.spec.ts:95`）断言字段级 `disabled` 仍归 `componentProps`（不落 `formItemProps`）。提交 `cc83f0b`。
- **复核结论**：✅ 无误。

### 12. 字段 / 列配置含 `null`、原始值项不再崩溃

- **位置**：`src/components/form/components/BaseFormItem/index.vue:62-67`、`useGroupFieldAttrs.ts:50`/`:112`、`ProTable.vue:328-330`/`:413`、`TableColumnRenderer.vue:102-105`、`ColumnControl.vue:47`
- **修改点**：所有遍历配置数组的入口统一先 `isObjectItem` 过滤（此前直接读 `field.hidden` / `column.hidden`，对 `null`/字符串会抛错或误判）。
- **解决的问题**：`useTable`/`useForm` 允许动态增删列与字段，中间态可能出现空项或原始值项；此前渲染期直接崩溃。
- **影响**：运行时行为（容错渲染，仅合法项参与）；`isObjectItem` 经 `shared/core` 再导出。Changeset：`fix-invalid-field-items.md` / `fix-invalid-column-items.md`。
- **证据**：BI-A15 / BI-A15b（`__tests__/BaseFormItem.spec.ts:320/345`，`null`/`undefined`/原始值项）、PT-A18（`__tests__/ProTable.spec.ts:756`，`searchFields` 含 `null` 与字符串仍渲染搜索区）、PT-A19（`__tests__/ProTable.spec.ts:784`，`columns` 含 `null` 与字符串仅渲染 1 列）。提交 `5a8a20d`、`bc0dd02`。
- **复核结论**：✅ 无误。

### 13. 字段实例访问器纳入公开类型面

- **位置**：`src/components/form/types/index.ts:327-336`（`Field = (…) & AdditionalMethods<FormItemInstance>`）、`src/shared/core/index.ts:6`（再导出 `type AdditionalMethods`）
- **修改点**：`Field` 联合类型交叉 `AdditionalMethods<FormItemInstance>`，复用 core 类型而不再本地重复声明。
- **解决的问题**：`getFormItemRef` / `getComponentRef` 等访问器是运行时真实能力（由 `BaseFormItem` 非枚举挂载），但公开类型未声明，业务侧必须 `as any`。
- **影响**：类型契约（新增 4 个**全可选**成员，`packages/core/src/form/types.ts:102-122` 可证非破坏）；无运行时变化。Changeset：`fix-field-accessors-type-face.md`。
- **证据**：BI-A16（`__tests__/BaseFormItem.spec.ts:371`，不 `as any` 直接访问并通过类型检查 + 运行时可用）；`vue-tsc --noEmit` 0 错误。提交 `3a99eb0`。
- **复核结论**：✅ 无误。

### 14. `ProForm` 兜底表单实例改为 setup 同步期创建

- **位置**：`src/components/form/components/ProForm/index.vue:85-87`
- **修改点**：`let fallbackForm; computed(() => props.form ?? (fallbackForm ??= useForm()))` → `const fallbackForm = useForm(); computed(() => props.form ?? fallbackForm)`。
- **解决的问题**：在 `computed` 内惰性调用 `useForm()` 会触发 `provide() can only be used inside setup()` 告警，且兜底实例的数据 store 注入静默失效（子级 `useFormData()` 各建独立 store）。
- **影响**：运行时行为（兜底 store 注入恢复生效、告警消除；`:form` 已传时仍会创建一个未被渲染使用的兜底实例）。
- **证据**：PF-E1 / PF-E2 / PF-E3（`__tests__/ProForm.spec.ts:345/395/431`）（嵌套内层不传 `:form` 得独立实例、数据不互串；无 `:form` 时子树 `useFormData()` 与注入实例同一 `formData`；**传入 `:form` 时 `useFormData()` 取兜底 store**，与 `:form` 实例数据不通，被锁定为契约）。四包同构（`packages/{antd-vue-pro,antdv-next-pro,vant-pro}/.../ProForm/index.vue` 均为 `const fallbackForm = useForm()`）。提交 `077f293`。
- **复核结论**：⚠️ 建议改进（PF-E3 锁定的语义对使用者是陷阱，建议文档化或改注入源，见"遗留与建议"第 6 条）。

### 15. `ProLocale` 类型放宽 + 宿主语言判定修正

- **位置**：`src/locale/index.ts:23-24`、`:53-57`
- **修改点**：`ProLocale = typeof zhCN` → `Record<keyof typeof zhCN, string>`（保留键集合、放开取值字面量）；`lang` 判定由 `if (!elLocaleContext)` 改为 `if (toValue(elLocaleContext) == null)`。
- **解决的问题**：① 字面量类型使 `Partial<ProLocale>` 只接受与内置文案逐字相同的值，`:locale="{'table.query':'搜索'}"` 必然类型报错；② `localeContextKey` 注入的是 computed/ref 包装，对象恒真值使"仅包了未传 `locale` 的 `ElConfigProvider`"被误判为已提供宿主语言。
- **影响**：类型契约放宽（非破坏）+ 运行时语言判定（未传 locale 时回退 `zh-CN`）。Changeset：`fix-field-identity-contract.md`、`fix-element-locale-detect.md`。
- **证据**：LC-03（`__tests__/hooks-locale.spec.ts:165`，任意文案覆盖生效，编译期契约由 `Partial<ProLocale>` 赋值锁定）、LC-04（`:197`，包/不包/显式 en 三态）。提交 `f87d529`、`bd888e9`。
- **复核结论**：✅ 无误。

### 16. `table/useTable.ts` → `table/hooks/useTable.ts` + `hooks` 桶

- **位置**：`src/components/table/hooks/useTable.ts`（原 `src/components/table/useTable.ts`，相对导入 +1 级）、`src/components/table/hooks/index.ts:1`、`src/components/table/index.ts:16`
- **修改点**：文件迁移 + 新增桶 `export * from './useTable'`；`table/index.ts` 改从 `./hooks` 导出；`ColumnControl.vue:11`、`ProTable.vue:74` 及 5 处测试导入同步；保留 `type TableEmits` 再导出（经核实为 element-plus 宿主导出类型，删除属破坏性变更）。
- **解决的问题**：CR-076 结构性漂移（antd/antdv-next 已在 `table/hooks/`，仅 element 扁平）。
- **影响**：无公开 API 变化（`exports` 映射只暴露 `.` 与 css，深路径不在公开面）；产物结构对齐（构建后 `es/components/table/hooks/useTable.d.ts` 存在、无旧扁平文件）。Changeset：`fix-reuse-host-exports-and-parity.md`。
- **证据**：SX-02（`__tests__/index.spec.ts:78`）锁定表格模块运行时导出面恰为 `['default','useTable']`、`hooks` 桶导出 `useTable`，并用 `import type` 锁类型面；全仓 grep 无旧路径残留（仅 Changeset 与 `CODE-REVIEW-REPORT.md` 等历史文档提及）。提交 `2429b61`。
- **复核结论**：✅ 无误。

### 17. 顶层导出面、`install` 兜底与公开 JSDoc 绑定

- **位置**：`src/index.ts:30`/`48`/`64`（三条独立 `export` + JSDoc）、`:81-88`（install）
- **修改点**：`export { ProForm, ProTable, ProComponentProvider }` 拆为三条各带 JSDoc 的导出（JSDoc 不会在多名字导出语句上分别生效）；`app.component(ProComponentProvider.name!, …)` → `?? 'ProComponentProvider'`。
- **解决的问题**：CR-090 系列公开文档面缺失；`name` 缺失时避免注册 `undefined`。
- **影响**：文档/类型面；导出键集合不变（16 键）。
- **证据**：SX-01（`__tests__/index.spec.ts:10`）锁定顶层键集合、四桶再导出引用恒等、`install` 恰好注册 3 个组件名；DOC-03（`__tests__/comment-conventions.spec.ts:148`）锁定 ProForm/Provider 的 JSDoc 标签序列与 antd 包一致。提交 `077f293`、`e73293a`。
- **复核结论**：✅ 无误。

### 18. 死代码与遗留日志清理（CR-101 等）

- **位置**：`src/components/form/hooks/useGroupFieldAttrs.ts:14`、`src/components/form/components/BaseFormItem/index.vue:84-115`、`src/components/form/components/BaseField/index.vue:178-179`、`src/components/table/components/TableColumnRenderer.vue`（整文件重写）
- **修改点**：删除 `Object.keys(formItemProps()).filter(k => k !== 'disabled')`；删除 `BaseFormItem` 内的本地 `fieldKeySeed`/`getFieldKey`（迁至 `form/utils/fieldKey.ts`）；简化 `injectedFormSlots` 的显式类型断言；删除实现手段类注释（"模块级 Set…替代 includes 线性扫描"、"WeakMap 不参与响应式追踪"、"shallowRef 形态…建立依赖"）。
- **解决的问题**：CR-101 及 §2.1/§2.2 注释纪律。`ElFormItem` 的运行时 props 精确实测为 12 键且**不含** `disabled`（2.13.6 与 2.14.5 一致，d.ts 亦无该声明），故该过滤确为死代码；`disabled` 因此继续走 `componentProps` 由 `BaseField` 消费。
- **影响**：无行为变更（已由 HK-04 锁定路由结果）。
- **证据**：HK-04（`__tests__/hooks-locale.spec.ts:95`，`componentProps.disabled===true` 且 `formItemProps.disabled===undefined`）；DOC-01（`__tests__/comment-conventions.spec.ts:64`，8 条禁用表述不得回流 + 6 条行为陈述必须在场）。提交 `c4b47db`、`dc29ccc`、`077f293`、`1ada73a`。
- **复核结论**：⚠️ 建议改进（两处同类残留未清，见"遗留与建议"第 1、3 条）。

### 19. 测试基建强化与守卫用例

- **位置**：`vitest.config.ts:1-31`、`tsconfig.json:14`、`package.json:53`、`__tests__/setup.ts`、`__tests__/helpers/mount.ts:10-14`、`__tests__/setup.spec.ts`（新）
- **修改点**：① vitest 别名把 `@qin-ui/pro-components-core` 指向 `../core/src/index.ts`（测试期消费源码，不依赖 core 的 `es` 构建产物），并加 `restoreMocks: true`；② tsconfig `types` 增 `node`、devDeps 增 `@types/node`；③ RO/IO mock 改用 `entry` 对象身份注册/注销（原 `delete({...})` 因对象身份不同永不命中）；④ `flushPromises` 由固定 20ms 改为 `nextTick + setTimeout(0) + nextTick`；⑤ `console.warn/error` 白名单收窄（移除 `Invalid prop…`、`please transfer a valid name path…`）并在 `afterEach` **对未放行输出直接失败**；⑥ 新增注释规范/AI 上下文守卫用例。
- **解决的问题**：隐性依赖构建产物、跨用例 spy 泄漏、mock 注销失效、测试时长、开发期噪声被静默吞掉。
- **影响**：仅测试与构建配置，无发布物行为变化（`@types/node` 为 devDep）。
- **证据**：SETUP-01 / SETUP-02（`__tests__/setup.spec.ts:7/25`，disconnect/unobserve 注册表语义）、SETUP-03（`:35`，`isObjectItem` 与 core 源码导入**同引用**，锁定别名生效）；`vitest run` 14 files / 142 tests 全绿且无未放行告警。提交 `938fcb7`、`a9b4f13`、`0ea21e0`、`ad60833`、`ece7c16`、`e689378`。
- **复核结论**：✅ 无误（注意：白名单收窄 + 未放行即失败使套件对宿主/依赖新增告警较敏感，属有意收紧）。

### 20. 文档同步（README / AI-CONTEXT / docs）

- **位置**：`README.md:257`（`addIndexColumn` 默认值改 `true`，与 `component-provider/constants/index.ts:28-29` 一致）、`README.md:392-393`（新增 `prop` 优先、`name` 透传两行）、`AI-CONTEXT.md`（项目级覆盖层章节 + 反模式条目）、`docs/element-plus-pro/components/{pro-form,pro-table,pro-component-provider}/index.md`
- **修改点**：见上；docs 侧补 `hidden` 响应式取值、分组子列递归生效、栅格 span 优先级、插槽作用域列。
- **解决的问题**：文档与实现（及 Provider 内置默认）不一致；AI 生成代码前需先读项目 Provider 配置的规则落地。
- **影响**：文档；`__tests__/ai-context.spec.ts`（AC-01…AC-07）与 DOC-01/02 对文案做回归锁定。
- **证据**：AC-01…AC-07（`__tests__/ai-context.spec.ts:12-39`）、DOC-02（`__tests__/comment-conventions.spec.ts:101`，与 antd 包同句比对）。提交 `e73293a`、`a5a1542`、`c4b47db`。
- **复核结论**：⚠️ 建议改进（3 处文档滞后，见"遗留与建议"第 7 条）。

## 遗留与建议

1. **⚠️ 重复 JSDoc 块（本批次引入）**：`src/components/form/types/index.ts:106-108`（`hidden`）与 `:115-117`（`disabled`）保留了旧的一行块，紧随其后才是新契约块（`:109-112`、`:118-120`）；`src/components/table/types/index.ts:59-60` 同样残留 `/** 是否隐藏该列 */`。TS 只把最近的前置注释挂到声明上，前一块成为死注释；`comment-conventions.spec.ts` 用 `toContain` 断言，检测不到重复。**建议**：删除失效块（旧块文本分别是"字段是否隐藏""字段是否禁用""是否隐藏该列"），并在守卫用例中加"同一属性前不得出现两个连续 JSDoc 块"的断言。
2. **⚠️ `useGroupFieldAttrs` 死分支**：`src/components/form/hooks/useGroupFieldAttrs.ts:101` 与 `:114` 的 `Array.isArray(raw) ? raw.join('.') : (raw as string) || ''` —— `core` 的 `resolveFieldIdentity` 返回类型为 `string`（`packages/core/src/form/useFields.ts:38-48`，内部已用 `normalizePathKey` 归一化，含数组入参）。数组分支恒不可达。**建议**：直接 `path: resolveFieldIdentity(field, ELEMENT_FIELD_IDENTITY_KEYS)`，并在类型上收敛为 `string`。
3. **⚠️ `ProTable` 残留死可选链**：`src/components/table/components/ProTable.vue:413-414` 的 `fieldList.filter(...)?.length > 0`，`filter` 恒返回数组，`?.` 无意义（该行本批次被改写但带病保留）。**建议**：去掉 `?.`。
4. **⚠️ `default` 插槽告警按"键存在"判定，易误报 + 文档未声明**：`ProTable.vue:265-281` 只要 `slots` 上存在 `default` 键就告警一次；包装组件写 `<ProTable …><slot /></ProTable>`（外层无内容）时 `default` 键仍存在，会输出"default 插槽保留…"的误导提示；同时 `ProTable.vue:44-47` 的 `@slot` 清单与 `README.md`/`docs/element-plus-pro/components/pro-table/index.md` 均未说明 `default` 被保留（docs:142 反向写着"其余 el-table 列插槽也会透传"）。**建议**：告警时先判断该插槽实际产出（如调用后仅得注释/空数组则跳过），或在 JSDoc 与文档显式声明 `@slot default - 保留给列渲染器，不透传宿主表格`。
5. **⚠️ `PRO_TABLE_PROP_KEYS` 的推导依赖 Vue 内部行为，缺 Provider 侧守卫用例**：该集合的"确定性"来自 Vue `initProps` 会把所有声明 prop 补成 `undefined` 自有键（已在 vue 3.5.34 实测 12 键恒定）。若该内部行为变化，Provider 注入的 `pagination`/`columns`/`data` 会重新进入 `injectTableAttrs` 并作为原生属性落到表格 DOM——现有用例只覆盖了 Provider `columns`（PT-A28b），未覆盖 Provider `pagination`/`data`。**建议**：补 1 条"Provider 注入 `pagination`/`data` 时 `ElTable` 元素上无同名 DOM 属性"的判别用例，或把排除集合写成显式字面量清单（自文档化）。
6. **⚠️ `useFormData()` 与 `:form` 实例数据不通（PF-E3 已锁定为契约）**：`ProForm/index.vue:85-87` 的兜底实例在 setup 期无条件创建并提供数据 store，因此 `<ProForm :form="form">` 子树内 `useFormData()` 拿到的是**内部兜底 store**（`formData` 与 `form.formData` 非同一对象，读写不互通）。这一行为在四包同构且被用例显式断言，但 `useFormData` 是顶层导出（`SX-01` 键集合含它），而 `README`/`docs` 未提及该边界，使用者极易静默写丢数据。**建议**：二选一 —— ① 在 `ProForm` 的公开 JSDoc/README 中声明"`useFormData()` 复用 ProForm 内部兜底实例的 store，传 `:form` 时请直接使用传入实例"；② 让数据 store 注入指向 `currentForm`（`provide` 一个按 `currentForm.value` 取值的代理 store）。
7. **⚠️ 文档滞后三处**：① `docs/element-plus-pro/components/pro-table/index.md:121` 仍写 `addIndexColumn` 默认 `-`，而 Provider 内置默认为 `true`（`component-provider/constants/index.ts:29`）、README 已改 `true`；② 同页 `:142` "其余 el-table 列插槽…也会透传" 未排除已保留的 `default`；③ `docs/element-plus-pro/components/pro-form/index.md:82-84` 的字段表未同步 `prop` 优先/`name` 透传与 `disabled` 继承说明（README:392-393 已补）。**建议**：与 README 对齐。
8. **⚠️ 覆盖缺口（低）**：Provider 级（而非 props 级）`searchFormConfig.hidden`/`container` 无用例；`props.data`/`props.columns` 未做 `toValue`（`table.data`/`table.columns` 有做），传 `Ref` 时类型层已禁止但运行期会静默失效（`columns` 的运行时声明为 `type: null` 不告警，`data` 为 `Array` 会触发类型告警）——是否补 `toValue` 属产品取舍，**待确认**。
9. **⚠️ 跨包漂移登记（本次未修，非 element 缺陷）**：① `packages/antd-vue-pro/src/components/table/components/ProTable.vue:362-364,367-369` 与 `packages/antdv-next-pro/.../ProTable.vue:371-377` 仍为 `tableAttrs`（attrs）优先的数据源/分页来源，且两者 `:460`/`:474` 仍把含 `container`/`hidden` 的 `computedSearchFormConfig` 整体 `v-bind` 给 `SearchForm` —— 即 element 本批次修的 CR-094/CR-098 在两包未同步；② lint 级：`ProTable` 告警前缀 `[ProTable]` 与 `[pro-components]`（`ProTable.vue:277`、`BaseFormItem/index.vue:111`）不统一。**建议**：按 §4.1 立项同步两包（或明确 element 独有契约并在 Changeset 说明）。
10. **ℹ️ 其他观察**：`comment-conventions.spec.ts` 直接读取 `../../antd-vue-pro/src/**` 源码做同构比对（跨包文件依赖，antd 文案/路径变更会先让 element 套件变红），且仅与 antd 比对，未覆盖 antdv-next/vant；`ProTable` 的 `@param {() => Promise<unknown>} [search]` 与运行期"允许非 Promise（仅告警）"、README"需返回 Promise 或直接返回查询数据"存在措辞差（类型声明本身一致，属低优先）。

## 门禁实测

1. `cd packages/element-plus-pro && npx vitest run`

   ```
   ✓ __tests__/ProTable.spec.ts (33 tests) 5728ms
   ✓ __tests__/TableColumnRenderer.spec.ts (7 tests)
   ✓ __tests__/ai-context.spec.ts (7 tests)
   … （共 14 个 spec 文件）
   Test Files  14 passed (14)
        Tests  142 passed (142)
   Duration  41.76s
   ```

   （退出码 0；`ai-context.spec.ts` 在复核起点为未跟踪文件、现已随 `e73293a` 入库，该次运行已包含它。）

2. `cd packages/element-plus-pro && npx vue-tsc --noEmit`

   ```
   （无任何输出）EXIT=0
   ```

3. `pnpm --filter "@qin-ui/element-plus-pro" build`
   ```
   > prebuild: tsx ../../scripts/generate-api-json.ts element-plus-pro && tsx ../../scripts/generate-init-ai.ts element-plus-pro
   Package API JSON generated at: …/packages/element-plus-pro/api.json
   init-ai CLI generated at: …/packages/element-plus-pro/bin/init-ai.mjs
   > build: vue-tsc --noEmit && vite build
   vite v6.4.1 building for production...
   ✓ 57 modules transformed.
   [vite:dts] Declaration files built in 3623ms.
   es/element-plus-pro.css   1.62 kB │ gzip:  0.49 kB
   es/index.js              68.24 kB │ gzip: 15.13 kB │ map: 143.02 kB
   ✓ built in 4.08s
   ```
   （退出码 0；`es/`、`api.json`、`bin/init-ai.mjs` 均在 `.gitignore` 内，构建后 `git status --porcelain -- packages/element-plus-pro` 仍为 0 行，未改动任何受版本控制的仓库文件。）

> 全程未修改仓库文件；仅写入本报告 `/tmp/change-review/element.md`（另有 `/tmp/change-review/` 下的 diff 快照与探针脚本）。未执行任何 `git add/commit/checkout/restore/stash/mv`。
