# packages/core 修改清单（734e3c0 → 当前）

> 复核范围：`git log --oneline 734e3c0..HEAD -- packages/core`（HEAD = 74030da）；基线 734e3c0 = `chore(release): core 2.0.6`。
> 复核方式：全量 diff + 逐文件打开当前源码读上下文 + 逐提交 `git show` 核对意图 + 独立跑门禁与跨包全量测试。**未修改仓库任何文件**。

## 概览

- **提交数**：15 个（其中 11 个动 `packages/core/src`，4 个仅测试/配置：`1265b6e` / `0ea21e0` / `0a47cfe` / `e689378`）。
- **文件数**：23 个（`src` 12 + `__tests__` 9 + 2 个构建配置），`git diff 734e3c0 --stat -- packages/core` = 23 files changed, 855 insertions(+), 162 deletions(-)。
- **工作区未提交改动**：无（`git status --porcelain -- packages/core` 为空输出），故 `git diff 734e3c0 -- packages/core` 即全部差异。
- **用例数**：静态 `it/test` 声明 **168 → 188**；当前实测运行 **207 passed / 11 files**（vitest 4 展开 `it.each`）。基线未运行（避免 `git checkout` 改工作区），基线运行时值标「待确认」，故只以静态声明数对比。
- **门禁结果**：
  - `cd packages/core && npx vitest run` → `Test Files 11 passed (11)` / `Tests 207 passed (207)`，exit 0。
  - `pnpm --filter "./packages/*" exec vue-tsc --noEmit` → 无任何输出，exit 0（0 错误）。
  - 附加实测（非任务门禁）：`pnpm -r test` → 五包全绿 exit 0（core 207 / vant-pro 90 / antd-vue-pro 133 / element-plus-pro 142 / antdv-next-pro 133）；`node scripts/check-test-ids.mjs` → `用例编号在同一包内唯一 ✓`。
- **结论速览**：❌ 0 条；⚠️ 8 条（5 条挂在修改点、3 条在遗留），无阻断性问题；核心契约（core 零 UI 依赖、`cloneDeep` 降级告警、`normalizeColumn(s)` 仍 `@mutates`、`setPageParam` 白名单、`ensureColumnKeys` 幂等）逐条实测成立。

---

## 修改点

### 1. `cloneDeep` 对 Vue 响应式入参先解包再克隆，消除静默 JSON 降级

- **位置**：`packages/core/src/shared/utils/index.ts:19-44`（解包在 `:21`，JSDoc 边界 `:14-15`）
- **修改点**：`structuredClone(value)` → `const source = isProxy(value) ? toRaw(value) : value` 后 `structuredClone(source)`；降级分支与最终兜底一并改用 `source`（`:36`、`:37`、`:42`）。新增 `import { camelize, isProxy, toRaw } from 'vue'`。
- **解决的问题**：`reactive()` / `ref.value` 都是 Proxy，`structuredClone` 必抛 `DataCloneError`（本机 Node 20.19.1 实测 `THROWS DataCloneError #<Object> could not be cloned.`）→ 误入 JSON 降级：`Date` 变 ISO 字符串、`Map/Set/RegExp/Error` 变 `{}`、并打印误导性降级告警。`useTable` 的列快照与 `resetQueryParams` 正会传入响应式数据。评审编号 CR-008。
- **影响**：运行时行为（响应式入参克隆结果类型不再变形）；API 无变化；类型契约无变化（`cloneDeep<T>(value: T): T` 未动）；性能微增一次 `isProxy` 判定；文档已补「仅解包入口一层，内部持有响应式代理时仍走 JSON 降级」边界；测试新增 `CR-008`。**非 breaking**；Changeset `.changeset/fix-clonedeep-reactive.md`（patch）已在库。
- **证据**：`packages/core/__tests__/utils.spec.ts:108` `CR-008 [判别]: 响应式代理入参按原始对象克隆，Date/Map 类型不降级且无降级告警`；提交 `029d10b`。判别力已独立确认：解包前该用例必红（`copy.d` 会是字符串）。
- **复核结论**：✅ 无误。`json === undefined ? (source as T)` 的类型断言必要且正确；一次性告警开关 `warnedJsonFallback` 语义未被破坏（`utils.spec.ts:222` 仍断言降级时恰好一次告警）。

### 2. `useFields` / `useTable` 入口浅拷贝，不再就地变异调用方数组（`@mutates` 契约收敛）

- **位置**：`packages/core/src/form/useFields.ts:309`；`packages/core/src/table/useTable.ts:321`（列）、`:358-359`（重赋值）、`:365`（dataSource）、`:367`（pageParam）
- **修改点**：
  - `fields.value = initFields || []` → `fields.value = [...(initFields || [])]`。
  - 列：新增 `const initialColumns = [...initColumns]` 再 `normalizeColumns(initialColumns, …)`；`customRef.set` 内 `normalizeColumns(next)` + `columnState.value = next` → `const nextColumns = [...next]; normalizeColumns(nextColumns, …); columnState.value = nextColumns`。
  - `dataSource = ref(initDataSource)` → `ref([...initDataSource])`；`pageParam = reactive(initPageParam)` → `reactive({ ...toValue(initPageParam) })`。
