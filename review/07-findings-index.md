## 七、复核发现索引（⚠️ / ❌ 全量，按包）

> 由五份包级报告的原文自动抽取（含报告作者的措辞与行号），未经我改写；处置状态见 §八。

### packages/core（自动抽取 15 条）

- - **结论速览**：❌ 0 条；⚠️ 8 条（5 条挂在修改点、3 条在遗留），无阻断性问题；核心契约（core 零 UI 依赖、`cloneDeep` 降级告警、`normalizeColumn(s)` 仍 `@mutates`、`setPageParam` 白名单、`ensureColumnKeys` 幂等）逐条实测成立。
- - **复核结论**：⚠️ 建议改进 —— **同文件内 JSDoc 未同步**：`useTable.ts:160-161` 仍写「`dataSource` / `pageParam` … 会直接包裹（复用）传入的数组/对象引用，后续对返回实例的变更会穿透到调用方原对象」，与 `:365`/`:367` 的浅拷贝实现**正相反**（`8f55302` 只改了 `:159` 的 `columns` 行）。建议改为与 `columns` 同口径的行为陈述（如「内部持有其浅拷贝，`dataSource.value = [...]` 与内部增删不修改传入数组；元素对象仍共享，元素级就地变异双向可见」），并在既有 Changeset 中一并点明 dataSource/pageParam 的数组层解耦。
- - **复核结论**：⚠️ 建议改进 —— `useTable.ts:328` 注释「不改写已有 key、**不重建 children 数组**」中后半句与该行下方 `list[i] = normalizeColumn(col, allocateKey)` 的实际行为不符：`normalizeColumn` 在 `useTable.ts:263-267` 会把 `target.children` 整体 `map` 成**新数组**（键已存在的父列才走 `ensureColumnKeys` 的 else 分支不重建）。建议改为「已具备 key 的列不改写 key、不重建其 children 数组；缺失 key 的列经 `normalizeColumn` 递归补 children（会重建该列的 children 数组）」。
- - **复核结论**：⚠️ 建议改进 —— **同类 falsy 守卫在 append/prepend 路径残留**：`useFields.ts:608` 与 `useTable.ts:598` 仍是 `if (path) {`，因此 `appendField(0 as any, …)` / `appendColumn(0 as any, …)` 会被当作「未传路径」追加到末尾，而非定位到 key 为 `'0'` 的位点，与 `FF-43`/`TT-29` 锁定的「0 是合法 key」不自洽，且无用例覆盖。建议改判 `path === undefined || path === null`；注意 `''` 需单独定边界（改判后 `appendField('', f)` 将不再追加末尾而是无匹配、无操作），建议或保留 `!path && path !== 0` 的写法，或补一条用例显式锁定 `''` 语义。
- - **复核结论**：⚠️ 建议改进 —— `useFields.ts:22`/`:25` 与 `:31`、`:35` 的「按顺序取第一个**非空值**」措辞与实现（nullish 判定：`value !== undefined && value !== null`）不等价：`{ name: '', path: 'a' }` 返回 `''` 而非回退到 `'a'`。结合本批刻意把 `0`/`''` 收为合法 key（见 #5），建议措辞改为「第一个非 null/undefined 的值（空串与 `0` 视为合法标识）」，或按注释字面实现对 `''` 继续回退——二者需择一并补用例。
- - **复核结论**：⚠️ 建议改进（两处文档/不变量口径）：
- - **复核结论**：✅ 无误（但 `useTable.ts:160-161` 未纳入本轮同步，见 #2 的 ⚠️）。
- 1. ⚠️ **`useTable.ts:160-161` 的 `dataSource`/`pageParam` JSDoc 与实现矛盾**（本次最强的一条）：仍写「直接包裹（复用）传入的数组/对象引用…变更会穿透到调用方原对象」，而 `:365`/`:367` 已改为浅拷贝。建议按 `:159` 的口径改写，并在 `.changeset/fix-core-array-ref-sharing.md` 中点明这两个参数的数组/对象层解耦。
- 2. ⚠️ **`useTable.ts:328` 注释「不重建 children 数组」不精确**（缺失 key 的列经 `normalizeColumn` 会 `map` 重建 `children`，`useTable.ts:263-267`）。建议限定为「已具备 key 的列不重建其 children 数组」。
- 3. ⚠️ **`toPath` 文档/不变量口径两处不准**（`path.ts:240-241` + Changeset）：(a)「缓存同一实例且已冻结」仅字符串分支成立；(b) `toPath(v).join('.') === normalizePathKey(v)` 在数组含 `null`/`undefined` 时不成立（实测 `['a',null]` → `'a.null'` vs `'a.'`）。建议分档陈述或统一 `String` 归一化后补矩阵用例。
- 4. ⚠️ **append/prepend 路径残留 falsy 守卫**：`useFields.ts:608`、`useTable.ts:598` 的 `if (path)` 使 `0` 被当作未传路径（与 `FF-43`/`TT-29` 锁定的「0 是合法 key」不自洽），且无用例覆盖；改判时需同时定边界 `''` 的语义。
- 5. ⚠️ **`resolveFieldIdentity` 的「非空值」措辞与 nullish 实现不等价**（`useFields.ts:22/25/31/35`）：`{ name: '', path: 'a' }` 返回 `''` 不回退。建议措辞对齐实现并补一条断言。
- 6. ⚠️ **`AGENTS.md` §3.4 与代码口径不一致（既有偏差，非本批引入）**：文档写「`set` 遇到相同值（`Object.is`）时跳过写入」，代码用 SameValueZero（`path.ts:124-125`、`:207-216`），二者仅在 `±0` 上分叉（`Object.is(0,-0) === false`，SameValueZero 视为相等），且用例 `path.spec.ts:254` 名为 `SameValueZero 同值跳过不触发响应式变更`（基线 `734e3c0` 第 123 行即已如此，本次未改动）。建议二选一：把 AGENTS.md 措辞改为 SameValueZero（并注明对齐 lodash `assignValue`），或改代码为 `Object.is` 并补 `-0` 用例。
- 7. ⚠️ **`isDangerousKey` 的导出面与文档规格**：`path.ts:121` 已 `export`，但包根 `src/index.ts:6` 是白名单导出（`get, set, normalizePathKey, toPath`），故它只存在于深层导入面，无独立用例、JSDoc 也缺 `@param/@returns`（AGENTS.md §2.2 对函数的要求）。建议明确归属：要么补进包根导出面并更新 `SX-02` 清单 + 补 `@param/@returns`，要么标注 `@internal`（当前仅 `useFormData` 在包内使用）。
- 8. ⚠️ **浅拷贝对非数组入参由「静默兜底」变为「抛错」（低危）**：`useTable.ts:321/358/365` 的 `[...initColumns]` / `[...next]` / `[...initDataSource]` 在入参为 `Ref`/`ComputedRef`/`undefined` 之外的不可迭代值时会抛 `TypeError`；旧实现 `normalizeColumns` 对非数组返回 `[]`、`ref(非数组)` 不抛。类型面（`T[]` / `Columns<T,C>`）已拦住正常用法，仅 `as any` 或 JS 调用方可达，故列为低危；若在意兜底，可改为 `Array.isArray(x) ? [...x] : []`。