- **解决的问题**：此前 `appendField/prependField/deleteField`、列增删与 `columns.value = [...]` 会直接 `push/unshift/splice/索引赋值` 到调用方数组，`columns.value` 与传入数组同一引用（CR-016）。收敛为「数组层解耦 + 元素仍共享」。
- **影响**：**运行时行为 breaking**（依赖「传入数组即状态本体」的代码需迁移）；`useFields`/`useTable` 公开签名与返回类型不变；`normalizeColumn(s)` 对**列对象**就地补 key 的 `@mutates` 保留（`useTable.ts:223-224`、`:274-277`）；dataSource/pageParam 的元素级变异仍穿透；JSDoc 已同步（`useTable.ts:159`、`useFields.ts:253`）；测试由「锁旧契约」改为「判别新契约」：`FF-01`、`TT-21`、`TT-26`、`TT-27`。Changeset `.changeset/fix-core-array-ref-sharing.md`（**minor**，含升级影响与迁移示例，级别恰当）。
- **证据**：`useFields.spec.ts:12` `FF-01 [判别] 内部持有 init 数组浅拷贝：增删字段不修改调用方数组`；`useTable.spec.ts:240` `TT-21`、`:304` `TT-26`、`:331` `TT-27`；跨包 `antd PT-A15`；提交 `8f55302`。五包 705 用例全绿，未发现任何 UI 包依赖旧共享语义（全仓 grep 仅 `useTable.ts:623/627` 与 core 用例出现 `columns.value.push`）。
- **复核结论**：⚠️ 建议改进 —— **同文件内 JSDoc 未同步**：`useTable.ts:160-161` 仍写「`dataSource` / `pageParam` … 会直接包裹（复用）传入的数组/对象引用，后续对返回实例的变更会穿透到调用方原对象」，与 `:365`/`:367` 的浅拷贝实现**正相反**（`8f55302` 只改了 `:159` 的 `columns` 行）。建议改为与 `columns` 同口径的行为陈述（如「内部持有其浅拷贝，`dataSource.value = [...]` 与内部增删不修改传入数组；元素对象仍共享，元素级就地变异双向可见」），并在既有 Changeset 中一并点明 dataSource/pageParam 的数组层解耦。

### 3. 列 `key` 规范化覆盖元素级变异（`columns` 改为 `customRef` + 读时幂等补齐）

- **位置**：`packages/core/src/table/useTable.ts:326-345`（`ensureColumnKeys`）、`:347-363`（`customRef` 定义）、`:351-362`（get/set）
- **修改点**：删除原先只覆盖整体重赋值的 `watch(columns, normalizeColumns, { flush: 'sync' })`；改为 `columns = customRef((track, trigger) => ({ get(){ track(); ensureColumnKeys(columnState.value, allocateColumnKey); return columnState.value }, set(next){ const nextColumns=[...next]; normalizeColumns(nextColumns, allocateColumnKey); columnState.value = nextColumns; trigger() } }))`；内部经 `ref`（`columnState`）转发以保留数组/元素的深层响应式与原引用。
- **解决的问题**：`columns.value.push(…)` / `columns.value[i] = {…}` 等元素级变异绕过规范化，新列无 `key` → `ColumnControl` 看不到该列、按 key 的 `setColumn`/`deleteColumn` 定位失效（CR-009）。
- **影响**：运行时行为（`columns.value` 读取即补齐缺失 key，赋值语句返回后 key 即就绪，无需 `nextTick`）；公开 API/类型不变（仍是 `Ref<Columns<T,C>>`）；性能：每次读 `columns.value` 多一次 O(n) 遍历（仅比较、仅缺失时写入）；文档：`:159` 与 `normalizeColumns` 的 `@mutates` 边界已同步；测试新增 `TT-27`（push/索引赋值/引用恒等）、`TT-28`（分组列递归）并改造 `DC-01`、`regressions`。Changeset `.changeset/fix-column-keys-element-mutation.md`（patch）已在库。**非 breaking**。
- **证据**：`useTable.spec.ts:331` `TT-27 [判别] columns 元素级变异后读取即补齐唯一 key，且不覆盖显式 key`、`:355` `TT-28`、`:373` `DC-01`、`:281` `TT-25`（重赋值补 key + 冻结列副本替换槽位）；跨包 `antd PT-A15`（`resizeColumn` 式元素变异仍驱动渲染）；提交 `c20e669` + `8f55302`。幂等性经代码核对成立：仅当 `col.key === undefined || null` 时写入，`normalizeColumn` 必落一个字符串 key（`useTable.ts:243-262` 兜底链），第二次读取即命中跳过；且**不改写已有 key**。
- **复核结论**：⚠️ 建议改进 —— `useTable.ts:328` 注释「不改写已有 key、**不重建 children 数组**」中后半句与该行下方 `list[i] = normalizeColumn(col, allocateKey)` 的实际行为不符：`normalizeColumn` 在 `useTable.ts:263-267` 会把 `target.children` 整体 `map` 成**新数组**（键已存在的父列才走 `ensureColumnKeys` 的 else 分支不重建）。建议改为「已具备 key 的列不改写 key、不重建其 children 数组；缺失 key 的列经 `normalizeColumn` 递归补 children（会重建该列的 children 数组）」。

### 4. 列定位支持数字 key `0`（falsy 守卫 → nullish 守卫，表侧）

- **位置**：`packages/core/src/table/useTable.ts:394`（`updaterMatch` 守卫）、`:397-399`（`keyStr` 归一）、`:411-421`（匹配分支）、`:465`（`setColumn`）、`:521`（`deleteColumn`）
- **修改点**：`if (!key) return` → `if (key === undefined || key === null) return`；新增循环外一次 `const keyStr = typeof key === 'string' || typeof key === 'function' ? key : String(key)`；匹配分支由 `else if (columnItem.key)` / `else if (columnItem.dataIndex)` 改为显式 `!== undefined && !== null`，`dataIndex` 非数组时 `String(columnItem.dataIndex)`。
- **解决的问题**：`0`（以及 `''`）被 falsy 守卫当作未传参直接 return，数组下标与 `'0'` 列 key 静默失效；`dataIndex: 0` 的列同样无法被定位（CR-020 表侧）。
- **影响**：运行时行为修正（`setColumn(0 as any, …)` / `deleteColumn(0 as any)` 命中 `key: '0'` 的列）；公开 API/类型不变（`Path<T>` 仍是字符串联合，数字 key 需 `as any`——与既有 `FF-43`/`TT-29` 用例口径一致）；性能：归一在遍历外一次，不进入热路径；文档无变化；测试新增 `TT-29`。Changeset 并入 `.changeset/fix-core-key-guards-and-proxy.md`（patch）。**非 breaking**。
- **证据**：`useTable.spec.ts:398` `TT-29 [判别]: setColumn/deleteColumn 支持数字 key 0`；`regressions.spec.ts:51`（按补齐 key 精确定位）；提交 `84e2eaf`。
- **复核结论**：✅ 无误。`columnItem.key === keyStr` 中显式 key 恒为字符串（`normalizeColumn` 产物），数字 key 归一到字符串后比对自洽。