### packages/antd-vue-pro（自动抽取 8 条）

- - **结论分布**：24 个修改点中 **❌ 1 条**（重复字段校验，见第 13 条）、**⚠️ 10 条**（见「遗留与建议」）、其余 ✅。
- - **复核结论**：⚠️ 见「遗留与建议」W4（该边界说明在 74030da 中被从 JSDoc 删除）。
- - **复核结论**：⚠️ 见 W6（`size` 下发的是本地 model 而非有效值）。
- - **复核结论**：❌ **问题（本次改动引入重复校验）**。宿主内置控件自身也会调用 FormItem 上下文：`node_modules/ant-design-vue/es/input/Input.js:116`、`es/select/index.js:139`、`es/input-number/index.js:106` 均调用 `formItemContext.onFieldChange()`；修复后该上下文重新有效，于是**一次值写入触发两条校验通路**（控件自报 + BaseField 事件）。在 `/tmp/antd-probe`（仓库外临时目录，未写入仓库）以同一 `rules.validator` 计数实测：仅派发一次真实 `input` 事件时，**当前实现 validator 调用 2 次，734e3c0 旧实现 1 次**（`setValue` 双写场景为 4 次 vs 2 次）。后果是内联/异步（远程）校验器每次输入执行两遍，`validateFirst` 亦无法消除。建议二选一：(a) 在 `BaseFormItem.onFieldValueChange` 内按「同一 tick + 同一字段」合并（如 `nextTick` 去重、或记录已触发值）；(b) 仅对 Ant Design Vue 内置组件（宿主会自报的 `component` 键）不重复触发，自定义控件仍走事件路径。无论哪种都应补一条判别用例锁定「单次输入 → 校验器恰好 1 次」，当前测试只断言「错误态被渲染」（BF-A15），无法发现该回退。
- - **复核结论**：⚠️ 见 W8（`name` 优先级未在包文档/类型 JSDoc 中说明，且与 element-plus-pro 的 `name` 语义不同）。
- - **复核结论**：⚠️ 见 W1/W2/W3（新增 JSDoc 与旧 JSDoc 叠加成重复块；`getter`/`Ref` 与类型面不一致）。
- - **复核结论**：⚠️ 见 W7（`restoreMocks` 注释的时序描述不准）。
- **❌ 附带缺陷（需修，见第 13 条）**：修复 a11y 后，内置控件每次值写入触发 **2 次**字段校验（`input`/`select`/`input-number` 自报 + `field-value-change` 事件），实测 2 vs 旧 1（`setValue` 场景 4 vs 2）。无测试锁定校验次数，建议合并去重并补判别用例。

### packages/antdv-next-pro（自动抽取 8 条）

- - **结论分布**：修改点 27 条 → ✅ 22 条、⚠️ 5 条（第 2、11、15、17、25 条）、❌ 0 条
- - **附注（⚠️ 提示，非缺陷）**：`:72` 仍留有一份手写兜底清单 `['onChange','onScroll','onUpdate:expandedRowKeys']`，仅在宿主不暴露 `emits` 时生效。当前宿主版本 `emits` 已定义且推导结果与该清单逐字相同 → 该分支**当前不可达**（类型层契约「不手写 emit 键名」未被违反；若要求零手写，可改为 `names.length === 0` 时按 `TableProps` 事件通道显式降级并同步告警）
- - **复核结论**：✅（默认路径）无误 / ⚠️（自定义路径）见下
- **⚠️ 建议改进（自定义查询按钮仍留双触发隐患）**：`:156-162` 的自定义 `searchButton` 分支与 `search-button` 插槽分支仍只挂 `@click="onSearch"`。若自定义组件渲染的是未声明 `type` 的原生 `<button>`（HTML 缺省即 submit 按钮），真实浏览器中会「click → onSearch」+「submit → onSearch」双发，与本次修复的缺陷同源。`SF-A10`（`:133`）与 `SF-03`（`:292`）在该场景下断言 `emitted('search')` 为 1，但因 happy-dom 对无 `type` 属性的按钮不做隐式提交而恒真 —— **属环境相关假绿**（三包同构，非本包独有）。建议二选一：① 文档/类型注释要求自定义查询按钮显式 `type="button"`；② 在该分支改为「不挂 `@click`、由组件内部自行触发表单 submit」或对 slot 内容加 `@click.prevent` 语义。真实浏览器行为**待确认**（需手工/Playwright 验证）
- - **复核结论**：✅ 无误，但 ⚠️ 两点（注释/用例与覆盖不符，不构成行为缺陷）：
- - **复核结论**：✅ 无误 / ⚠️ 文案滞后（低优先）：组件 JSDoc（`:4`）仍写「动态渲染外部传入的 VNode、渲染函数或静态字符串」，未包含改动后支持的「组件定义对象」（四包同句，非本包独有）。建议补一句行为边界
- - **复核结论**：✅ 无误（用例与实现断言逐条读了关键 20 余条）。⚠️ 单点保留意见见修改点 11 / 15：`SF-A10`、`SF-03` 的自定义按钮点击次数断言在 happy-dom 下恒真；`BI-A15b` 标题承诺超出断言范围
- - **复核结论**：✅ 无误 / ⚠️ 一处未同步（低优先）：`docs/antdv-next-pro/components/pro-table/index.md:71` 仍把 `addIndexColumn` 默认值写作 `-`，未随 README 改为 `true`（`control` 行同为空，属文档整列风格问题）；`docs/.../pro-table/index.md` 的 `search` 类型写作 `Function`，可对齐 README 的 `() => Promise<unknown>`