### 5. `useFields` / `useFormData` 的 falsy 守卫收敛为 nullish（含 0 与 `''` 合法 key）

- **位置**：`packages/core/src/form/useFields.ts:346`（`updaterMatch`）、`:402`（`getField`）、`:447`（`setField`）、`:501`（`deleteField`）、`:589`（`getParentField`）；`packages/core/src/form/useFormData.ts:142`（`getFormData`）、`:155`/`:159`（`setFormData`）、`:145`/`:166`（非字符串 path 经 `normalizePathKey` 归一）
- **修改点**：`if (!path) return` → `if (path === undefined || path === null) return`；`get/setFormData` 对非字符串 path 先 `normalizePathKey(path)` 再交给 `get`/`set`。
- **解决的问题**：`0` 与 `''` 作为合法 key（数组下标、`'0'`/`''` 字段）此前被静默吞掉（CR-020，表单侧）。
- **影响**：运行时行为修正；`fields`/`formData` 读写 API 类型不变；测试新增 `FF-43`、`FD-24`（`0ea21e0` 提交说明中记录 `FF-43`/`TT-29` 因同文件并行改动延后至 `0a47cfe` 落库）；Changeset `.changeset/fix-core-key-guards-and-proxy.md`（patch）。**非 breaking**（此前是「静默无操作」，现为「按 key 命中」）。
- **证据**：`useFields.spec.ts:479` `FF-43 [判别]: getField/setField/deleteField 支持数字路径 0`；`useFormData.spec.ts:265` `FD-24 [判别]: getFormData/setFormData 支持 0 与 '' 作为 key`；提交 `84e2eaf` + `0a47cfe`。
- **复核结论**：⚠️ 建议改进 —— **同类 falsy 守卫在 append/prepend 路径残留**：`useFields.ts:608` 与 `useTable.ts:598` 仍是 `if (path) {`，因此 `appendField(0 as any, …)` / `appendColumn(0 as any, …)` 会被当作「未传路径」追加到末尾，而非定位到 key 为 `'0'` 的位点，与 `FF-43`/`TT-29` 锁定的「0 是合法 key」不自洽，且无用例覆盖。建议改判 `path === undefined || path === null`；注意 `''` 需单独定边界（改判后 `appendField('', f)` 将不再追加末尾而是无匹配、无操作），建议或保留 `!path && path !== 0` 的写法，或补一条用例显式锁定 `''` 语义。

### 6. `createFormProxy` 补 `deleteProperty` trap，`delete` 转发当前实例

- **位置**：`packages/core/src/form/useForm.ts:211-215`
- **修改点**：新增 trap `deleteProperty(_, prop) { const current = getCurrentForm(); return current ? Reflect.deleteProperty(current, prop) : true }`（实例缺失时静默丢弃并返回 `true`）。
- **解决的问题**：此前 `delete proxy.x` 无 trap → 删除只作用于代理自身的空 target，被静默吞掉，且与 `has`/`ownKeys`（`:217-230`）的反射口径不一致（CR-018）。
- **影响**：运行时行为修正；`createFormProxy` 签名/返回类型不变；与其他 trap（`get`/`set`/`has`/`ownKeys`/`getOwnPropertyDescriptor`）口径一致；测试新增「代理 delete 转发当前实例：删除生效且 in 判定同步」。Changeset 并入 `.changeset/fix-core-key-guards-and-proxy.md`（patch）。**非 breaking**。
- **证据**：`useForm.spec.ts:217` 「代理 delete 转发当前实例：删除生效且 in 判定同步」（含 `delete orphan.anything === true` 的无实例分支）；提交 `84e2eaf`。
- **复核结论**：✅ 无误。返回 `Reflect.deleteProperty` 的布尔值符合 Proxy 规范（`false` 会在严格模式抛 TypeError，此处正确透传）。

### 7. `InjectionFormSlotsKey` 类型改为 `ShallowRef`，与实际注入形态一致

- **位置**：`packages/core/src/form/constants.ts:13-15`；同时 `:1` 改为 `import type { InjectionKey, ShallowRef } from 'vue'`
- **修改点**：`InjectionKey<Record<string, any>>` → `InjectionKey<ShallowRef<Record<string, any>>>`。
- **解决的问题**：注入 key 的类型与四包实际 `provide` 的形态不符（CR-028）：四包均为 `shallowRef<Record<string, any>>(slots)` + `triggerRef` 后 provide。
- **影响**：类型契约（消费端 `inject()` 后需 `.value`，与实现一致）；运行时零变化；文档：`:11-12` 描述仍准确；测试新增 `CR-028`（编译期 + 运行时 `isRef` 形态锁）。Changeset 并入 `.changeset/fix-core-key-guards-and-proxy.md`（patch）。**类型层 breaking**（极窄：直接 `inject(InjectionFormSlotsKey)` 后按对象使用的代码会类型报错），Changeset 未显式标注「类型变更」，建议在 Changeset 中补一句。
- **证据**：`packages/core/__tests__/useForm.spec.ts:240` `CR-028 [判别]: InjectionFormSlotsKey 的注入形态为 ShallowRef`；四包 provide 站点实测一致：`antd-vue-pro/.../ProForm/index.vue:145,149`、`antdv-next-pro:155,159`、`element-plus-pro:147,151`、`vant-pro:113,117`；提交 `84e2eaf` + `0f61b82`（`import type` 收敛）。
- **复核结论**：✅ 无误（建议 Changeset 补类型变更说明，见上）。