### packages/element-plus-pro（自动抽取 15 条）

- - **复核结论**：⚠️ 建议改进（见"遗留与建议"第 4 条：空/透传插槽的包装组件会误报；且 JSDoc 与文档未声明 `default` 被保留）。
- - **复核结论**：⚠️ 建议改进（低：`:16-19` 注释为设计动机式表述且未被注释守卫覆盖；`:34-39` 对 `key: ''` 无守卫）。
- - **复核结论**：⚠️ 建议改进（低：`:101`/`:114` 残留恒不可达的 `Array.isArray(raw)` 分支，见"遗留与建议"第 2 条）。
- - **复核结论**：⚠️ 建议改进（PF-E3 锁定的语义对使用者是陷阱，建议文档化或改注入源，见"遗留与建议"第 6 条）。
- - **复核结论**：⚠️ 建议改进（两处同类残留未清，见"遗留与建议"第 1、3 条）。
- - **复核结论**：⚠️ 建议改进（3 处文档滞后，见"遗留与建议"第 7 条）。
- 1. **⚠️ 重复 JSDoc 块（本批次引入）**：`src/components/form/types/index.ts:106-108`（`hidden`）与 `:115-117`（`disabled`）保留了旧的一行块，紧随其后才是新契约块（`:109-112`、`:118-120`）；`src/components/table/types/index.ts:59-60` 同样残留 `/** 是否隐藏该列 */`。TS 只把最近的前置注释挂到声明上，前一块成为死注释；`comment-conventions.spec.ts` 用 `toContain` 断言，检测不到重复。**建议**：删除失效块（旧块文本分别是"字段是否隐藏""字段是否禁用""是否隐藏该列"），并在守卫用例中加"同一属性前不得出现两个连续 JSDoc 块"的断言。
- 2. **⚠️ `useGroupFieldAttrs` 死分支**：`src/components/form/hooks/useGroupFieldAttrs.ts:101` 与 `:114` 的 `Array.isArray(raw) ? raw.join('.') : (raw as string) || ''` —— `core` 的 `resolveFieldIdentity` 返回类型为 `string`（`packages/core/src/form/useFields.ts:38-48`，内部已用 `normalizePathKey` 归一化，含数组入参）。数组分支恒不可达。**建议**：直接 `path: resolveFieldIdentity(field, ELEMENT_FIELD_IDENTITY_KEYS)`，并在类型上收敛为 `string`。
- 3. **⚠️ `ProTable` 残留死可选链**：`src/components/table/components/ProTable.vue:413-414` 的 `fieldList.filter(...)?.length > 0`，`filter` 恒返回数组，`?.` 无意义（该行本批次被改写但带病保留）。**建议**：去掉 `?.`。
- 4. **⚠️ `default` 插槽告警按"键存在"判定，易误报 + 文档未声明**：`ProTable.vue:265-281` 只要 `slots` 上存在 `default` 键就告警一次；包装组件写 `<ProTable …><slot /></ProTable>`（外层无内容）时 `default` 键仍存在，会输出"default 插槽保留…"的误导提示；同时 `ProTable.vue:44-47` 的 `@slot` 清单与 `README.md`/`docs/element-plus-pro/components/pro-table/index.md` 均未说明 `default` 被保留（docs:142 反向写着"其余 el-table 列插槽也会透传"）。**建议**：告警时先判断该插槽实际产出（如调用后仅得注释/空数组则跳过），或在 JSDoc 与文档显式声明 `@slot default - 保留给列渲染器，不透传宿主表格`。
- 5. **⚠️ `PRO_TABLE_PROP_KEYS` 的推导依赖 Vue 内部行为，缺 Provider 侧守卫用例**：该集合的"确定性"来自 Vue `initProps` 会把所有声明 prop 补成 `undefined` 自有键（已在 vue 3.5.34 实测 12 键恒定）。若该内部行为变化，Provider 注入的 `pagination`/`columns`/`data` 会重新进入 `injectTableAttrs` 并作为原生属性落到表格 DOM——现有用例只覆盖了 Provider `columns`（PT-A28b），未覆盖 Provider `pagination`/`data`。**建议**：补 1 条"Provider 注入 `pagination`/`data` 时 `ElTable` 元素上无同名 DOM 属性"的判别用例，或把排除集合写成显式字面量清单（自文档化）。
- 6. **⚠️ `useFormData()` 与 `:form` 实例数据不通（PF-E3 已锁定为契约）**：`ProForm/index.vue:85-87` 的兜底实例在 setup 期无条件创建并提供数据 store，因此 `<ProForm :form="form">` 子树内 `useFormData()` 拿到的是**内部兜底 store**（`formData` 与 `form.formData` 非同一对象，读写不互通）。这一行为在四包同构且被用例显式断言，但 `useFormData` 是顶层导出（`SX-01` 键集合含它），而 `README`/`docs` 未提及该边界，使用者极易静默写丢数据。**建议**：二选一 —— ① 在 `ProForm` 的公开 JSDoc/README 中声明"`useFormData()` 复用 ProForm 内部兜底实例的 store，传 `:form` 时请直接使用传入实例"；② 让数据 store 注入指向 `currentForm`（`provide` 一个按 `currentForm.value` 取值的代理 store）。
- 7. **⚠️ 文档滞后三处**：① `docs/element-plus-pro/components/pro-table/index.md:121` 仍写 `addIndexColumn` 默认 `-`，而 Provider 内置默认为 `true`（`component-provider/constants/index.ts:29`）、README 已改 `true`；② 同页 `:142` "其余 el-table 列插槽…也会透传" 未排除已保留的 `default`；③ `docs/element-plus-pro/components/pro-form/index.md:82-84` 的字段表未同步 `prop` 优先/`name` 透传与 `disabled` 继承说明（README:392-393 已补）。**建议**：与 README 对齐。
- 8. **⚠️ 覆盖缺口（低）**：Provider 级（而非 props 级）`searchFormConfig.hidden`/`container` 无用例；`props.data`/`props.columns` 未做 `toValue`（`table.data`/`table.columns` 有做），传 `Ref` 时类型层已禁止但运行期会静默失效（`columns` 的运行时声明为 `type: null` 不告警，`data` 为 `Array` 会触发类型告警）——是否补 `toValue` 属产品取舍，**待确认**。
- 9. **⚠️ 跨包漂移登记（本次未修，非 element 缺陷）**：① `packages/antd-vue-pro/src/components/table/components/ProTable.vue:362-364,367-369` 与 `packages/antdv-next-pro/.../ProTable.vue:371-377` 仍为 `tableAttrs`（attrs）优先的数据源/分页来源，且两者 `:460`/`:474` 仍把含 `container`/`hidden` 的 `computedSearchFormConfig` 整体 `v-bind` 给 `SearchForm` —— 即 element 本批次修的 CR-094/CR-098 在两包未同步；② lint 级：`ProTable` 告警前缀 `[ProTable]` 与 `[pro-components]`（`ProTable.vue:277`、`BaseFormItem/index.vue:111`）不统一。**建议**：按 §4.1 立项同步两包（或明确 element 独有契约并在 Changeset 说明）。

### packages/vant-pro（自动抽取 11 条）

- - **复核结论分布**：21 条修改点中 ✅ 13 条、⚠️ 6 条、❌ 2 条（详见各条目「复核结论」；另见「遗留与建议」3 条 pre-existing 残留）
- - **影响**：运行时行为变更（仅影响配置了 `valueFormatter.get` 的 popup 字段）；公开 API 签名不变；类型契约不变；无性能影响。**需要 Changeset**：`.changeset/fix-vant-popup-semantics.md`（`minor`）已写明「⚠️ 升级影响」小节，逐字说明了两分支取值差异与「未配置 valueFormatter 的字段行为不变」——需求已满足。
- - **复核结论**：⚠️ 建议改进——契约第 3 条「其余忽略」分支（传入 string/object 等非函数非数组）**无用例覆盖**，建议补 1 条（`dispatchListeners('x' as any)` / `dispatchListeners({} as any)` 不抛错且不调用）。
- - **复核结论**：⚠️ 建议改进（3 处，均经仓外探针实证）：
- - **复核结论**：⚠️ 建议改进（低危）——非对象回退键为 `` `raw_${String(field)}` ``，两个相同原始值（如两个 `'a'`、两个 `null`）会得到同一 key，JSDoc（`:14-16`）称「按字面量生成稳定 key」但未声明该冲突；`BaseFormItem` 已用 `isObjectItem` 过滤故组件路径不可达，直接消费 `useGroupFieldAttrs`/`getFieldKey` 时可达。建议改为 `raw_${typeof field}_${String(field)}_${index}` 形态（需传入下标）或在 JSDoc 标注该边界。
- - **复核结论**：⚠️ 建议改进——**ProForm 从不给 BaseFormItem 传 `disabled`**（`ProForm/index.vue:148` 只有 `:fields`），且 `BaseField` 恒把 `disabled` 写成显式布尔（`:188-198` `{ disabled: effectiveDisabled }`），该显式 `false` 会**遮蔽 van-form 的 disabled 上下文**（vant `Field.getProp` 优先取自身 prop，仅在其为 `undefined` 时才回落 `form.props[key]`）。探针实证：P-01 `<ProForm disabled>` → `VanForm.disabled=true`、`VanField.disabled=false`、`VanStepper.disabled=false`；P-01b 更严格：`van-cell--disabled` 计数 0、`input` 无 `disabled` 属性、stepper 加减号均无 `disabled`、`van-stepper__plus` 仍带 `van-haptics-feedback`（可交互）。即 **`<ProForm disabled>` 对 vant 字段整体无效**，与 `ProForm/index.vue:21` 的 `@param {boolean} [disabled] - 全局表单禁用` 及四包同构 JSDoc（`types/index.ts:95`）不符；其余三包靠宿主 Form 原生 disabled 上下文（antd/element）或 ProForm 自建上下文（antdv-next `ProForm/index.vue:82-88`）成立，属**四包漂移**。建议：vant 侧在 ProForm 把 `attrs.disabled`（含 `''`/`'true'` 归一）经 `:disabled` 下传 `BaseFormItem`，或改由 `useProviderDisabled` 式上下文；若决定不做，则应把 vant 的 `Field.disabled` JSDoc 收窄为「继承宿主 Provider 注入的 componentVars 禁用值」，并删掉 ProForm 的「全局表单禁用」措辞。
- - **复核结论**：❌ 问题——(a) `:83-85` 与 `:91-93` 是**未被删除的旧 JSDoc 残留**（同一成员两段 `@description`，违反 AGENTS.md §2 的注释规范；docgen/IDE 取后者，前者纯噪声），且 `hidden` 的新块把 `path` 语义写进了 `hidden` 的说明、`path` 成员自身（`:79-82`）只有一句「字段标识namePath, 同name」；(b) 新块声称 `hidden` 支持 Ref/getter，但声明类型是 `hidden?: boolean`——运行时确实经 `toValue` 支持，**类型面却拒绝**（`BaseFormItem` 不得不用 `(field as any).hidden` 绕过，见 `BaseFormItem/index.vue:45`），文案与类型契约不一致。建议：删除两处旧 JSDoc 块；把嵌套 path 说明移到 `path` 成员；将类型放宽为 `hidden?: MaybeRefOrGetter<boolean>`（`disabled` 同理，或把 JSDoc 收窄为「渲染期按 toValue 取值」并说明类型面仅布尔）。
- - **复核结论**：⚠️ 建议改进（低危，2 点）：(a) `src/index.ts:63` 仍为 `app.component(ProComponentProvider.name!, ProComponentProvider)`，其余三包已改为 `ProComponentProvider.name ?? 'ProComponentProvider'`（`antd-vue-pro/src/index.ts:83-86` 等）——CR-025 的 install 项**漏改 vant**（运行时无影响：`component-provider/components/index.vue:38-39` 有静态 `name`）；(b) `shared/core/index.ts` 分组注释失准：`:5` 的 `// types` 只覆盖 `type AdditionalMethods`，紧随的 `localePacks`/`normalizeColumn(s)` 是值导出；`resolveFieldIdentity`/`DEFAULT_FIELD_IDENTITY_KEYS` 被放在 `:10` 的 `// hooks` 下，实为字段标识 utils。建议把 `// types` 下移或拆成 `// 字段标识 / 表格列归一` 分组。
- - **复核结论**：❌ 问题——**README 的 `formPopup` 表格仍是 CR-055/CR-059 之前的旧语义**，与实现、与新 JSDoc、与 `docs/vant-pro/components/pro-form/index.md:60` 直接矛盾：`README.md:236`「可传初始值（**原始数据**）」、`:255`「打开指定字段的弹层；**自动重置属性为默认值后合并 customProps**；`initialValue` 传**原始数据**」、`:258`「`updateProps(props)`：合并更新当前弹层属性」。而实现是 `open()` 不再重置基础属性、`initialValue` 取控件侧取值、`updateProps` 写持久基础属性。CR-060 声称「docs 补 updateProps/open/initialValue 语义说明」只落到 `docs/`，**包内 README（npm 页面与 `files` 发布物）漏改**。建议按 `docs/vant-pro/.../index.md:60` 的措辞同步 `README.md:236/255/258`，并把该表并入注释/文档契约用例（如 `comment-conventions.spec.ts`）以防回流。
- - **复核结论**：⚠️ 建议改进（低危）——`tsconfig.json` 在 `files` 发布清单内（`files: ["es","src","bin","README.md","LICENSE","api.json","AI-CONTEXT.md","tsconfig.json"]`），而 `types: ["node"]` 会把自动纳入的 `@types/*` 收窄为仅 `node`，且 `@types/node` 只是 devDependency；若有消费方 `extends` 该 tsconfig，将需要自备 `@types/node` 并失去其它自动 `@types`。**待确认**：是否有外部消费方 `extends`（仓库内仅本包使用）。建议改为在 `__tests__` 侧局部声明，或把 `@types/node` 提为 `peerDependencies`/`dependencies`。
- - **复核结论**：✅ 无误（判别性断言可失败：`BF-09` 的 `hasAttribute`、`BI-A17` 的节点恒等、`VP-V19` 的 `setupCount` 与节点恒等均为强判别）。⚠️ 提示：`comment-conventions.spec.ts`/`ai-context.spec.ts` 属「文档子串契约」，合法改词即转红，属设计取舍，仅需知悉维护成本。

### 抽取统计

- 含 ⚠️ 的行：53 条；含 ❌ 的行：8 条（含重复引用，仅供定位；权威结论以各包报告原文为准）