### 8. `useSearchFormExpand` 移除未参与计算的 `columnGap` props（死配置）

- **位置**：`packages/core/src/table/useSearchFormExpand.ts:28-33`（`UseSearchFormExpandProps`，`columnGap?: number` 已删除）
- **修改点**：从 props 接口删除 `columnGap?: number`。基线代码 `git show 734e3c0:packages/core/src/table/useSearchFormExpand.ts | grep -n columnGap` 仅命中第 31 行（声明处），确认**全文件从未使用**。
- **解决的问题**：死配置误导调用方；CR-027。
- **影响**：类型契约窄化（可选成员删除）→ 对「显式传对象字面量含 `columnGap`」的 TS 调用方是 excess-property 报错（**类型层 breaking，范围极小**）；运行时零变化；四包 `SearchForm.vue` 自己的 `columnGap` props 仍保留并驱动宿主栅格 `gutter`/`gap`（`antd:35,92,108,119` 等四包均在），且以变量 `props` 形式传入 hook（`antd SearchForm.vue:102` `useSearchFormExpand(props)`），不触发 excess-property 检查，故 UI 侧零影响；测试新增 `CR-027`（`@ts-expect-error` 类型锁）。Changeset 并入 `.changeset/fix-core-key-guards-and-proxy.md`（patch）。
- **证据**：`useSearchFormExpand.spec.ts:677` `CR-027 [判别]: useSearchFormExpand props 不含未使用的 columnGap`；全仓 grep `columnGap` 仅剩四包 SearchForm 自身与用例；提交 `84e2eaf`。
- **复核结论**：✅ 无误（Changeset 建议点明这属于公开类型面窄化）。

### 9. 字段标识契约统一：新增 `resolveFieldIdentity` / `DEFAULT_FIELD_IDENTITY_KEYS` / `UseFieldsOptions`，`useForm` 第 4 参透传

- **位置**：`packages/core/src/form/useFields.ts:22-53`（类型、常量、解析器、选项接口）、`:311-312`（取值）、`:332`（缓存回验）、`:366`（BFS 遍历）；`packages/core/src/form/useForm.ts:109-113`（重载第 4 参）、`:132-147`（分派 `options = args[3]`）、`:161`（透传）；`packages/core/src/form/index.ts:4-13`（导出面新增 4 项）
- **修改点**：`field.name ?? field.path` 的两处内联解析 → `resolveFieldIdentity(field, identityKeys)`（按 `keys` 顺序取第一个 **nullish 之外** 的值并 `normalizePathKey`，`keys` 默认 `['name','path']`）；`useFields(initFields, options?)`、`useForm(…, root?, options?)` 支持 `fieldIdentityKeys`；root 布尔单参重载行为不变。
- **解决的问题**：core 的字段查找 API（`getField`/`setField`/`deleteField`/`getParentField` 及 `_map` 缓存）固定按 `name ?? path` 解析，与 element-plus 的渲染标识（`el-form-item` 用 `prop`）不一致 → `{ prop: 'a' }` 时 `getField('a')` 静默 miss；`{ path:'a', name:'b' }` 会绑到 `b`（CR-093）。四包收口：element 传 `['prop','path']`，其余三包用默认。
- **影响**：公开 API 新增（4 个导出，`index.spec.ts` 的 `SX-02` 双向一致断言已同步）；运行时行为：默认键序下与旧实现等价（`name` 优先、`path` 兜底），仅 element 等显式传键序的包口径变化；类型契约新增 `UseFieldsOptions` / `FieldIdentityKeys`；文档：嵌套字段示例路径全部更正为完整点分路径（`form/types.ts:17-23`、`useFields.ts:208-215`、`:272-285`）；测试新增 `FF-42` + 四包各 1 条规则锁。Changeset `.changeset/fix-field-identity-contract.md`（已含 CR-092/CR-093）。
- **证据**：`useFields.spec.ts:460` `FF-42 [判别]: fieldIdentityKeys 决定字段标识解析键序，默认 name 优先于 path`；`element-plus-pro/.../useFields.ts:63`、`useForm.ts:116`、`useGroupFieldAttrs.ts:99,112` 传 `ELEMENT_FIELD_IDENTITY_KEYS`（`:113` `['prop','path']`）；`antd`/`antdv-next`/`vant` 的 `useForm`/`useFields` 透传默认（逐一核对）；提交 `bd888e9`。
- **复核结论**：⚠️ 建议改进 —— `useFields.ts:22`/`:25` 与 `:31`、`:35` 的「按顺序取第一个**非空值**」措辞与实现（nullish 判定：`value !== undefined && value !== null`）不等价：`{ name: '', path: 'a' }` 返回 `''` 而非回退到 `'a'`。结合本批刻意把 `0`/`''` 收为合法 key（见 #5），建议措辞改为「第一个非 null/undefined 的值（空串与 `0` 视为合法标识）」，或按注释字面实现对 `''` 继续回退——二者需择一并补用例。

### 10. 批量 `setFormData` 过滤原型污染危险键，并导出 `isDangerousKey` 复用

- **位置**：`packages/core/src/form/useFormData.ts:175-187`；`packages/core/src/shared/path.ts:120-123`（`isDangerousKey` 由模块内常量改为 `export`）
- **修改点**：批量分支先用 `safeValue` 过滤 `__proto__` / `constructor` / `prototype`（`:176-179`），`newKeys` 与 `Object.assign` 均改用 `safeValue`（`:181`、`:187`）。
- **解决的问题**：`setFormData(JSON.parse('{"__proto__":{"polluted":1}}'))` 经 `Object.assign(formData, value)` 会替换/污染原型（评审 Top-10 优先项）。
- **影响**：运行时行为（危险键丢弃，`formData` 原型保持 `Object.prototype`）；公开 API 无变化（`setFormData` 重载未动）；模块内新增导出 `isDangerousKey`（**未**进包根导出面，见遗留）；文档：`:51` 的批量语义描述仍准确，新增 `:175` 行内注释；测试新增 `FD-A9`。Changeset `.changeset/review-top10-fixes.md`。
- **证据**：`useFormData.spec.ts:244` `FD-A9 [判别]: 批量 setFormData 丢弃 __proto__/constructor/prototype 且不替换原型`；**根因独立确认**：`JSON.parse` 会产生自有 `__proto__` 属性且 `Object.entries` 可枚举到它，故过滤生效；单路径入口另有 `set` 的 `isDangerousKey` 三处防护（`path.ts:173`、`:193`、`:203`，用例 `path.spec.ts:272`）；提交 `cc83f0b`。
- **复核结论**：✅ 无误。`safeValue` 用 `{}` 承接且键已过滤，`safeValue[key] = val` 不存在原型写入路径。

### 11. `camelizeProperties` 保留 `data-*` / `aria-*` 属性名

- **位置**：`packages/core/src/shared/utils/index.ts:126`（`const verbatimAttrRE = /^(data|aria)-/i`）、`:128-137`；JSDoc `:115`
- **修改点**：`[camelize(key), value]` → `[verbatimAttrRE.test(key) ? key : camelize(key), value]`；JSDoc 由「常用于处理 kebab-case」改为行为陈述「`data-*` 与 `aria-*` 属性名按原样保留，不参与驼峰转换」。
- **解决的问题**：`data-testid → dataTestid`、`aria-label → ariaLabel`，DOM 属性名被破坏（可访问性属性、测试选择器、埋点属性全部失效）；四包 `ProForm` 均为 `mergeProps(injectAttrs.value, camelizeProperties(attrs))` 且无白名单（CR-084）。
- **影响**：运行时行为修正；API/类型不变；文档已补边界；测试新增 `SU-04`（+ 四包 `PF-D1`）。Changeset `.changeset/fix-camelize-data-aria.md`。**非 breaking**（此前是缺陷）。
- **证据**：`utils.spec.ts:328` `SU-04 [判别]: camelizeProperties 转换 kebab-case，data-*/aria-* 属性名按原样保留`（含 `ARIA-live` 大写前缀、`on-row-click` 仍转驼峰的对照断言）；提交 `bdbd58d`。
- **复核结论**：✅ 无误。正则带 `i` 覆盖大小写前缀；未误伤 `on-row-click` 等普通 kebab key。

### 12. 新增 `isObjectItem` 谓词，字段配置含 `null`/原始值不再崩溃（含搜索字段可见性判定收口）

- **位置**：`packages/core/src/shared/utils/index.ts:46-55`（新增）；`packages/core/src/table/useSearchFormExpand.ts:23`（import）、`:367-375`（watch 源）
- **修改点**：新增 `isObjectItem(value) => value !== null && typeof value === 'object'`；`useSearchFormExpand` 的可见字段计数由 `props.form?.fields?.value?.filter((f) => !toValue(f.hidden))?.length` 改为 `filter((f) => isObjectItem(f) && !toValue(f.hidden))?.length`（其中 `toValue(f.hidden)` 解包由 `cc83f0b` 先行引入）。
- **解决的问题**：`fields`（含 `searchFields`）混入 `null`/`undefined`/原始值时，渲染期在 `f.hidden` 处抛 `TypeError`，非对象项送入 `WeakMap` 还会抛 `Invalid value used as weak map key`（CR-073，范围扩展）。
- **影响**：公开 API 新增 1 个工具函数（已进包根导出面并纳入 `SX-02` 清单）；运行时行为（非法项被忽略而非崩溃）；`hidden` 支持 `Ref`/getter（`toValue` 解包，与四包列/字段侧口径一致）；文档：`isObjectItem` 带完整 `@description/@param/@returns`；测试新增 `SU-04` 同文件外由四包 `BI-A15/A15b`、`PT-A16/A18` 覆盖。
- **证据**：全仓 grep：`isObjectItem` 被四包 `shared/core` 再导出并在 `BaseFormItem`/`ProTable`/`ColumnControl`/`useSearchFormExpand` 共 12 处收口使用；core 侧唯一 `fields.value` 读取点即 `useSearchFormExpand.ts:370`（已核对无遗漏守卫点：`grep -n fields useSearchFormExpand.ts` 仅此一处）；提交 `5a8a20d` + `cc83f0b`。
- **复核结论**：✅ 无误。谓词语义（非 null 对象，含数组/Date）与其 JSDoc 一致；`isObjectItem` 同时被 `element-plus-pro` 等包的 `shared/core` 集中再导出，符合「统一导入契约」（AGENTS.md §1.3）。

### 13. `toPath` 非字符串入参按 lodash 分档 + 解析缓存冻结

- **位置**：`packages/core/src/shared/path.ts:243-249`（`toPath(path: unknown)`）、`:104-114`（`cachedParse` 写入前 `Object.freeze`）、JSDoc `:233-242`；模块级分歧清单 `:9-16`
- **修改点**：`toPath(path: string)` → `toPath(path: unknown)`：数组 → `path.map(String)`；`number`/`boolean` → `[String(path)]`；其余非字符串 → `[]`；字符串分支行为不变（`cachedParse`）。`s = parsePath(p)` → `s = Object.freeze(parsePath(p)) as string[]`。
- **解决的问题**：`toPath(123)`/`toPath(true)`/`toPath({})` 抛 `p.indexOf is not a function`，`toPath(['a','b'])` 抛 `p.split is not a function`；且返回的是 `pathCache` 内同一未冻结数组，写方就地修改即污染全局解析缓存（CR-011）。
- **影响**：运行时行为（非字符串入参由抛错变为确定性结果）；公开签名放宽为 `unknown`（**类型面放宽，非 breaking**）；有意分歧显式锁定（对象/symbol → `[]`；小数 → `['1.5']`），与 `normalizePathKey` 建立不变量；性能：新增三条前置分支，字符串路径零变化；文档：`toPath` JSDoc 已补边界；测试新增 5 条（对拍、口径一致、分歧 4/5、冻结）。Changeset `.changeset/fix-topath-non-string-and-cache.md`（patch，含「破坏性变更：无」说明）。
- **证据**：`path.spec.ts:160`（lodash 对拍）、`:179`（`join` 恒等矩阵）、`:202`（分歧 4）、`:216`（分歧 5）、`:224`（冻结 + 缓存共享 + 就地修改抛错）；只读前提实测：全仓 `toPath` 调用点仅 `antd`/`antdv-next` `BaseFormItem/index.vue:176` 的 `:name="toPath(item.path)"`（纯读）与 `get`/`set` 内部的 `cachedParse`（只读）；提交 `300f80b`、`0f61b82`。
- **复核结论**：⚠️ 建议改进（两处文档/不变量口径）：
  1. `path.ts:241` 的「返回值为模块级缓存中的同一数组实例且已冻结」只对**字符串**分支成立：`Array.isArray(path)`（`:244`）、`number`/`boolean`（`:245-246`）、`''`（`:248`）三条分支返回的是新建的**未冻结**数组（`toPath('')` 每次调用都是新实例）。Changeset 里「返回值仍为缓存中的同一实例（保持零分配），已冻结」同问题。
  2. `path.ts:240` 声明的不变量 `toPath(v).join('.') === normalizePathKey(v)` 在**数组含 `null`/`undefined`** 时不成立：`toPath` 用 `map(String)` 得 `['a','null']` → `'a.null'`，而 `normalizePathKey` 用 `join('.')` 得 `'a.'`（本机 Node 实测：`['a',null] => "a.null" vs "a."`；`[null] => "null" vs ""`）。`:179` 的 12 项矩阵未覆盖该形态。
     建议：JSDoc/Changeset 改为分档陈述（「字符串路径返回缓存中的同一冻结实例；其余入参返回新建数组」），并把不变量限定为「数组元素均为 string/number 时成立」，或把数组分支改为 `path.map(v => (v === null || v === undefined ? '' : String(v)))` 后补一条矩阵用例。

### 14. 移除遗留调试日志 `console.log('[DBG] updateHeights')`

- **位置**：`packages/core/src/table/useSearchFormExpand.ts:215-216`（`updateHeights` 内，日志已删）
- **修改点**：删除 `cc83f0b` 带入并入库的 `console.log('[DBG] updateHeights')`（该日志污染全部表单相关测试输出）。
- **解决的问题**：调试残留（AGENTS.md §2.2 严禁残留调试注释/日志）。
- **影响**：运行时行为（仅去掉输出）；API/类型/性能无影响；文档无变化；无新增测试（无需）。提交明确说明**无 Changeset**（调试日志移除，无 API/行为契约变化）——复核认为可接受。
- **证据**：`grep -rn "DBG\|console\.log" packages/core/src` 仅剩 `form/useFormRef.ts:32` 的 JSDoc 示例（非调试残留）；提交 `1ada73a`（该提交同时修正了三包列 `hidden` 契约文案，core 侧仅此 1 行删除，与 `git show --stat` 的 `1 deletion` 一致）。
- **复核结论**：✅ 无误。

### 15. 类型导入统一为 `import type`（core 8 个文件）

- **位置**：`form/constants.ts:1`、`form/types.ts:1`、`form/useFields.ts:1-12`、`form/useForm.ts:21-23`、`form/useFormData.ts:2`、`form/useFormRef.ts:1-2`、`table/types.ts:1`、`table/useTable.ts:18-31`
- **修改点**：纯类型符号改为 `import type`（含 `useFormRef` 的 `import('vue').Ref` 内联注解改为顶层 `import type { Ref }`）；配套在 `eslint.config.mjs` 开启 `@typescript-eslint/consistent-type-imports`（error, separate-type-imports）。
- **解决的问题**：CR-089，纯类型层无运行时影响；经逐行核验 core 侧仅 import 变化。
- **影响**：无运行时影响（`vue-tsc --noEmit` exit 0、core 207 用例全绿佐证）；类型契约不变（`formRef: Ref<F | undefined>` 语义等价）；产物层面减少无害的运行时导入；文档无变化；无新增用例（`0f61b82` 说明为「纯类型层」）。Changeset `.changeset/fix-antd-slot-component-and-search-form.md`。
- **证据**：`packages/core/src/form/useFormRef.ts:1-2` 与 `:8`（`formRef: Ref<F | undefined>`）；提交 `0f61b82`。
- **复核结论**：✅ 无误。已核对 core 内 8 文件的 import 均只有类型/值分离，无行为差异。

### 16. JSDoc / 契约文案同步（嵌套字段完整点分路径、`@mutates` 边界、`toPath` 边界）

- **位置**：`form/types.ts:17-23`、`form/useFields.ts:208-215`、`:251-253`、`:272-285`、`table/useTable.ts:159`、`:277`
- **修改点**：`BaseField.fields` 示例 `{ path: 'city' }` → `{ path: 'address.city' }`；`getField`/`getParentField` 的嵌套字段示例与说明改为完整点分路径检索；`useFields(initFields)` 的 `@param` 补「内部持有其浅拷贝，增删不会修改传入数组」；`normalizeColumns` 的 `@mutates` 补「直接调用本工具时传入数组被就地变异；经 `useTable` 使用时传入的是其内部浅拷贝」。
- **解决的问题**：嵌套子字段以完整点分路径声明与检索（此前示例误导为相对路径），以及 #2 引入的浅拷贝边界需要文档化。
- **影响**：仅文档；无 API/运行时/类型影响；无新增用例（文档类，`1ada73a`/`8f55302`/`cc83f0b` 提交说明均如此）。
- **证据**：上述行号逐一读取确认；`grep -rn "path: 'city'" packages/core/src` 已无残留（示例全部为 `address.city`）；提交 `cc83f0b`、`8f55302`、`1ada73a`。
- **复核结论**：✅ 无误（但 `useTable.ts:160-161` 未纳入本轮同步，见 #2 的 ⚠️）。

### 17. 测试与构建配置基建（`restoreMocks`、API 双向一致、编号卫兵、去产物依赖、`vite.config` 注释更正）

- **位置**：`packages/core/vitest.config.ts:6`（`restoreMocks: true`）；`__tests__/index.spec.ts:4-35`（`declaredApis` 清单）、`:50`（`SX-02`）；`packages/core/vite.config.ts:26`（注释）
- **修改点**：
  - `restoreMocks: true`：每个用例后自动还原 `vi.spyOn` 替身（CR-023）。
  - `index.spec` 抽出 `declaredApis` 并新增 `SX-02`：`Object.keys(core).sort()` 与清单**双向**比对（新增/移除导出都会失败），并断言 `useSearchFormExpand` 为函数、`InjectionFormKey` 为 symbol（CR-025）。
  - `TT-17` 由「子进程 import `es/index.js` 构建产物 + 5s 超时」改为进程内断言终止性与插入结果（去产物依赖，`cc83f0b`）。
  - `FF-40` 构型改为「BFS 与 DFS 结果不同」（`p1.c` vs `p2`），断言 `p2`（CR-022，原构型对两种实现都通过）；`regressions` 的 `appendColumn` 用例改为「补齐 key 唯一 + 不共享对象 + 按补齐 key 精确定位」；`DC-01` 改为「推入无 key 列 → 读时补 key → 按补齐 key 精确命中」。
  - `vite.config.ts` 注释由「lodash-es 不作为 external…」改为「仅 vue 作为 external，其余依赖打包进产物」。
- **解决的问题**：mock 跨用例泄漏；导出面无守卫（早期遗漏 `useSearchFormExpand`/`InjectionFormKey`）；用例依赖构建产物导致 `vitest run` 需先 build；恒真/零信息断言（失信用例）；失效注释。
- **影响**：测试基建与注释；无产品 API/运行时影响；用例声明数 168 → 188；core 用例运行数 207（含 `it.each` 展开）；`node scripts/check-test-ids.mjs` 通过。
- **证据**：`index.spec.ts:50` `SX-02`；`useTable.spec.ts:187` `TT-17`；`useFields.spec.ts:372` `FF-40`；`regressions.spec.ts:51`；`useTable.spec.ts:373` `DC-01`；`vitest.config.ts:6`；`vite.config.ts:26`；提交 `0ea21e0`、`0a47cfe`、`cc83f0b`、`e689378`、`1265b6e`（后者仅新增 `SE-11` 覆盖 IntersectionObserver 初值自动展开主路径，实现零改动，已在 `useSearchFormExpand.spec.ts:564` 读到）。
- **复核结论**：✅ 无误。`SX-02` 会随导出面变化而红，是有效的防漂移锁；`SE-11` 的 `vi.stubGlobal` 由文件内顶层 `afterEach(() => vi.unstubAllGlobals())`（`useSearchFormExpand.spec.ts:118-120`）兜底，无跨用例泄漏。

---

## 遗留与建议

1. ⚠️ **`useTable.ts:160-161` 的 `dataSource`/`pageParam` JSDoc 与实现矛盾**（本次最强的一条）：仍写「直接包裹（复用）传入的数组/对象引用…变更会穿透到调用方原对象」，而 `:365`/`:367` 已改为浅拷贝。建议按 `:159` 的口径改写，并在 `.changeset/fix-core-array-ref-sharing.md` 中点明这两个参数的数组/对象层解耦。
2. ⚠️ **`useTable.ts:328` 注释「不重建 children 数组」不精确**（缺失 key 的列经 `normalizeColumn` 会 `map` 重建 `children`，`useTable.ts:263-267`）。建议限定为「已具备 key 的列不重建其 children 数组」。
3. ⚠️ **`toPath` 文档/不变量口径两处不准**（`path.ts:240-241` + Changeset）：(a)「缓存同一实例且已冻结」仅字符串分支成立；(b) `toPath(v).join('.') === normalizePathKey(v)` 在数组含 `null`/`undefined` 时不成立（实测 `['a',null]` → `'a.null'` vs `'a.'`）。建议分档陈述或统一 `String` 归一化后补矩阵用例。
4. ⚠️ **append/prepend 路径残留 falsy 守卫**：`useFields.ts:608`、`useTable.ts:598` 的 `if (path)` 使 `0` 被当作未传路径（与 `FF-43`/`TT-29` 锁定的「0 是合法 key」不自洽），且无用例覆盖；改判时需同时定边界 `''` 的语义。
5. ⚠️ **`resolveFieldIdentity` 的「非空值」措辞与 nullish 实现不等价**（`useFields.ts:22/25/31/35`）：`{ name: '', path: 'a' }` 返回 `''` 不回退。建议措辞对齐实现并补一条断言。
6. ⚠️ **`AGENTS.md` §3.4 与代码口径不一致（既有偏差，非本批引入）**：文档写「`set` 遇到相同值（`Object.is`）时跳过写入」，代码用 SameValueZero（`path.ts:124-125`、`:207-216`），二者仅在 `±0` 上分叉（`Object.is(0,-0) === false`，SameValueZero 视为相等），且用例 `path.spec.ts:254` 名为 `SameValueZero 同值跳过不触发响应式变更`（基线 `734e3c0` 第 123 行即已如此，本次未改动）。建议二选一：把 AGENTS.md 措辞改为 SameValueZero（并注明对齐 lodash `assignValue`），或改代码为 `Object.is` 并补 `-0` 用例。
7. ⚠️ **`isDangerousKey` 的导出面与文档规格**：`path.ts:121` 已 `export`，但包根 `src/index.ts:6` 是白名单导出（`get, set, normalizePathKey, toPath`），故它只存在于深层导入面，无独立用例、JSDoc 也缺 `@param/@returns`（AGENTS.md §2.2 对函数的要求）。建议明确归属：要么补进包根导出面并更新 `SX-02` 清单 + 补 `@param/@returns`，要么标注 `@internal`（当前仅 `useFormData` 在包内使用）。
8. ⚠️ **浅拷贝对非数组入参由「静默兜底」变为「抛错」（低危）**：`useTable.ts:321/358/365` 的 `[...initColumns]` / `[...next]` / `[...initDataSource]` 在入参为 `Ref`/`ComputedRef`/`undefined` 之外的不可迭代值时会抛 `TypeError`；旧实现 `normalizeColumns` 对非数组返回 `[]`、`ref(非数组)` 不抛。类型面（`T[]` / `Columns<T,C>`）已拦住正常用法，仅 `as any` 或 JS 调用方可达，故列为低危；若在意兜底，可改为 `Array.isArray(x) ? [...x] : []`。
9. **提示（非缺陷）**：`columns.value` 的 getter 每次读取都做一次 O(n) 的 `ensureColumnKeys` 遍历（`useTable.ts:352-356`）；列数很大且高频读取（渲染 + 多次 API 调用）时是额外开销，可考虑用「是否需要检查」的脏标记收敛，当前实现正确性优先、可接受。
10. **提示（非缺陷）**：本批 3 个提交无 Changeset —— `1ada73a`（调试日志移除 + 文档修正，提交已说明理由）、`0a47cfe` / `1265b6e` / `e689378`（仅测试）。与 AGENTS.md §4.4「变更记录必须由 Changeset 驱动」的边界相符（无 API/行为契约变化），但建议在发版说明中确认这些提交的编号条目已被现有 Changeset 覆盖。
11. **跨包漂移复核（防漂移纪律 §4.1）**：core 本次 4 处「有跨包含义」的改动均已对齐 —— ①`isObjectItem`/`resolveFieldIdentity`/`DEFAULT_FIELD_IDENTITY_KEYS` 四包 `shared/core` 全部再导出并使用；②`fieldIdentityKeys` 仅 element-plus 需要显式传 `['prop','path']`（已传），其余三包默认 `['name','path']` 与宿主一致（已逐一核对四个 `useForm`/`useFields` 包装层）；③`columnGap` 从 core props 移除后，四包 `SearchForm.vue` 各自的 `columnGap` props 与其栅格用途未受影响；④`useFields`/`useTable` 浅拷贝对四包无破坏（`pnpm -r test` 705 用例全绿）。

---

## 门禁实测

```
$ cd packages/core && npx vitest run            # exit 0
 RUN  v4.1.11 /Users/dufan/Desktop/Code/My_project/pro-components/packages/core
 ✓ __tests__/locale.spec.ts (6 tests) 4ms          ✓ __tests__/useFields.spec.ts (50 tests) 12ms
 ✓ __tests__/regressions.spec.ts (4 tests) 11ms    ✓ __tests__/useFormData.spec.ts (25 tests) 17ms
 ✓ __tests__/path.spec.ts (18 tests) 35ms          ✓ __tests__/useTable.spec.ts (33 tests) 19ms
 ✓ __tests__/useSearchFormExpand.spec.ts (12 tests) 41ms   ✓ __tests__/useForm.spec.ts (16 tests) 28ms
 ✓ __tests__/utils.spec.ts (39 tests) 11ms         ✓ __tests__/useFormRef.spec.ts (2 tests) 3ms
 ✓ __tests__/index.spec.ts (2 tests) 3ms
 Test Files  11 passed (11)
      Tests  207 passed (207)
   Duration  1.42s

$ cd <repo> && pnpm --filter "./packages/*" exec vue-tsc --noEmit   # exit 0
(无任何输出 → 0 错误)

$ pnpm -r test        # exit 0（附加实测）
 core: Tests 207 passed (11 files) | vant-pro: 90 passed (15 files)
 antd-vue-pro: 133 passed (13 files) | element-plus-pro: 142 passed (14 files)
 antdv-next-pro: 133 passed (13 files) | examples: No test files found, exiting with code 0

$ node scripts/check-test-ids.mjs
 [check-test-ids] 用例编号在同一包内唯一 ✓
```

- 差异规模核验：`git diff 734e3c0 --stat -- packages/core` → `23 files changed, 855 insertions(+), 162 deletions(-)`；`git status --porcelain -- packages/core` → 空（无未提交改动）。
- 核查过程中**未执行**任何写操作或 `git add/commit/checkout/restore/stash/mv`；只读命令为 `git log/show/diff/status/grep` 与测试命令。
- 待确认项：基线（734e3c0）用例的**运行时**条数未复测（避免改动工作区），故概览中基线数字为静态 `it/test` 声明数 168；本批提交说明中记载的基线运行时值（core 190 → 192 → 206 → 207）未逐一独立复现。
