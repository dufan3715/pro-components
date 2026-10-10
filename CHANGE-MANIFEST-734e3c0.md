# 变更清单：`734e3c0` → 当前（评审修复全集）

> **用途**：供人工复核与发版比对。基线为 `734e3c0`（`chore(release): @qin-ui/pro-components-core 2.0.6`，2026-09-09）。
> **读者**：项目 owner。**编写方式**：逐行精读 `packages/` 当前代码 + 与基线逐文件比对（含未提交改动）。

## 一、如何用它做比对（推荐流程）

```bash
git switch -c review/734e3c0-diff          # 新分支
git reset --soft 734e3c08e778dacc57129da937f13fa1a7e76797   # 工作区不变，HEAD 回到基线
# 之后所有改动都以「未提交」形态出现，可逐块比对：
git diff --stat                            # 总量
git diff -- packages/core                  # 逐包看
git diff -- packages/antd-vue-pro
git status --short                         # 新增文件（未跟踪）
```

- 若只想看**某个包的改动**：`git diff 734e3c0 -- packages/<包名>`
- 若只想看**某个 CR 对应的改动**：查 §五「CR → 提交索引」拿到提交号，再 `git show <提交号>`
- 恢复：`git reset --hard 734e3c0 && git switch -`（⚠️ 会丢弃工作区改动，确认后再执行）

## 二、总量

| 指标                              | 数值                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| 提交数                            | 43                                                                                               |
| 文件变更                          | 249 files changed, +12385 / −1922                                                                |
| 单测用例                          | 527 → **705**（core 207 / vant 90 / antd 133 / element 142 / antdv-next 133）                    |
| Changeset                         | 32 份（`.changeset/*.md`）                                                                       |
| 版本（待发版时由 changeset 提升） | core 2.0.6 / antd-vue-pro 2.4.5 / antdv-next-pro 1.4.5 / element-plus-pro 1.3.5 / vant-pro 1.3.4 |

各包改动量：

| 包                          | 改动量                 |
| --------------------------- | ---------------------- |
| `packages/core`             | 23 files, +855 / −162  |
| `packages/antd-vue-pro`     | 42 files, +2340 / −357 |
| `packages/antdv-next-pro`   | 44 files, +2897 / −457 |
| `packages/element-plus-pro` | 48 files, +2877 / −622 |
| `packages/vant-pro`         | 32 files, +1550 / −199 |

## 三、提交总表（按时间顺序）

| #   | 提交      | 类型 | 主题                                                                 | 主要范围         |
| --- | --------- | ---- | -------------------------------------------------------------------- | ---------------- | ---- |
| 1   | `58a03cf` | 特性 | ��加路由配置和测试脚本                                               | examples         |
| 2   | `cc83f0b` | 修复 | ��复代码评审 Top-10 优先项                                           | 全域             |
| 3   | `41daa4d` | 修复 | ��复分组列 children 永不渲染                                         | element-plus-pro |
| 4   | `0ad097a` | 修复 | ��复字段控件 id/label 关联失效                                       | antd-vue-pro     |
| 5   | `5e02ba7` | 修复 | ��复 Provider 注入的表格尺寸被清空                                   | antdv-next-pro   |
| 6   | `3bb3303` | 修复 | ��复字段 componentClass/componentStyle 与 fieldClass/fieldStyle 落点 | vant-pro         |
| 7   | `bd888e9` | 修复 | ��一字段标识契约并修复 ProLocale 类型                                | element-plus-pro |
| 8   | `029d10b` | 修复 | ��复 cloneDeep 对响应式数据静默降级 JSON                             | core             | 多包 |
| 9   | `c20e669` | 修复 | �� key 规范化覆盖元素级变异（columns 改 customRef）                  | core             | 多包 |
| 10  | `a0cd0b8` | 修复 | ��复 pnpm -r test 门禁必失败                                         | examples         |
| 11  | `5a8a20d` | 修复 | ��段配置含 null/原始值项不再崩溃（统一 isObjectItem）                | 四包同构         |
| 12  | `bc0dd02` | 修复 | ��配置含 null/原始值项不再崩溃（渲染侧统一 isObjectItem）            | 四包同构         |
| 13  | `bdbd58d` | 修复 | ata-_/aria-_ 属性名不再被驼峰化破坏                                  | 四包同构         |
| 14  | `e140615` | 修复 | ��指定 disabled 时继承宿主禁用上下文                                 | antdv-next-pro   |
| 15  | `938fcb7` | 测试 | ��复 RO/IO mock 的 disconnect 身份不匹配                             | 全域             |
| 16  | `1265b6e` | 测试 | ��搜索表单初值自动展开主路径覆盖                                     | core             | 多包 |
| 17  | `300f80b` | 修复 | oPath 非字符串入参按 lodash 对标分档，缓存数组冻结                   | core             | 多包 |
| 18  | `a9b4f13` | 测试 | ��试期经源码消费 core，消除对 es 构建产物的隐性依赖                  | core             | 多包 |
| 19  | `f87d529` | 修复 | ��传 locale 的 ElConfigProvider 不再改变语言判定                     | element-plus-pro |
| 20  | `083c6b7` | 修复 | efault 插槽保留给列渲染器，避免整表无列                              | element-plus-pro |
| 21  | `3a99eb0` | 修复 | ��段实例访问器纳入公开类型面（复用 core AdditionalMethods）          | 四包同构         |
| 22  | `dc29ccc` | 修复 | ��段渲染 key 改用对象身份，消除同 path key 冲突                      | 四包同构         |
| 23  | `84e2eaf` | 修复 | alsy key 守卫、代理 delete 与注入类型                                | core             | 多包 |
| 24  | `077f293` | 修复 | ��齐适配层导出面、收敛状态契约与组件 JSDoc 绑定                      | 四包同构         |
| 25  | `0ea21e0` | 测试 | ��号卫兵、mock 隔离、flush 提速与 CI 校验模式                        | 全域             |
| 26  | `d905ed2` | 文档 | �� fieldKey 模块的设计意图说明                                       | 四包同构         |
| 27  | `ece7c16` | 测试 | ��步编号卫兵修复（element PT-09 / vant VP-V15、VP-V16、M11）         | vant-pro         |
| 28  | `0a47cfe` | 测试 | ��复 CR-022 失信断言（恒真/零信息/死代码）                           | 全域             |
| 29  | `f299454` | 测试 | ��齐 CR-031 适配层覆盖缺口（23 条判别性用例）                        | 全域             |
| 30  | `1ada73a` | 修复 | ��除遗留调试日志并修正列 hidden 契约文案                             | 四包同构         |
| 31  | `c7f85e7` | 修复 | ��组列的子列 hidden 递归生效（三包同构）                             | 四包同构         |
| 32  | `a5a1542` | 文档 | ��步分组子列 hidden 递归生效，补全 hidden 契约描述                   | 全域             |
| 33  | `32c5ea8` | 测试 | ��齐 CR-031 残留覆盖（antd/antdv-next 容器与控制形态）               | antdv-next-pro   |
| 34  | `46d2fef` | 修复 | ��层取值语义统一、回调派发与弹层状态管理                             | vant-pro         |
| 35  | `088cb2c` | 修复 | ��号偏移、emit attrs 入口、告警去重与类型文档对齐                    | antdv-next-pro   |
| 36  | `0f61b82` | 修复 | ��槽组件对象渲染、SearchForm form 契约与类型导入收敛                 | antd-vue-pro     |
| 37  | `2429b61` | 修复 | ��用宿主导出、四包对齐与插槽作用域                                   | 四包同构         |
| 38  | `c4b47db` | 修复 | ��格单一来源、container 泄漏与告警去重                               | element-plus-pro |
| 39  | `e689378` | 测试 | ��试质量组 CR-033～CR-050（三包 + core）                             | core             | 多包 |
| 40  | `ad60833` | 测试 | ��号卫兵覆盖 it.each 表内编号并收紧裸字面量                          | 全域             |
| 41  | `8f55302` | 修复 | ��再就地变异调用方数组（CR-016，@mutates 契约收敛）                  | core             | 多包 |
| 42  | `74030da` | 重构 | ��格属性面命名收敛为 TableProps 并复用宿主 TableEmits                | 四包同构         |
| 43  | `e73293a` | 文档 | ��充 AI 编码协作上下文、Provider 配置文档与配套守卫用例              | 全域             |

> 说明：类型按提交主题前缀归类；「主要范围」按主题关键词近似归属，精确到文件与行的说明见 §四逐包清单。

## 四、逐包修改清单

本节由五份包级复核报告组成（每份均为「逐行读代码 + 与基线比对」的产物），条目格式统一为：
**位置 / 修改点 / 解决的问题 / 影响（公开 API、运行时行为、类型契约、性能、文档、测试）/ 证据（测试编号 + 提交号）/ 复核结论**。

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

---

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

---

# packages/antdv-next-pro 修改清单（734e3c0 → 当前）

> 复核基线：`734e3c0` → `e73293a`（复核期间 HEAD 由 `74030da` 前进至 `e73293a`，为并行工作流收口 docs/ai 与 `__tests__/ai-context.spec.ts`，本包 `src/` 未再变动）。
> 复核方式：逐条读当前源码上下文 + `git show <commit>` 看当时意图 + 跑门禁与静态探针（宿主类型/运行时 emits、SFC 编译产物）。本次复核未修改仓库任何文件（构建产物 `api.json` / `bin/init-ai.mjs` / `es/` 均被 `.gitignore` 忽略，已用 `git check-ignore -v` 确认）。

## 概览

- **提交数**：25（`git log --oneline 734e3c0..HEAD -- packages/antdv-next-pro | wc -l`）
- **文件数**：44（`+2897 / −457`）；其中 `src/` 24、`__tests__/` 15、文档与工程配置 5（`AI-CONTEXT.md` / `README.md` / `package.json` / `tsconfig.json` / `vitest.config.ts`）
- **用例数**：**83 → 133**（spec 文件 10 → 13）。改前数按基线版本 10 个 spec 文件内 `it(`/`test(` 声明计数求和（11+9+11+17+8+10+7+4+1+5=83）；改后同法计数 133，与 `vitest run` 实测 `Tests 133 passed (133)` 完全吻合（本包无 `it.each`，计数方法可判定）
- **门禁结果**：`npx vitest run` 13 文件 / 133 用例全绿（exit 0）；`npx vue-tsc --noEmit` 0 错误（exit 0）；`pnpm --filter "@qin-ui/antdv-next-pro" build` 成功（exit 0）。附加实测：`prettier --check` 通过、`check-test-ids.mjs` 通过、eslint 0 error / 349 warning（非门禁项，明细见末节）
- **结论分布**：修改点 27 条 → ✅ 22 条、⚠️ 5 条（第 2、11、15、17、25 条）、❌ 0 条

## 修改点

### 1. 本包 `TableProps` 收敛为「宿主 `_TableProps` + 宿主 `TableEmits` 推导」，宿主原始 `TableProps` 不再再导出

- **位置**：`src/shared/ui/index.ts:2`、`:4-42`（再导出清单）、`:103-111`（类型定义）
- **修改点**：改动前（基线 `734e3c0`）→ `export { …, type TableProps, … } from 'antdv-next'`（宿主原始类型直接对外）+ 另行定义 `TableComponentProps = ComponentProps<typeof Table>`（补齐 emit 成员）。中间态（`088cb2c`/`2429b61`）→ 手写 `TableEmitProps`（`onChange` / `onScroll` / `onUpdate:expandedRowKeys` 三键，签名经 `ComponentProps<typeof Table>[...]` 索引取得）+ `TableComponentProps = TableProps & TableEmitProps`。改动后（`74030da`）→ 宿主导入改名 `_TableProps`（仅内部推导用），本包 `export type TableProps = _TableProps & { [K in keyof TableEmits as \`on${Capitalize<string & K>}\`]?: TableEmits[K] }`；`TableEmitProps`/`TableComponentProps`与宿主原始`TableProps` 的再导出全部消失
- **解决的问题**：两组同义类型名（宿主 `TableProps` 不含 emit 成员 vs `TableComponentProps` 含）造成使用与文档歧义；手写 emit 键名会与宿主演进脱钩。CR 关联：`74030da`（使用者复核答疑两项调整）；承接 `2429b61`「复用优先」与 `088cb2c` CR-077④
- **影响**：类型契约（`shared/ui` 是包内内部模块，未从 `src/index.ts` 导出 → 公开 API 面不变，`74030da` 明确判定「无需 Changeset」）。非 breaking
- **证据**：宿主根导出 `TableEmits`（实测 `antdv-next/dist/index.d.ts:171` 含 `type TableEmits`）；本包公式与宿主自身 `TableEmitsProps` 逐字同式（`dist/table/Table.d.ts:9`）；emit 入口行为由 `PT-A25`（`__tests__/ProTable.spec.ts:1218`）锁定；提交 `74030da`
- **复核结论**：✅ 无误。宿主 `TableEmits`/`_TableProps` 均可从根导出取得；`component-provider/types` 与 `ProTable.vue` 两处消费点同步改完，`vue-tsc` 0 错误

### 2. `tableProps()` 改为全量由宿主推导；快照缺失时返回 `{}` + 一次性告警；事件键并入白名单

- **位置**：`src/shared/ui/index.ts:60-73`（`TABLE_EMIT_PROP_KEYS`）、`:75-101`（`tableProps`）
- **修改点**：改动前（基线 `734e3c0`）→ `const _tableProps = (Table as any).props || {}; export const tableProps = () => _tableProps;`，只含宿主静态 props，**不含任何 emit 键**，快照为空时静默返回 `{}`。中间态 `088cb2c` → 新增 `TABLE_EMIT_PROP_KEYS`（由 `Table.emits` 推导，仍留 3 键手写兜底）并补 52 键 `FALLBACK_TABLE_PROP_KEYS` + 3 键门槛 `REQUIRED_TABLE_PROP_KEYS`，快照不可用时告警「透传已回退到内置清单」并返回 snapshot+内置清单。中间态 `2429b61` → 删除 52 键内置清单与键门槛，快照为空改为「告警一次 + 返回 `{}`」，由消费侧全量透传。改动后（`74030da`，当前）→ 键名只来自宿主（`Table.props` 取静态键，`Table.emits` 推导 `on${Capitalize}` 事件键），空快照告警文案改为「不做键名限定，全量透传给宿主表格」（`:94-99`，模块级 `warnedTablePropsFallback` 去重）
- **解决的问题**：手写兜底清单会与宿主脱钩且掩盖宿主结构变化；空快照静默返回会让透传白名单静默失效（无任何信号）。CR 关联：`2429b61`「复用优先原则」/ `088cb2c` CR-080（告警）、CR-079（死通道）
- **影响**：运行时行为 + 开发期告警；透传键集合由 52（静态）扩为 55（+3 事件键）。无公开 API 变更；无需 Changeset
- **证据**：`PT-A26`（`__tests__/ProTable.spec.ts:1262`）三段断言——快照可用→按宿主键名过滤且零告警、快照缺失→全量透传且仅告警一次、非空快照→仅补 emits 键（`:1323-1329`）；`PT-A25` 锁事件键入口；提交 `2429b61`、`088cb2c`
- **复核结论**：✅ 无误。本机探针实测宿主 `Table.props` 52 键（含 `dataSource`/`columns`/`pagination`，**不含** `class`/`style`/`onSearch`/`on*`），`Table.emits = ['change','update:expandedRowKeys','scroll']`（`dist/table/Table.js:249-253`），故 `tableProperties` = 55 键；`pick` 以 `key in object` 判定（`packages/core/src/shared/utils/index.ts:78-87`），值 `undefined` 的事件键仅作**键名白名单**，不会向宿主写入 `undefined`
- **附注（⚠️ 提示，非缺陷）**：`:72` 仍留有一份手写兜底清单 `['onChange','onScroll','onUpdate:expandedRowKeys']`，仅在宿主不暴露 `emits` 时生效。当前宿主版本 `emits` 已定义且推导结果与该清单逐字相同 → 该分支**当前不可达**（类型层契约「不手写 emit 键名」未被违反；若要求零手写，可改为 `names.length === 0` 时按 `TableProps` 事件通道显式降级并同步告警）

### 3. `shared/ui` 的 `useConfig` 更名 `useHostConfig`

- **位置**：`src/shared/ui/index.ts:46-52`；消费点 `src/components/table/components/SizeControl.vue:2-23`
- **修改点**：改动前 → `export { useConfig, … } from 'antdv-next'`（与 `src/locale/index.ts:24` 从 `antdv-next/dist/config-provider/context` 深导入的 `useConfig as useConfigContext` 同名）；改动后 → `export { useConfig as useHostConfig } from 'antdv-next'`，JSDoc 以行为陈述标注「读取宿主 `componentDisabled`/`componentSize`，与 locale 模块的读取函数语义不同」，SizeControl 同步改名（`hostConfig.componentSize?.value`）
- **解决的问题**：同名不同义两个宿主配置读取函数在包内共存，易误用。CR 关联：`088cb2c` CR-075
- **影响**：包内内部标识更名（`shared/ui` 非公开面）；无运行时行为变化。非 breaking
- **证据**：`HK-04`（`__tests__/hooks-locale.spec.ts:20`）——`typeof ui.useHostConfig === 'function'`、`ui.useConfig === undefined`，并以宿主 `ConfigProvider componentSize="small"` 实测读取为 `'small'`（`:26-45`）；提交 `088cb2c`
- **复核结论**：✅ 无误。全包 `useConfig` 仅剩 locale 深导入一处（`grep -rn "useConfig" src/`），歧义消除

### 4. ProTable 序号列按「有效分页」偏移

- **位置**：`src/components/table/components/ProTable.vue:304-321`（`getIndex`），依赖 `:379-405`（`computedPagination`）
- **修改点**：`const current = pageParam.current ?? 1; const pageSize = pageParam.pageSize ?? 10;` → `const pagination = computedPagination.value; const current = pagination.current ?? pageParam.current ?? 1; const pageSize = pagination.pageSize ?? pageParam.pageSize ?? 10;`
- **解决的问题**：页面上真正生效的分页可能来自 `tableAttrs.pagination`（如 `:pagination="{ current: 2, pageSize: 5 }"`）或 Provider 注入；旧实现只读 `table.pageParam`，序号与宿主实际分页不一致。CR 关联：`c7f85e7`/`2429b61` 的 CR-077①（`PT-A23`）
- **影响**：运行时行为（序号列文本），仅在 `attrs/provider` 分页与 `pageParam` 不一致时可见；非 breaking
- **证据**：`PT-A23`（`__tests__/ProTable.spec.ts:1121`，attrs `current:2/pageSize:5` → 首行序号 `6`，`:1142`）；`cross-package.spec.ts:33` 回归「setPageParam 后序号从 11 起」；提交 `c7f85e7`/`2429b61`
- **复核结论**：✅ 无误。取值链与 `computedPagination` 的三级优先（`tableAttrs > provider > pageParam 合成`）一致；`computedPagination` 定义在 `getIndex` 之后但在 render 期才被调用（`indexColumn.render`），无 TDZ 风险

### 5. ProTable 透传策略：白名单接入宿主 emits 键，宿主不可用时全量透传并排除组件自身消费键

- **位置**：`ProTable.vue:91`（`tableProperties`）、`:93-109`（`consumedAttrKeys` / `pickTableProps`）、`:150-152`、`:167-169`
- **修改点**：`pick(injectProps.value, tableProperties)` / `pick(camelizeProperties(attrs), tableProperties)` → 统一走 `pickTableProps()`：宿主键可用时仍按宿主键名筛选；宿主键为空时改用「除声明 props ∪ `['class','style','onSearch']` 外全部透传」。`onSearch` 由内部搜索流程消费，`class`/`style` 由根容器消费
- **解决的问题**：① 基线的透传白名单只有宿主静态 props，`@scroll`、`v-model:expanded-row-keys` 等 emit 型 attrs 被整体丢弃（入口缺失）；② 宿主快照缺失时白名单为空且无兜底，透传静默归零。CR 关联：`088cb2c` CR-077④、`2429b61`
- **影响**：运行时行为（attrs 透传面扩大）；无公开 API 变更；非 breaking
- **证据**：`PT-A25`（`ProTable.spec.ts:1218`）——宿主表格 `props('expandedRowKeys')` 为空数组、`$emit('update:expandedRowKeys')` 回写父级、`$emit('scroll')` 送达父级监听器（`:1246-1255`）；`PT-A26` ①（快照可用时 `data-probe` 被过滤）与 ②（快照缺失时 `data-probe` 出现在宿主 DOM）；提交 `088cb2c`、`2429b61`
- **复核结论**：✅ 无误。实测宿主静态 props 不含 `class`/`style`/`onSearch`，故常规路径下这三键本就被白名单排除，`consumedAttrKeys` 只在兜底分支承担职责——与 `:99-102` 注释「不可用时…除组件自身消费的键外全部透传」的表述一致

### 6. ProTable 修复「Provider 注入的表格 size 被模板绑定清空」，`loading` 退出 `componentVars` 契约

- **位置**：`ProTable.vue:271-294`（`isBoundProp` + `computedTableProps`）、`:171-172`（`size`/`loading` 模型）、`:528-536`（模板，已删 `:size="size"`）
- **修改点**：模板原为 `v-bind="computedTableProps"` 之后再绑 `:size="size"`（后写覆盖，未显式绑定时把注入值清成 `undefined`）；现 `size` 在 `computedTableProps` 内求解——`isBoundProp('size')`（读 `instance.vnode.props`，含 `onUpdate:` 写法）或本地模型已有值（SizeControl 写入）时用本地值，否则保留注入值；`loading` 写死 `undefined` 并由模板 `:loading="loading"` 接管
- **解决的问题**：`componentVars['pro-table'].size` 被静默清空（CR-071，P1）；`loading` 语义收敛为「仅由组件自身状态（含搜索竞态守卫）驱动」。CR 关联：`5e02ba7`
- **影响**：运行时行为 + 类型契约（`componentVars['pro-table']` 不再接受 `loading`）。**breaking（类型层）**：曾依赖 `componentVars['pro-table'].loading` 的项目会编译报错；`5e02ba7` 带 Changeset（`.changeset/fix-pro-table-provider-size.md`）
- **证据**：`PT-A14`（`ProTable.spec.ts:754`）——注入 `size:'small'` 生效（`:771`）、本地显式 `size:'large'` 优先（`:792`）、注入 `loading:true` 不生效（`:773`）、`// @ts-expect-error loading 已从 componentVars.pro-table 契约中移除`（`:798`）；`PT-A27`（`:1338`）v-model:size 回写；提交 `5e02ba7`
- **复核结论**：✅ 无误。本机用 `vue/compiler-sfc` 编译 `ProTable.vue` 复核合并顺序：`_createVNode($setup.ATable, _mergeProps({class}, computedTableProps, {loading, columns, 'data-source', pagination, onChange}))` —— 显式绑定在后，`loading`/`pagination`/`onChange` 三者确由模板接管；`computedTableProps` 内的三个 `undefined` 属防御性写法（若模板未来去掉显式绑定，可防止注入值回流），无功能影响

### 7. ProTable 分组子列 `hidden` 递归生效（含引用保持）

- **位置**：`ProTable.vue:340-369`（`filterVisibleColumns` / `visibleComputedColumns`）
- **修改点**：`computedColumns.value.filter(item => !item.hidden)`（仅顶层） → 递归函数：非对象列或被 `toValue(hidden)` 判定隐藏的列剔除；子列有变更时对该分组列生成浅拷贝 `{...column, children}`，未变动列保持原对象引用
- **解决的问题**：分组列的 `children` 中 `hidden: true`（含响应式 ref）仍被渲染。CR 关联：`c7f85e7`（CR-106，P2，三包同构）
- **影响**：运行时行为；无 API 变更；`c7f85e7` 带 Changeset（`.changeset/fix-grouped-column-hidden.md`）
- **证据**：`PT-A19`（`ProTable.spec.ts:856`）——表头/表体均不含被过滤子列、`hiddenRef.value = false` 后子列出现（`:902`）、未变动普通列 `toRaw(passed[0]) === plainColumn`（`:895`）、下发给宿主的列已剔除被过滤子列（`:899`）；提交 `c7f85e7`、文案同步 `a5a1542`
- **复核结论**：✅ 无误。注释「仅对被过滤过子列的列生成浅拷贝，未发生变动的列保持原对象引用（每次 columns 变化执行一次，不在渲染期递归）」与实现逐句对应；antd 同构包有同名实现，element 在 `TableColumnRenderer.vue:72,104` 等价过滤（三包行为对齐）

### 8. ProTable 搜索告警按原因分键去重，未配置 search 不再误报

- **位置**：`ProTable.vue:176-199`（`SEARCH_WARN_MESSAGES` / `warnedSearchReasons` / `_search`）
- **修改点**：单一 `warnedSearchConfig` 布尔标志（两类原因互相静音）+ 无条件调用 `search?.()` → 按 `'duplicate'` / `'not-promise'` 分键的 `Set` 去重；`const search = props.search || attrs.onSearch; if (!search) return;` 提前返回
- **解决的问题**：① 两类告警共用去重位，先出现的一类会永久静音另一类；② 未配置 `search` 时仍走 `isPromise(undefined)` 分支，误报「search 未返回 Promise」。CR 关联：`2429b61`/`088cb2c` CR-077③
- **影响**：开发期告警行为（消息分级、去重粒度、缺少误报）；无公开 API 变更
- **证据**：`PT-A24`（`ProTable.spec.ts:1149`）——同时配置 `:search` + `@search` 且返回同步值时两类告警各 1 条（`:1177`）、同因重复点击不重复告警（`:1190`）、未配置时不告警（`:1210` 断言恒为 2）；`PT-A10`/`PT-A10b`（`:280`/`:324`）；提交 `2429b61`
- **复核结论**：✅ 无误。去重集合在 `setup` 内声明（每实例独立），与「各原因独立去重」注释一致

### 9. ProTable 列/搜索字段的非对象项守卫（`isObjectItem`）

- **位置**：`ProTable.vue:344-353`（列过滤）、`:414-424`（`searchFormVisible`）；`src/components/table/components/ColumnControl.vue:3-4,35,59`
- **修改点**：`!toValue(item.hidden)` → `isObjectItem(x) && !toValue(x.hidden)`；ColumnControl 列清单入口 `props.columns.filter(isObjectItem).flatMap(...)`、勾选态改 `toValue(item.hidden)`
- **解决的问题**：`columns` / `searchFields` 混入 `null`、`undefined`、字符串等项时，渲染期在 `reading 'hidden'` 抛 `TypeError` 导致整表白屏。CR 关联：`5a8a20d`（CR-073）、`bc0dd02`（CR-105）、`2429b61`
- **影响**：运行时健壮性；`isObjectItem` 经本包 `shared/core` 再导出（符合 §1.3 统一导入契约）；两者均带 Changeset（`.changeset/fix-invalid-field-items.md` / `fix-invalid-column-items.md`）
- **证据**：`PT-A16`（`ProTable.spec.ts:806`，`searchFields: [null,'not-a-field',{…}]` → 仅 1 个输入框）、`PT-A17`（`:833`，`columns: [null,'not-a-column',{…}]` → 表头仅合法列）；`BI-A15`/`BI-A15b`/`BI-A18`（`BaseFormItem.spec.ts:359/384/474`）；提交 `5a8a20d`、`bc0dd02`
- **复核结论**：✅ 无误。注意 `normalizeColumn`/列本体未被侵入（原数组引用透传），与提交说明「不改 normalizeColumn 与 columns 本体」一致

### 10. ProTable `onTableChange` 由 `any` 收窄 + 公开 JSDoc/注释改为行为陈述

- **位置**：`ProTable.vue:2-48`（组件 JSDoc）、`:407-412`（`onTableChange: TableProps['onChange']`）
- **修改点**：`const onTableChange: any = (...args: any[]) => …` → `const onTableChange: TableProps['onChange'] = (...args) => …`；JSDoc 由「## 搜索流程（编号步骤 + 函数名）」改为「## 搜索行为」，并补齐 `@template` / `@param` / `@slot`（作用域参数与实际 `v-bind` 逐项一致）
- **解决的问题**：CR-090 注释规范（只写职责与行为边界，不写实现手段与动机）+ CR-077② 类型收窄。CR 关联：`2429b61`（CR-090）、`088cb2c`（CR-077②）
- **影响**：类型面（内部处理器签名）+ 文档；无运行时变化
- **证据**：`DOC-01`/`DOC-02`（`__tests__/comment-conventions.spec.ts:40/81`）静态锁定「禁用表述缺席 + 与 antd 包逐句一致」；JSDoc 与模板作用域实测一致（`:467-470` `form/search/reset`、`:516-525` `columns/dataSource/pagination/loading/size/onChange`）；提交 `2429b61`、`088cb2c`
- **复核结论**：✅ 无误。`comment-conventions.spec.ts:81-99` 逐行比对两包同句，防漂移手段可判定

### 11. SearchForm 查询按钮改「表单 submit 单一路径」

- **位置**：`src/components/table/components/SearchForm.vue:127-130`（注释 + `onSearch`）、`:133-139`（`@submit.prevent="onSearch"`）、`:163-170`（默认按钮保留 `html-type="submit"`、**删除 `@click`**）
- **修改点**：默认查询按钮同时挂 `@click="onSearch"` 与 `html-type="submit"`（叠加 ProForm 上的 submit 透传）→ 仅保留 `html-type="submit"`，由 `@submit.prevent="onSearch"` 统一收口
- **解决的问题**：真实浏览器中点击 submit 按钮会同时触发 `click` 与原生 `submit` → 一次点击两次查询；回车（隐式提交）此前无入口。CR 关联：`e689378` CR-050（三包同构）
- **影响**：运行时行为（查询触发次数/回车可用）；非 breaking；Changeset `.changeset/fix-search-form-enter-and-docs.md`
- **证据**：`SF-02`（`__tests__/SearchForm.spec.ts:237`，断言默认按钮 `type === 'submit'` 且点击后 `emitted('search')` 恰 1 次，`:252-256`）、`SF-05`（`:265`，回车 1 次 + 点击累计 2 次，明确「不存在 @click 与 @submit 双触发」）；提交 `e689378`
- **复核结论**：✅（默认路径）无误 / ⚠️（自定义路径）见下

  **⚠️ 建议改进（自定义查询按钮仍留双触发隐患）**：`:156-162` 的自定义 `searchButton` 分支与 `search-button` 插槽分支仍只挂 `@click="onSearch"`。若自定义组件渲染的是未声明 `type` 的原生 `<button>`（HTML 缺省即 submit 按钮），真实浏览器中会「click → onSearch」+「submit → onSearch」双发，与本次修复的缺陷同源。`SF-A10`（`:133`）与 `SF-03`（`:292`）在该场景下断言 `emitted('search')` 为 1，但因 happy-dom 对无 `type` 属性的按钮不做隐式提交而恒真 —— **属环境相关假绿**（三包同构，非本包独有）。建议二选一：① 文档/类型注释要求自定义查询按钮显式 `type="button"`；② 在该分支改为「不挂 `@click`、由组件内部自行触发表单 submit」或对 slot 内容加 `@click.prevent` 语义。真实浏览器行为**待确认**（需手工/Playwright 验证）

### 12. SearchForm `form` 恢复为必填 prop（删除 `default: undefined`）

- **位置**：`SearchForm.vue:23-24`（`form: Form`）、`:84-92`（`withDefaults` 中已无 `form: undefined`）
- **修改点**：`withDefaults(defineProps<SearchFormProps>(), { …, form: undefined })` → 删除该默认值，类型面 `form: Form`（必填）与运行时 props 选项一致
- **解决的问题**：运行时把必填 prop 声明成有默认值，与类型面不一致并触发 `vue/no-required-prop-with-default`；缺参时不再被静默兜底。CR 关联：`0f61b82` CR-087（纠正了此前「`withDefaults({form: undefined})` 会使消费端类型变可选」的错误假设）
- **影响**：类型契约 + 运行时校验（缺参时宿主输出 `Missing required prop` 告警）；**breaking（类型层）**：省略 `form` 的调用会被 vue-tsc 拒绝；`0f61b82` 带 Changeset
- **证据**：`SF-A16`（`SearchForm.spec.ts:347`）——`(SearchForm as any).props.form.required === true`、`'default' in formProp === false`、运行时命中 `expectWarn(spy, 'Missing required prop: "form"')`；`// @ts-expect-error form 为必填 prop，省略时不通过类型检查`（`:352`）；提交 `0f61b82`
- **复核结论**：✅ 无误。包内 34 处 `mount(SearchForm)` 均显式传 `form`（`grep` 复核），无实现依赖默认值；`vue-tsc` 通过证明该 `@ts-expect-error` 被消费（未被消费会报 TS2578）

### 13. `componentVars['pro-table']` 契约收敛（`Omit<TableProps,'loading'>`）+ `ComponentVars` 补 `@public` JSDoc

- **位置**：`src/components/component-provider/types/index.ts:28-39`、`:63-68`；默认值口径 `src/components/component-provider/constants/index.ts:20-35`
- **修改点**：`PP<TableComponentProps & Pick<ProTableProps, …>>` → `PP<Omit<TableProps, 'loading'> & Pick<ProTableProps, …>>`（emit 成员随修改点 1 自动获得）；`ComponentVars` 补「RequiredComponentVars 的 Partial 版本，用于 ProComponentProvider 的 props」JSDoc 与 `@public`
- **解决的问题**：`loading` 由组件自身状态驱动，不应出现在 Provider 配置面（CR-071）；`ComponentVars` 缺 JSDoc 导致 API 生成脚本产出条目无描述（CR-074）
- **影响**：类型契约（**breaking**，见修改点 6）；Provider 默认值 `control: true` / `addIndexColumn: true` 与 README/实现三方口径一致
- **证据**：编译期锁 `ProTable.spec.ts:798`；`PT-02c`（`:697`）锁定 `addIndexColumn` 缺省 true、显式 false 关闭、Provider 关闭+显式 true 反向覆盖；`PT-A14`（`:754`）注入 `size`/`loading` 的运行时对照；提交 `5e02ba7`、`088cb2c`
- **复核结论**：✅ 无误。`constants/index.ts:32-33` 的 `control: true` / `addIndexColumn: true` 与 `README.md`（`addIndexColumn` 默认 `true`、`search` 类型 `() => Promise<unknown>`）及 `ProTable.vue:125` 签名一致

### 14. 字段实例访问器纳入公开类型面（复用 core `AdditionalMethods<FormItemInstance>`）

- **位置**：`src/components/form/types/index.ts:20-22`（import type）、`:332-341`（`Field` 交叉 `AdditionalMethods<FormItemInstance>`）
- **修改点**：`Field` = 联合类型 → `(联合类型) & AdditionalMethods<FormItemInstance>`，运行期挂载的 `getFormItemRef` / `getFormItemComputedProps` / `getComponentRef` / `getComponentComputedProps` 进入公开类型
- **解决的问题**：TS 消费方读字段实例访问器必须 `as any`。CR 关联：`3a99eb0` CR-096（P2，实测四包同构缺口）
- **影响**：类型契约（纯增量，非 breaking）；Changeset `.changeset/fix-field-accessors-type-face.md`
- **证据**：`BI-A16`（`BaseFormItem.spec.ts:410`）——`const field: Field = …` 后直接访问并调用访问器，无断言（`:422-428`）；提交 `3a99eb0`
- **复核结论**：✅ 无误。复用 core 既有规范类型而非新造；`shared/core/index.ts:6` 以 `type AdditionalMethods` 再导出（`isolatedModules` 下带 `type` 修饰）

### 15. 字段渲染 key 改用对象身份（新增 `utils/fieldKey.ts` + `useGroupFieldAttrs.renderKey` 预计算）

- **位置**：`src/components/form/utils/fieldKey.ts:1-26`；`src/components/form/hooks/useGroupFieldAttrs.ts:2,23-32,111,123`；`src/components/form/components/BaseFormItem/index.vue:154,162`
- **修改点**：`getFieldKey` 从 BaseFormItem 抽为模块（`WeakMap<object, number>` + 自增种子，非对象项回退 `raw_${String(field)}`）；`GroupedField` 新增 `renderKey`，在既有 computed 内预计算；模板 `:key="item.path || getFieldKey(item.rawField)"` → `:key="item.renderKey"`
- **解决的问题**：同 `path` 兄弟字段 key 相同 → 列表更新时节点身份错位复用、重复 key 告警与幽灵节点（CR-054，P2）。**行为变更**：key 不再随 `path` 变化——修改字段 `path` 时复用实例并更新 props（不再强制重挂载、不重置控件内部状态），该语义已写进 `dc29ccc` 提交说明
- **影响**：运行时行为（列表复用语义）+ 性能（渲染期函数调用由 O(字段数) 降为 0）；Changeset `.changeset/fix-field-render-key-identity.md`
- **证据**：`BI-A17`（`BaseFormItem.spec.ts:436`，同 path 交换后 `after[0].element === elB`、`after[1].element === elA`）、`BI-A5`（`:149`，无 path 字段头部插入后实例不错位）、`BI-A4`（`:66`，卸载后访问器删除）；提交 `dc29ccc`、`d905ed2`
- **复核结论**：✅ 无误，但 ⚠️ 两点（注释/用例与覆盖不符，不构成行为缺陷）：
  1. `fieldKey.ts:17-18` 的「非对象项按字面量生成稳定 key」分支在**渲染路径不可达**：`BaseFormItem/index.vue:57-62` 的 `validFields` 已用 `isObjectItem` 预过滤，`useGroupFieldAttrs` 只会收到非 null 对象（全仓 `getFieldKey` 仅此两处调用，`grep -rn "getFieldKey" packages/*/src` 可证）。建议删除该死分支，或在字段类型上注明它仅供直接调用者使用
  2. `BI-A15b`（`BaseFormItem.spec.ts:384`）用例标题写「（key 走非对象回退）」，但断言只验证「原始值项被忽略、仅 1 个表单项」，并未覆盖回退 key；描述与断言不符，易误判覆盖率。建议改题为「原始值项被忽略」并另加一条直接调用 `getFieldKey('x')` 的单测（若保留该分支）

### 16. `useGroupFieldAttrs` 统一字段标识解析（`resolveFieldIdentity`）并改写栅格/容器注释

- **位置**：`useGroupFieldAttrs.ts:9,102,115`、`:61-73`、`:80-81`、`:94-100`
- **修改点**：`toValue(name) ?? toValue(path)` 手工解析（含 `join('.')`）→ `resolveFieldIdentity(field)`（core 单一真源，默认键序 `['name','path']`）；注释由「字段显式 span 优先，否则回退注入配置的响应式断点」改写为行为陈述「字段显式指定 span 时整体接管栅格，不再叠加注入的响应式断点；未指定 span 时使用注入的断点配置」；同时删除 `formItemProps[k] = slots[k]` 死赋值
- **解决的问题**：标识解析逻辑在 core 与四包各写一份，element 的 `prop` 键序差异导致 `getField` 静默 miss（CR-093 连带缺口）；注释自相矛盾（CR-088）；死通道（CR-079）
- **影响**：运行时行为（标识解析收敛，默认键序不变 → 本包行为等价）+ 可维护性
- **证据**：`cross-package.spec.ts:411`「宿主标识键优先于 path：name 覆盖 path，值绑定与字段查找共用同一标识」；`BI-07`（`BaseFormItem.spec.ts:322`）分组字段默认整行 span=24 且显式 span/offset 透传；`DOC-01` 锁定栅格边界注释同句（`comment-conventions.spec.ts:58-63` 断言「字段显式指定 span 时整体接管栅格，不再叠加注入的响应式断点」在场、旧自相矛盾表述缺席）；提交 `bd888e9`、`0f61b82`、`088cb2c`
- **复核结论**：✅ 无误。`GroupedField.path` 现为 `string`（`resolveFieldIdentity` 归一化后的点分路径），`BaseFormItem` 的 `toPath(item.path)` 仍按段数组下发 `name` —— `PF-H1`/`IT-06`（`integration.spec.ts:79`）覆盖点分 path 转数组与校验定位

### 17. `SlotComponent` 支持组件定义对象渲染（`isRenderable`）

- **位置**：`src/components/form/components/SlotComponent/index.vue:19-26`
- **修改点**：`v-if="isVNode(component) || typeof component === 'function'"` → `isRenderable = 非 null/undefined 且（function | object）`；string/number/boolean 仍走文本插值
- **解决的问题**：传入组件定义对象（`SlotComponentType` 显式允许 `Component<PathProps>`）时落入文本插值，DOM 出现组件对象 JSON 文本，自引用对象还会抛循环引用错（CR-086）。CR 关联：`0f61b82`、`2429b61`（vant 同缺陷）
- **影响**：运行时行为；非 breaking（放宽判定）；Changeset `.changeset/fix-antd-slot-component-and-search-form.md`
- **证据**：`BI-A20`（`BaseFormItem.spec.ts:529`「slots 传入组件对象时渲染组件本体，传入字符串时按文本渲染」）；提交 `0f61b82`
- **复核结论**：✅ 无误 / ⚠️ 文案滞后（低优先）：组件 JSDoc（`:4`）仍写「动态渲染外部传入的 VNode、渲染函数或静态字符串」，未包含改动后支持的「组件定义对象」（四包同句，非本包独有）。建议补一句行为边界

### 18. `BaseFormItem` 移除本地 key 逻辑、字段过滤加 `isObjectItem`、实例登记注释改写

- **位置**：`BaseFormItem/index.vue:27-28,57-62,86-117,154-162`
- **修改点**：删除本地 `fieldKeySeed`/`fieldKeyMap`/`getFieldKey`（迁至 `utils/fieldKey.ts`）；`validFields` 由 `!toValue(field.hidden)` 改为 `isObjectItem(field) && !toValue((field as any).hidden)`；`WeakMap` 与 `defineFieldAccessors` 的注释改为「字段对象被回收后对应条目不再可读」「访问器仅用于字段对象读取，不参与属性遍历与字段配置透传」；`GridProps` 改从 `shared/ui` 具名导入（`import type`）
- **解决的问题**：CR-073（null/原始值项崩溃）、CR-054（key 抽离）、CR-090（注释规范）
- **影响**：运行时健壮性 + 渲染 key 语义（见修改点 15）；无 API 变更
- **证据**：`BI-A3`（`:14` splice/重排后实例精准绑定）、`BI-A6`（`:106` `Object.freeze` 仅告警一次）、`BI-A18`（`:474`）、`DOC-01`（`comment-conventions.spec.ts:64-67`）；提交 `5a8a20d`、`dc29ccc`、`2429b61`
- **复核结论**：✅ 无误。`:121/:138` 的 `!raw || typeof raw !== 'object'` 守卫与 `isObjectItem` 口径一致；JSDoc 中 `@param {Fields<D>} [fields]`（`:20`）引用了本文件未声明的泛型 `D`（纯文档瑕疵，建议改为 `Fields`）

### 19. `ProForm` disabled 继承宿主上下文 + 兜底表单实例移入 setup 同步期

- **位置**：`src/components/form/components/ProForm/index.vue:82-90`（disabled）、`:97-99`（兜底实例）、`:2-44`（JSDoc）、`:151-159`（插槽注释）
- **修改点**：`useDisabledContextProvider(computed(() => d === '' || d === true || d === 'true'))`（未指定时恒下发 `false`） → 引入 `parentDisabled = useDisabledContext()`，`attrs.disabled === undefined` 时下发 `parentDisabled.value`；`let fallbackForm; computed(() => props.form ?? (fallbackForm ??= useForm()))`（惰性，首次读取时创建） → `const fallbackForm = useForm()`（setup 同步期创建）+ `computed(() => props.form ?? fallbackForm)`；JSDoc 补 `@public` / `@param {...FormProps} ...attrs` / `@example` / `@slot` 措辞
- **解决的问题**：antdv-next 的 DisabledContext 为「最近 Provider 全量覆盖」，恒下发 `false` 会遮蔽宿主 `ConfigProvider.componentDisabled` 与外层 `a-form disabled`，表单被静默解除禁用（CR-072，P2）；惰性创建会在非 setup 时机触发 `provide() can only be used inside setup()`（`cc83f0b` Top-10）
- **影响**：运行时行为（禁用继承 + 兜底实例创建时机）；Changeset `.changeset/fix-antdv-next-disabled-context.md`
- **证据**：`PF-D2`（`ProForm.spec.ts:348`）——宿主 `componentDisabled: true` + 未指定 → input 禁用；显式 `:disabled="false"` 覆盖宿主；裸 `disabled` 仍禁用（`:354-386`）；`PF-A2`（`:14`）未传 form 时自建实例可读写；`PF-B2b`（`:125`）`:form` 置空后回退内部实例；提交 `e140615`、`cc83f0b`
- **复核结论**：✅ 无误。`attrs.disabled` 走 fallthrough（`Props` 上的 `MyFormProps` 带 `/* @vue-ignore */`，运行期 props 仅 `grid`/`form`），与 `useAttrs()` 读法自洽；`as any`（`:89`）与 `BaseFormItem:67` 既有范式一致（类型层可选性所致，非必需但可保留）

### 20. `BaseField` 关联收敛：删除 date-picker 死三元、注入断言去除

- **位置**：`src/components/form/components/BaseField/utils/index.ts:30-42`；`src/components/form/components/BaseField/index.vue:174-175`
- **修改点**：`const picker = component === 'date-picker' ? '' : (field as any).picker` → `const picker = (field as any).picker`；`inject(InjectionFormSlotsKey, undefined) as { value: … } | undefined` → 直接 `inject(InjectionFormSlotsKey, undefined)`
- **解决的问题**：CR-079「死通道」（该三元只影响占位符 locale key，而 `PLACEHOLDER_KEYS` 中不存在任何 `date-picker*` 键，强制 `''` 与按 picker 拼接结果都是 `{}`）；CR-028（注入类型收敛后无需手工断言）
- **影响**：无行为变化（等价重构）；`BaseField/index.vue:73-87` 的组件注入 key 解析（`[component, picker].join('.')`）保持不变，仍是 `date-picker.month` 等预设的取值来源
- **证据**：`BF-A15`（`BaseField.spec.ts:386`）——input 仍得「请输入」、`date-picker.date` 不产生兜底占位符、注入级显式 placeholder 生效；提交 `088cb2c`、`077f293`
- **复核结论**：✅ 无误。逐行核对 `getPlaceholderProps`（`utils/index.ts:20-28`）确认删除前后返回值恒等：`PLACEHOLDER_KEYS` 无 `date-picker*` 键 → `placeholderKey` 恒 `undefined` → 恒返回 `{}`

### 21. `src/index.ts`：三段 JSDoc 各自绑定导出、`install()` 去掉 `.name!` 断言

- **位置**：`src/index.ts:16-64`、`:81-88`
- **修改点**：原先三个组件的说明写在同一个 JSDoc 块内、仅 `export { ProForm, ProTable, ProComponentProvider }` 绑定到最后一段（ProForm/ProTable 文档在 IDE 丢失） → 拆成三段，各自紧贴对应 `export`；`app.component(ProComponentProvider.name!, …)` → `app.component(ProComponentProvider.name ?? 'ProComponentProvider', …)`
- **解决的问题**：CR-024（文档绑定）、CR-025（非空断言掩盖 `name` 可能为 undefined）
- **影响**：文档/IDE 提示 + 运行时健壮性（`name` 缺失时仍有注册名）；Changeset `.changeset/fix-adapters-export-surface-and-contracts.md`（四包同构）
- **证据**：`SX-01`（`__tests__/index.spec.ts:9`）——导出键集合名单锁定 + `default.install` 注册三组件名 `['ProComponentProvider','ProForm','ProTable']`（`:66-75`）；提交 `077f293`
- **复核结论**：✅ 无误。导出名单（16 键）与 `Object.keys` 实测完全一致，且反向断言 `INJECT_CONFIG`/`get`/`set`/`toPath` 未泄漏

### 22. `shared/core` 再导出面补齐 + `useTable` 迁入 `hooks/` 并移除 `PageParam` 再导出

- **位置**：`src/shared/core/index.ts:4-58`（新增 `localePacks`/`normalizeColumn`/`normalizeColumns`/`resolveFieldIdentity`/`DEFAULT_FIELD_IDENTITY_KEYS`/`isObjectItem`/`type AdditionalMethods`）；`src/components/table/hooks/useTable.ts:1-12` + `hooks/index.ts:1` + `table/index.ts:15`；`ProTable.vue:71`、`ColumnControl.vue:6`
- **修改点**：`table/useTable.ts` → `table/hooks/useTable.ts`（相对路径由 `../../shared/core` 改 `../../../shared/core`），新增 hooks 桶并删除 `export type { PageParam }`
- **解决的问题**：CR-025（core 已公开但适配层取不到 → §1.3 统一导入契约不完整）；CR-076（三包目录结构对齐 + 导出面对齐：另两包无 `PageParam` 导出）；CR-093（`resolveFieldIdentity` 经本包再导出，`useGroupFieldAttrs` 消费）
- **影响**：包内模块布局 + 内部导出面；对公开 API 的影响仅限类型（`PageParam` 不再从表格模块可取），**breaking（类型层，影响面极小）**；`088cb2c` 带 Changeset
- **证据**：`SX-02`（`index.spec.ts:85`）——运行时面 `Object.keys(import('../src/components/table')).sort() === ['default','useTable']`（`:96`），类型面 `// @ts-expect-error PageParam 已从表格 Hook 模块导出面移除`（`:88`）与 `// @ts-expect-error PageParam 不属于表格模块导出面`（`:90`）；`SETUP-03`（`setup.spec.ts:35`）保证测试期 core 走源码；提交 `088cb2c`、`077f293`
- **复核结论**：✅ 无误。两个 `@ts-expect-error` 均被消费（`vue-tsc` 0 错误即证明，未消费会报 TS2578）；`useTable.ts:5-10` 仍 `import type PageParam` 供内部使用，仅不再对外导出

### 23. 测试基建：core 源码别名、`restoreMocks`、RO/IO mock 身份修复、flush 提速与告警守卫

- **位置**：`vitest.config.ts:1-19`；`__tests__/setup.ts:24-51,68-96,115-156`；`__tests__/helpers/mount.ts:11-18,109-140`；`tsconfig.json:18` + `package.json:57`（新增 `@types/node ^24`）
- **修改点**：① `resolve.alias` 把 `@qin-ui/pro-components-core` 指向 `../core/src/index.ts`（测试期不再消费 `es/` 产物）；② 开 `restoreMocks: true`；③ RO/IO mock 构造时保存 `this.entry`，`disconnect()` 由「新建字面量 delete」改为 `delete(this.entry)`；④ `flushPromises` 去掉 20ms 真实睡眠（改 `nextTick + 0ms 宏任务 + nextTick`），新增 `waitForRaf` / `expectWarn` / `expectInputValue`；⑤ `setup.ts:115-156` 未放行 `console.warn/error` 守卫（白名单仅 1 条宿主机 shadow root 噪声），未显式断言即失败
- **解决的问题**：CR-104（core 改了未 build 时用例对着旧产物跑）、CR-023（spy 跨用例泄漏）、CR-013（mock 死条目导致跨用例污染）、CR-029（套件无谓等待）、CR-041/043（告警伪装成断言的问题）
- **影响**：测试基建（不影响产物与运行时）；新增 `setup.spec.ts`（3 条）等基建自检用例
- **证据**：`SETUP-01`/`SETUP-02`/`SETUP-03`（`setup.spec.ts:7/25/35`）；提交 `a9b4f13`、`938fcb7`、`0ea21e0`
- **复核结论**：✅ 无误。实测 `setup.spec.ts (3 tests)` 全绿；`resolve.alias` 使 `import('@qin-ui/pro-components-core')` 与源码相对导入解析为同一模块实例（`SETUP-03` 用 `isObjectItem` 恒等断言）

### 24. 用例补齐与守卫（CR-031 / CR-033～CR-050 / 编号卫兵 / 注释与 AI 上下文守卫）

- **位置**：`__tests__/ProTable.spec.ts`（+1011/−70）、`SearchForm.spec.ts`、`BaseFormItem.spec.ts`、`ProForm.spec.ts`、`BaseField.spec.ts`、`controls.spec.ts`、`cross-package.spec.ts`、`integration.spec.ts`、`index.spec.ts`、`hooks-locale.spec.ts`、新增 `comment-conventions.spec.ts` / `setup.spec.ts` / `ai-context.spec.ts`
- **修改点**：新增判别性用例 50 条（83 → 133），含：`PT-A19`～`PT-A29`（分组 hidden、容器形态、control 三形态、序号偏移、告警、emit 入口、宿主快照缺失、v-model:size、筛选插槽、插槽守卫）、`SF-A16`/`SF-05`/`SF-A10`、`BI-A15`~`BI-A20`、`PF-D1`/`PF-D2`、`HK-04`、`SX-01`/`SX-02`、`SETUP-01~03`、`DOC-01/02`、`AC-01~07`；同时清除恒真/空过断言、`if (el.exists())` 守卫与 `as any` 冗余
- **解决的问题**：CR-031（公开能力零覆盖：容器/控制形态）、CR-033～CR-050（测试质量组：恒真断言、告警伪装、选择器缺陷、编号重号、mock 泄漏）、CR-021（编号卫兵）
- **影响**：仅测试；无 Changeset 的提交（`32c5ea8`/`f299454`/`e689378` 等）已按「仅测试」惯例声明
- **证据**：`vitest run` 13 文件 / 133 用例全绿；`node scripts/check-test-ids.mjs` → `[check-test-ids] 用例编号在同一包内唯一 ✓`；提交 `32c5ea8`、`f299454`、`e689378`、`0ea21e0`
- **复核结论**：✅ 无误（用例与实现断言逐条读了关键 20 余条）。⚠️ 单点保留意见见修改点 11 / 15：`SF-A10`、`SF-03` 的自定义按钮点击次数断言在 happy-dom 下恒真；`BI-A15b` 标题承诺超出断言范围

### 25. 文档与 AI 上下文（README / AI-CONTEXT.md / docs 同步 + `ai-context.spec.ts` 守卫）

- **位置**：`README.md`（`search` 类型 `() => Promise<unknown>`、`addIndexColumn` 默认 `true`、新增「与 AI 编码工具协作」段）、`AI-CONTEXT.md`（新增「项目级覆盖层」「内置默认表导语」与反模式条目）、`__tests__/ai-context.spec.ts:12-41`
- **修改点**：README 按实现更正两处口径（原 `search: () => Promise<void>`、`addIndexColumn` 默认 `false` 与 `constants/index.ts:33` 矛盾）；AI-CONTEXT 增补「Field 属性 > 项目 Provider > 内置默认」三层优先级与「写码前搜索项目 Provider 配置」硬规则；新增 7 条静态守卫锁住这些句子
- **解决的问题**：CR-038（README 与实现不一致）、AI 生成代码不读项目 Provider 覆盖层导致默认值误判
- **影响**：文档 + 测试（无运行时/类型变化）；Changeset `.changeset/ai-provider-context-antdv-next.md`（patch）；提交 `cc83f0b`（README 口径）、`e73293a`（AI 上下文，四包同构）
- **证据**：`AC-01~AC-07`（`ai-context.spec.ts` 全绿，读 `../AI-CONTEXT.md` 断言 7 处关键表述）；`DOC-02` 保证 ProTable/SearchForm JSDoc 与 antd 包逐句一致；`SX-01`（`index.spec.ts:25-44`）锁导出名单
- **复核结论**：✅ 无误 / ⚠️ 一处未同步（低优先）：`docs/antdv-next-pro/components/pro-table/index.md:71` 仍把 `addIndexColumn` 默认值写作 `-`，未随 README 改为 `true`（`control` 行同为空，属文档整列风格问题）；`docs/.../pro-table/index.md` 的 `search` 类型写作 `Function`，可对齐 README 的 `() => Promise<unknown>`

### 26. `ColumnControl` 与 `SizeControl` 消费点同步

- **位置**：`ColumnControl.vue:3-6,27-63`、`122-131`；`SizeControl.vue:2-23`
- **修改点**：ColumnControl 引入 `isObjectItem` 过滤 + `toValue(item.hidden)`，`Table` 类型导入路径改 `../hooks/useTable`；SizeControl 的 `useConfig` → `useHostConfig`
- **解决的问题**：CR-105（列清单入口崩溃）、CR-075（同名歧义）
- **影响**：运行时健壮性；无 API 变更
- **证据**：`CC-01`（`controls.spec.ts:80`）、`CC-02`（`:134`）、`CC-A2`（`:176`）、`CC-03`（`:336`）、`SC-A13`（`:18`）、`SC-01`（`:39`）；提交 `bc0dd02`、`088cb2c`
- **复核结论**：✅ 无误。`SC-A13`「SizeControl 挂载时不静默向父级发出 update:size」锁定了 CR-071 相关的静默回写风险，`SizeControl.vue:19-23` 现为只读 `currentSize` 计算，无挂载期写入

### 27. 类型导入收敛（`import type`）与 `consistent-type-imports`

- **位置**：`src/components/component-provider/components/index.vue:31,39`、`constants/index.ts:1-3`、`form/components/index.ts:1-4`、`form/hooks/useFields.ts:1`、`form/components/BaseField/utils/index.ts:1`、`form/types/index.ts:1-22`、`table/hooks/useTable.ts`、`table/index.ts:1-4`、`table/types/index.ts:2`、`ProTable.vue:50-87`、`SearchForm.vue:70-73`、`SizeControl.vue:2-8`、`ColumnControl.vue:5-6`、`SlotComponent/index.vue:8`、`BaseField/index.vue:45-50`、`components/index.ts` 等（`git diff --name-only 734e3c0 -- src | wc -l` = 24）
- **修改点**：纯类型导入一律改 `import type` / 内联 `type`，运行时值与类型分离；配合根 `eslint.config.mjs` 开启 `@typescript-eslint/consistent-type-imports`（error，separate-type-imports）
- **解决的问题**：CR-089（存量 118 处），避免类型导入被打包器保留为运行时依赖、`isolatedModules` 下的歧义
- **影响**：无运行时/类型语义变化；lint 规则收紧
- **证据**：`vue-tsc --noEmit` 0 错误；`eslint` 0 error（`consistent-type-imports` 无告警）；`index.spec.ts:87-92` 对 `import('../src/components/table/hooks').PageParam` 的注解属契约本体，局部 `eslint-disable` 保留；提交 `0f61b82`
- **复核结论**：✅ 无误。逐文件抽查导入语句无「类型当值用」或「值当类型用」的误改

## 遗留与建议

**跨包漂移（本包已改，邻包待评估）**

1. `element-plus-pro/src/shared/ui/index.ts:84-89` 的 `tableProps()` 仍是 `(Table as any).props || {}` 静默快照（无宿主推导告警、无「全量透传 + 排除消费键」兜底）；`element-plus-pro/.../ProTable.vue:100` 直接 `Object.keys(tableProps())` 做白名单。若该宿主未暴露静态 props，透传会静默归零且无任何信号 —— 本包（`shared/ui/index.ts:87-101` + `ProTable.vue:99-109`）已收敛，建议对齐。
2. `antd-vue-pro` 保留 `TableEmitProps` 单键补丁（宿主 4.2.6 未导出 emits 类型，且 `Table.props` 本就含 `onChange` 等，唯一缺口为 `onUpdate:expandedRowKeys`）——属**有意不对称**，已在 `74030da` 提交说明与类型 JSDoc 中登记，不算漂移。
3. 修改点 11 的「自定义查询按钮双触发」隐患三包同构（`antd-vue-pro/.../SearchForm.vue:160-162`、`element-plus-pro/.../SearchForm.vue:166-168`），建议三包一起收口。
4. `form/types/index.ts:94-108` 的 `hidden`/`disabled` **重复 JSDoc 块**（旧块 `字段是否隐藏` / `字段是否禁用` 未删除）四包同构（antd:107-120、element:107-120、vant:84-97 同形），`table/types/index.ts:39-47` 的列 `hidden` 亦然。建议四包一起合并为单块。
5. 「`hidden` 支持 Ref / getter」的文案与公开类型 `hidden?: boolean` 不匹配（`form/types/index.ts:101`、`table/types/index.ts:47`）：运行期确实 `toValue` 解包，但 TS 消费方传 `ref(true)` 会报错，包内用例均靠 `as any`（如 `ProTable.spec.ts:867`）。建议类型放宽为 `MaybeRef<boolean>`（或文案注明「运行期支持，类型层需自行解包」）——**待确认**是否有意保持窄类型。
6. `src/components/form/utils/fieldKey.ts:17-18` 的非对象回退分支在渲染路径不可达（见修改点 15），且 `BI-A15b` 标题与断言不符；建议删除或补直接单测。
7. `docs/antdv-next-pro/components/pro-table/index.md:71,90`（`addIndexColumn` 默认值 `-`、`pro-table` 契约描述）未随 README 更新；`docs` 内暂无 `TableProps`/`TableComponentProps` 的过期引用（仅 `CHANGELOG.md` 历史条目保留旧名，属正常）。
8. `SlotComponent/index.vue:4` 的 JSDoc 未涵盖「组件定义对象」这一新增可渲染形态（四包同句）。
9. `BaseFormItem/index.vue:20` JSDoc `@param {Fields<D>} [fields]` 引用了文件内未声明的泛型 `D`（纯文档瑕疵）。
10. `ProTable.vue:176` 用 `/** … */` 单行 JSDoc 标注局部常量 `SEARCH_WARN_MESSAGES`，与同文件其余局部常量用 `//` 的惯例不一致（AGENTS §2.2 的 JSDoc 面向函数/类/模块）。
11. `ProTable.vue:284-286` 的 `loading/pagination/onChange: undefined` 三个赋值在编译产物中被模板显式绑定覆盖（已用 `vue/compiler-sfc` 复核），当前为防御性冗余；若保留建议加一行注释说明其仅防止未来模板改动后注入值回流。
12. 未加测试/文档的改动核对：本轮 25 个提交中，`src/` 改动均有对应用例（见各条「证据」）；无 Changeset 的纯测试与文档提交（`32c5ea8`、`f299454`、`938fcb7`、`a9b4f13`、`d905ed2`、`a5a1542`、`1ada73a`）已在提交信息中声明「仅测试/文档，无 Changeset」，符合 §4.4。
13. 残留扫描：包内 `src/` 与 `__tests__/` 无 `console.log`、`debugger`、`[DBG]`、`TODO`/`FIXME`/`XXX`/`HACK`（`grep -rn` 0 命中）；eslint 无 `no-unused-vars` 告警，未发现未用导入/变量。

## 门禁实测

以下命令均在 `packages/antdv-next-pro` 或仓库根目录实跑，输出为原文摘要（门禁执行时本包工作区为干净状态：`git status --porcelain -- packages/antdv-next-pro` 无输出；复核期间 HEAD 由 `74030da` 前进至 `e73293a`，见文首说明）。

1. **用例**（复核期间跑了两次，两次均为 13 文件 / 133 用例全绿；下列为第二次的完整输出，日志留存于 `/tmp/change-review/antdv-next-vitest.log`）

   ```
   $ cd packages/antdv-next-pro && npx vitest run
    ✓ __tests__/hooks-locale.spec.ts (7 tests)
    ✓ __tests__/BaseField.spec.ts (12 tests)
    ✓ __tests__/ProForm.spec.ts (13 tests)
    ✓ __tests__/comment-conventions.spec.ts (2 tests)
    ✓ __tests__/SearchForm.spec.ts (10 tests)
    ✓ __tests__/controls.spec.ts (10 tests)
    ✓ __tests__/BaseFormItem.spec.ts (16 tests)
    ✓ __tests__/integration.spec.ts (6 tests)
    ✓ __tests__/cross-package.spec.ts (14 tests)
    ✓ __tests__/ai-context.spec.ts (7 tests)
    ✓ __tests__/setup.spec.ts (3 tests)
    ✓ __tests__/ProTable.spec.ts (31 tests)
    ✓ __tests__/index.spec.ts (2 tests)
    Test Files  13 passed (13)
         Tests  133 passed (133)
      Duration  12.28s
   EXIT=0
   ```

   stderr 侧仅 2 条宿主机噪声（`SC-01`、`PT-A28` 的浮层用例）：`Warning: trigger element and popup element should in same shadow root.` —— 已被 `__tests__/setup.ts:121-123` 的 `HOST_NOISE_PATTERNS` 白名单放行，其余任何未在用例内显式断言的告警都会让 `afterEach` 抛错（`setup.ts:147-155`），故「全绿」同时意味着无残留告警。

2. **类型检查**

   ```
   $ cd packages/antdv-next-pro && npx vue-tsc --noEmit
   （无任何输出）
   VUE_TSC_EXIT=0
   ```

   意义：4 处 `@ts-expect-error` 契约锁（`ProTable.spec.ts:798`、`index.spec.ts:88`、`index.spec.ts:90`、`SearchForm.spec.ts:352`）全部**被消费**——若锁失效或契约回退，会报 TS2578 `Unused '@ts-expect-error' directive`。`tsconfig.json` 的 `include: ["src","__tests__"]` 保证 spec 文件在检查范围内。

3. **构建**

   ```
   $ pnpm --filter "@qin-ui/antdv-next-pro" build
   > prebuild: tsx ../../scripts/generate-api-json.ts antdv-next-pro && tsx ../../scripts/generate-init-ai.ts antdv-next-pro
     Package API JSON generated at: .../packages/antdv-next-pro/api.json
     init-ai CLI generated at: .../packages/antdv-next-pro/bin/init-ai.mjs
   > build: vue-tsc --noEmit && vite build
   vite v6.4.1 building for production...
   ✓ 53 modules transformed.
   [vite:dts] Start generate declaration files...
   es/antdv-next-pro.css   1.41 kB │ gzip:  0.43 kB
   es/index.js            61.97 kB │ gzip: 14.33 kB │ map: 133.25 kB
   [vite:dts] Declaration files built in 4224ms.
   ✓ built in 4.67s
   BUILD_EXIT=0
   ```

   注：prebuild 生成的 `api.json` / `bin/init-ai.mjs` 与 `es/` 均被 `.gitignore` 忽略（`git check-ignore -v` 命中 `.gitignore:35/38/14`），未污染工作区；本轮复核全程未执行 `git add/commit/checkout/restore/stash/mv`。

4. **附加检查（非任务门禁，供参考）**

   ```
   $ npx prettier --check "packages/antdv-next-pro/**/*.{ts,vue,json,md}"
   All matched files use Prettier code style!                       exit 0
   $ node scripts/check-test-ids.mjs
   [check-test-ids] 用例编号在同一包内唯一 ✓                          exit 0
   $ npx eslint packages/antdv-next-pro/src packages/antdv-next-pro/__tests__
   ✖ 349 problems (0 errors, 349 warnings)
     规则分布：@typescript-eslint/no-explicit-any 312 / vue/one-component-per-file 31 / vue/require-prop-types 6
     （仓库 lint:check:eslint 未设 --max-warnings=0，故不构成门禁失败；无 no-unused-vars 命中）
   ```

---

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

---

# packages/vant-pro 修改清单（734e3c0 → 当前）

> 复核快照：起始 `HEAD=74030da`，复核过程中并行工作流提交了 `e73293a`（仅 docs/测试/config，无 src 变更），最终以 `HEAD=e73293a` 重新抓取全量 diff；两版 diff 差异仅为本报告覆盖的 AI 上下文文档与守卫用例。
> 复核方式：逐行读当前文件 + 逐提交 `git show` 读意图 + 8 条仓外探针（`/tmp/change-review/probe/`，只写 /tmp）实证。
> 未修改仓库任何文件（`git status --porcelain -- packages/vant-pro` 为空；门禁构建仅重写 gitignore 覆盖的 `es/`、`api.json`、`bin/init-ai.mjs`）。

## 概览

- **提交数**：19（`git log --oneline 734e3c0..HEAD -- packages/vant-pro | wc -l`）
- **文件数**：32 changed, 1550 insertions(+), 199 deletions(−)；其中 `src/` 15 个、`__tests__/` 12 个、其余 5 个为 package/tsconfig/vitest/README/AI-CONTEXT
- **用例数**：**55 → 90**（spec 文件 10 → 15；grep `it(`/`test(` 计数与 vitest 报告一致）
- **门禁结果**：`npx vitest run` 90/90 通过（exit 0）；`npx vue-tsc --noEmit` 0 错误（exit 0）；`pnpm --filter "@qin-ui/vant-pro" build` 成功（exit 0）；附加核验 `npx eslint src __tests__` 0 error（187 warning）、`node scripts/check-test-ids.mjs` ✓ 无重号
- **复核结论分布**：21 条修改点中 ✅ 13 条、⚠️ 6 条、❌ 2 条（详见各条目「复核结论」；另见「遗留与建议」3 条 pre-existing 残留）

## 修改点

### 1. 弹层与内联分支统一为「控件侧取值」，与 confirm 写回构成对称往返

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:287-297`（`onFieldClick` 的 `open(props.path, value.value, …)`）；`packages/vant-pro/src/components/form/hooks/useFormPopup.ts:162-166`（`open` 的 `@param initialValue` 文案）
- **修改点**：`open(path, form?.getFormData?.(props.path), …)` → `open(path, value.value, …)`。`value` 的 getter 已应用 `valueFormatter.get`（`BaseField/index.vue:91-102`），confirm 分支经 `value.value = popupFieldValue` 走 setter 应用 `valueFormatter.set`（`:206-222`），两侧构成 get→set 对称往返。同步把 `open` 的 `@param` 从「弹层初始值（原始数据）」改为「弹层初始值，取控件侧取值（已应用 valueFormatter.get）」。
- **解决的问题**：CR-055（**行为变更**）。此前弹层收 `formData` 原始数据、内联收控件侧取值，数组模型控件（`tags`/`picker`/`date-picker`）在弹层内状态错乱（`values.map is not a function`）。
- **影响**：运行时行为变更（仅影响配置了 `valueFormatter.get` 的 popup 字段）；公开 API 签名不变；类型契约不变；无性能影响。**需要 Changeset**：`.changeset/fix-vant-popup-semantics.md`（`minor`）已写明「⚠️ 升级影响」小节，逐字说明了两分支取值差异与「未配置 valueFormatter 的字段行为不变」——需求已满足。
- **证据**：`VP-V7 [判别]`（`BaseField.spec.ts:270-325`，断言弹层初值 `['a','b']` 而非原始串 `'a,b'`，并断言 confirm 后回写 `'a,b,c'`）；提交 `46d2fef`。
- **复核结论**：✅ 无误（语义只出现在 `onFieldClick` 一处，无第二处 `getFormData` 直取残留）。

### 2. 抽离 `dispatchListeners`，覆盖 `onUpdateValue` / confirm / cancel

- **位置**：`packages/vant-pro/src/components/form/utils/listeners.ts:1-28`（新增）；调用点 `BaseField/index.vue:125`（onUpdateValue）、`:221`（confirm）、`:225`（cancel）
- **修改点**：三处各自的「函数直调 / 数组 forEach」内联分支 → 统一 `dispatchListeners(listener, ...args)`：函数直调、数组按序逐个调用（并跳过非函数项）、其余形态不调用。
- **解决的问题**：CR-056。Provider `componentVars` 与字段配置声明同名监听时 `mergeProps` 会合并为数组，此前 confirm/cancel 直接调用抛 `confirmEvent is not a function`，且两侧回调被静默丢弃（弹层已关、值已写）。
- **影响**：运行时行为修复；`utils/listeners.ts` 不在包公开导出面（`src/index.ts` 未导出 utils），非公开 API；无类型契约变更；无需独立 Changeset（并入 #1 的 changeset 条目）。
- **证据**：`VP-B8 [判别]`（`BaseField.spec.ts:823-877`，断言派发顺序 `provider-update, field-update, provider-confirm, field-confirm` 且不抛错）；提交 `46d2fef`。
- **复核结论**：⚠️ 建议改进——契约第 3 条「其余忽略」分支（传入 string/object 等非函数非数组）**无用例覆盖**，建议补 1 条（`dispatchListeners('x' as any)` / `dispatchListeners({} as any)` 不抛错且不调用）。

### 3. 字段卸载时按 `activeFieldId === fieldUid` 关闭自属弹层

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:299-305`
- **修改点**：新增 `onBeforeUnmount` 钩子 → `if (popup?.activeFieldId?.value === fieldUid) popup.close()`。归属判定用组件实例 uid（`:130` `getCurrentInstance()!.uid`，开弹层时写入 `:296`）。
- **解决的问题**：CR-057。字段在弹层打开期间被 `setField(path,{hidden:true})` 隐藏或被删除时，弹层与遮罩残留为空白浮层（隐藏键在字段层被剥离，隐藏/删除都表现为卸载）。
- **影响**：运行时行为修复；无 API/类型变更；不影响他字段弹层（归属不等则不关闭）。
- **证据**：`VP-B7 [判别]`（`BaseField.spec.ts:764-818`，隐藏分支断言 `visible=false` + `activeFieldId=undefined` + VanPopup `show=false`；删除分支先验证另一字段仍可正常开启，再删除并断言关闭）；`VP-V14`（归属 uid 恒等）；提交 `46d2fef`。
- **复核结论**：✅ 无误（判定条件是 `===` 严格恒等，不存在误关他字段弹层的路径）。

### 4. Field 层专有键不再降级为内层控件 DOM 属性

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:169-171`（`getControlPropsKeys`）、`:241-255`（剔除循环）
- **修改点**：新增「保留集 = `uiFieldPropsKeys`（`Object.keys(VanField.props)`，`:64`）∩ 内层控件声明的 props」判定，命中且不在保留集时从 `bindAttrs` 删除（`type`/`name` 例外）。`fieldAttrs` 的既有白名单下发（`:230-239`）不变，外层 `van-field` 仍拿到 `label`/`rules`。
- **解决的问题**：CR-058。`label`/`rules`/`disabled` 等先前作为普通属性透传内层控件，`rules` 对象被序列化成 `[object Object]` 落到 DOM。
- **影响**：运行时行为修复；无 API 变更；无需独立 Changeset。
- **证据**：`BF-09 [判别]`（`BaseField.spec.ts:704-759`：picker 根节点无 `label`/`rules`/`disabled`；stepper 的 `placeholder`/`max`/`disabled` 仍以 prop 保留）；提交 `46d2fef`。
- **复核结论**：⚠️ 建议改进（3 处，均经仓外探针实证）：
  1. **数组式 props 声明会被误判为空集**：`getControlPropsKeys` 用 `Object.keys(component?.props || {})`，而 Vue 不会把数组式 `props: ['disabled']` 归一化到组件定义上（探针实测 `Object.keys= ["0"]`，SSR 渲染后仍为 `["0"]`）。故声明为数组式的自定义控件会**丢掉自己声明的 Field 层同名键**：探针 P-03 中 `props: ['modelValue','disabled','placeholder']` 的组件最终只收到 `{modelValue:2}`，`disabled`/`placeholder` 被删；对象式同组件（P-04）正常收到三者。建议改为 `Array.isArray(component.props) ? component.props : Object.keys(component.props || {})`，并补一条「数组式 props 控件保留声明键」用例。
  2. **原生元素回退路径被过度剔除**：`component` 为未注册字符串时 `is.value` 仍是字符串、`component.props` 不存在 → 保留集为空 → `placeholder`/`disabled` 一并被删。探针 P-07 实测 `component:'input'` 渲染为 `<input type="tel" modelvalue="abc">`，**`placeholder="请输入关键字"` 与 `disabled` 均丢失**（`type` 因例外保留），而 734e3c0 基线无剔除循环（`git show 734e3c0:…/BaseField/index.vue | grep -c controlPropsKeys` = 0）→ 属本批引入的回退路径行为回归；而 `src/index.ts:20` 的公开 JSDoc 示例正是 `component: 'input'`。建议在解析结果为字符串（原生元素）时跳过剔除，或至少对原生元素保留 DOM 合法属性。
  3. **`type` 例外与契约口径不符**：剔除循环硬编码 `key !== 'type' && key !== 'name'`，故 `type` 仍会泄漏——探针 P-05 实测 popup picker 字段带 `type:'tel'` 时渲染出 `<div class="van-picker" type="tel">`。`name` 例外实际惰性（`useGroupFieldAttrs.ts:25` 已把 `name` 从 `componentProps` 剥离，故 `bindAttrs` 通常不含 `name`）。建议把例外收窄为「仅 `component === 'field'` 分支保留 `type`/`name`」，或把例外写进代码注释（现注释只说「内层控件未声明的 Field 层键剔除」，未提例外）。

### 5. `updateProps` 持久化：`baseProps` / `openProps` / `props` 三层

- **位置**：`packages/vant-pro/src/components/form/hooks/useFormPopup.ts:127-136`（三层定义）、`:138-146`（`syncProps`）、`:148-160`（`resetProps`）、`:162-186`（`open`）、`:197-201`（`updateProps`）
- **修改点**：`open()` 不再调用 `resetProps()`（旧的「先重置为默认再合并 customProps」）→ 清空 `openProps` 后仅合并本次 `customProps`；`updateProps` 写 `baseProps` 并 `syncProps()`；`resetProps` 只重置 `baseProps` 并清空单次覆盖。`syncProps` 先删除三层皆无的键再 `Object.assign(props, baseProps, openProps)`，**`props` 对象标识稳定**（同一 reactive 对象原地增删）。
- **解决的问题**：CR-059。`updateProps` 写入的属性会被下一次 `open()` 重置，无法做全局弹层默认配置。
- **影响**：运行时行为修复（`props` 的公开读取面与对象标识不变，故非 breaking——基线 `open()` 本就会重置 `props`，直接改写 `props` 也不会跨 open 存活）；JSDoc 同步为「基础属性/单次覆盖」行为陈述（`:43-57`、`:197`）；无类型契约变更。
- **证据**：`POP-01`（`useFormPopup.spec.ts:223-252`，覆盖 `updateProps→open` 保留、`customProps` 单次生效、再次 open 回落持久值、`resetProps` 后回默认）；`VP-V16`（跨字段不串属性）；提交 `46d2fef`。
- **复核结论**：✅ 无误（`syncProps` 的「先删后并」保证了 `resetProps` 后不残留 `closeOnClickOverlay` 等非默认键，POP-01 末段已判别）。

### 6. `componentClass/componentStyle` 与 `fieldClass/fieldStyle` 落点修正

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:196`（折叠为 `{class, style}`）、`:201`（从透传属性中剥离原名）、`:377-378`（`component==='field'` 分支补绑 `fieldAttrs.class/style`）
- **修改点**：`componentClass`/`componentStyle` 不再作为普通属性透传，而是在合并阶段折叠为内层组件的 `class`/`style` 并剥离原始键；`component: 'field'` 分支（外层包装与内层组件合一）补绑字段层样式，与 VanField 包装分支一致。
- **解决的问题**：字段样式类名/内联样式不生效且污染 DOM（`componentclass="[object Object]"`）。
- **影响**：运行时行为修复；无 breaking（原「样式被忽略」无合理依赖）；Changeset `.changeset/fix-vant-field-class-style.md`（patch）已写明。
- **证据**：`BF-06`（内层自定义组件根节点获得 `custom-cls` 且无 `componentclass`/`componentstyle` DOM 属性）、`BF-07`（`component:'field'` 时 VanField 根节点获得 `fieldClass`/`fieldStyle`）、`BF-08`（四类 class/style 各归其层、互不串层）；提交 `3bb3303`。
- **复核结论**：✅ 无误（`mergeProps` 对 `class` 相同值短路、对 `style` 归一为空对象，实测无空 `style` 属性落地，探针 P-03/P-04 的根节点 attributes 无残留）。

### 7. `onFieldClick` 的禁用判定改读 Field 层属性

- **位置**：`packages/vant-pro/src/components/form/components/BaseField/index.vue:287-289`
- **修改点**：`const { disabled, readonly } = groupedAttrs.value.attrs` → `…fieldAttrs`。被点击的是外层只读展示 `van-field`，故判定应取 Field 层视图（含 `effectiveDisabled` 与 Provider 注入的 `readonly`）。
- **解决的问题**：弹层字段的禁用/只读判定取错了层（`bindAttrs` 中 `readonly` 可能因控件不声明该 prop 而不存在）。
- **影响**：运行时行为收敛（更严格：Provider 注入 `readonly: true` 时不再打开弹层）；无 API/类型变更。
- **证据**：`BF-09`/`VP-B8` 间接覆盖；`VP-V7` 覆盖正常开启路径；提交 `46d2fef`。
- **复核结论**：✅ 无误（`readonly`/`disabled` 均在 `uiFieldPropsKeys` 白名单内，`fieldAttrs` 必然携带）。

### 8. ProForm 兜底表单实例提前到 setup 同步期创建

- **位置**：`packages/vant-pro/src/components/form/components/ProForm/index.vue:63-71`（`const fallbackForm = useForm(); const currentForm = computed(() => props.form ?? fallbackForm)`）
- **修改点**：`computed(() => props.form ?? (fallbackForm ??= useForm()))` 的惰性初始化 → setup 同步期 `const fallbackForm = useForm()`；JSDoc 由「惰性初始化」改为「回退内部表单实例」行为陈述。
- **解决的问题**：惰性初始化发生在 computed 求值期（非 setup），`useFormPopup(true)` 内 `getCurrentInstance()` 为空 → `provide()` 只能在 setup 内使用的告警、且弹层 id 退化为 `standalone-N`；同时消除「运行期 `:form` 置空」路径的重复初始化。
- **影响**：运行时行为修复；副作用是即使外部传入 `:form` 也会创建一份内部兜底表单（多一份响应式状态，未渲染、无渲染开销）；无 API/类型变更。
- **证据**：`VP-A2`（未传 form 自建）、`VP-B2`/`VP-B2b`（运行期置空回退）、`VP-V12`/`VP-V13`（容器 id 由 useId 派生、多实例互不重复）、`VP-V19`（`:form` 替换触发重挂载）；提交 `cc83f0b`。
- **复核结论**：✅ 无误（兜底实例 `props.form` 存在时不参与渲染，仅内存占用；`git diff` 未改变 `:key="formKey"` 契约）。

### 9. `fields` 含 null/原始值项不再崩溃

- **位置**：`packages/vant-pro/src/components/form/components/BaseFormItem/index.vue:22-23`（引入 `isObjectItem`）、`:41-47`（`validFields` 过滤）、`:82-83`（`setComponentRef` 非对象守卫）
- **修改点**：`f.filter(field => !toValue(field.hidden))` → `f.filter(field => isObjectItem(field) && !toValue((field as any).hidden))`；`setComponentRef` 增加 `if (!field || typeof field !== 'object') return`。
- **解决的问题**：`fields` 数组混入 `null`/原始值时读 `.hidden` 抛错、`toRaw` 对原始值抛 WeakMap 错误（core 统一 `isObjectItem`）。
- **影响**：健壮性修复；无 API 变更。
- **证据**：`BI-A15`（null/undefined 项）、`BI-A15b`（原始值项，`renderKey` 走非对象回退）；提交 `5a8a20d`。
- **复核结论**：✅ 无误（`isObjectItem` 经 `shared/core` 统一再导出，符合 AGENTS.md §1.3 导入契约）。

### 10. 字段渲染 key 改为「字段对象身份」，抽出共享 `utils/fieldKey.ts`

- **位置**：`packages/vant-pro/src/components/form/utils/fieldKey.ts:1-26`（新增，模块级 `WeakMap` + 自增种子）；`useGroupFieldAttrs.ts:30-37`（`renderKey: getFieldKey(field)`）；`BaseFormItem/index.vue:108`（`:key="item.renderKey"`，删除组件内本地 `getFieldKey` 实现）
- **修改点**：`v-for` key 由 `item.path || getFieldKey(item.rawField)` → 恒为 `item.renderKey`（`toRaw(field)` 身份 → 自增编号）。同 `path` 兄弟字段不再共用 key。
- **解决的问题**：同 `path` 字段 key 冲突导致节点错位复用；「无 path 才用对象 key」的半吊子策略失效。
- **影响**：运行时行为修复（DOM 复用/迁移语义变化）；模块级 `WeakMap` 不入响应式追踪（`computed` 内调用安全）；无公开 API 变更。
- **证据**：`BI-A17`（同 path 交换后节点随 key 迁移）、`BFI-04`（头部插入分组后原字段组件不复用错位）、`VP-V11`（头部 `prependField` 后 `input` 节点保留、弹层归属不变）、`VP-V19`（同批字段对象 + `:form` 替换仍重挂载）；提交 `dc29ccc`、`2429b61`。
- **复核结论**：⚠️ 建议改进（低危）——非对象回退键为 `` `raw_${String(field)}` ``，两个相同原始值（如两个 `'a'`、两个 `null`）会得到同一 key，JSDoc（`:14-16`）称「按字面量生成稳定 key」但未声明该冲突；`BaseFormItem` 已用 `isObjectItem` 过滤故组件路径不可达，直接消费 `useGroupFieldAttrs`/`getFieldKey` 时可达。建议改为 `raw_${typeof field}_${String(field)}_${index}` 形态（需传入下标）或在 JSDoc 标注该边界。

### 11. `BaseFormItem` 新增 `disabled` 并向下传播

- **位置**：`packages/vant-pro/src/components/form/components/BaseFormItem/index.vue:31-39`（`disabled?: boolean` + `disabled: undefined` 默认）、`:115-118`（嵌套 `BaseFormItem`）、`:122-127`（`BaseField` 显式 `:disabled`）
- **修改点**：新增 `disabled` prop；叶子字段 `:disabled="item.componentProps.disabled ?? props.disabled"`，嵌套分组 `:disabled="toValue(item.rawField.disabled) ?? props.disabled"`；随 `077f293`（CR-030）四包同构补充 `Field.disabled` 的 JSDoc「字段级取值优先，未显式指定时继承上层（表单或宿主 Provider）的禁用上下文」。
- **解决的问题**：分组字段的 `disabled` 不向子字段传播（element/vant 同一批修复）。
- **影响**：新增（非公开文档化）内部 prop；`@internal` 组件，不在 `src/index.ts` 导出面；无类型契约变更。
- **证据**：探针 P-02（直接给 `BaseFormItem` 传 `disabled: true` 时 `VanStepper.disabled === true`，管线本身可用）；提交 `cc83f0b`。
- **复核结论**：⚠️ 建议改进——**ProForm 从不给 BaseFormItem 传 `disabled`**（`ProForm/index.vue:148` 只有 `:fields`），且 `BaseField` 恒把 `disabled` 写成显式布尔（`:188-198` `{ disabled: effectiveDisabled }`），该显式 `false` 会**遮蔽 van-form 的 disabled 上下文**（vant `Field.getProp` 优先取自身 prop，仅在其为 `undefined` 时才回落 `form.props[key]`）。探针实证：P-01 `<ProForm disabled>` → `VanForm.disabled=true`、`VanField.disabled=false`、`VanStepper.disabled=false`；P-01b 更严格：`van-cell--disabled` 计数 0、`input` 无 `disabled` 属性、stepper 加减号均无 `disabled`、`van-stepper__plus` 仍带 `van-haptics-feedback`（可交互）。即 **`<ProForm disabled>` 对 vant 字段整体无效**，与 `ProForm/index.vue:21` 的 `@param {boolean} [disabled] - 全局表单禁用` 及四包同构 JSDoc（`types/index.ts:95`）不符；其余三包靠宿主 Form 原生 disabled 上下文（antd/element）或 ProForm 自建上下文（antdv-next `ProForm/index.vue:82-88`）成立，属**四包漂移**。建议：vant 侧在 ProForm 把 `attrs.disabled`（含 `''`/`'true'` 归一）经 `:disabled` 下传 `BaseFormItem`，或改由 `useProviderDisabled` 式上下文；若决定不做，则应把 vant 的 `Field.disabled` JSDoc 收窄为「继承宿主 Provider 注入的 componentVars 禁用值」，并删掉 ProForm 的「全局表单禁用」措辞。

### 12. `useGroupFieldAttrs` 改用 core `resolveFieldIdentity`

- **位置**：`packages/vant-pro/src/components/form/hooks/useGroupFieldAttrs.ts:24-37`（`path: resolveFieldIdentity(field)`，`GroupedField.path: string`）
- **修改点**：本地 `toValue(field.name) ?? toValue(field.path)` + `Array.isArray(raw) ? raw.join('.') : raw || ''` → core `resolveFieldIdentity`（键序 `['name','path']`、`normalizePathKey` 归一、无可用键返回 `''`）；同时把 `path`/`name` 从 `componentProps` 剥离的写法由 `const { path, name, … }` 改为 `_path`/`_name`（消除未用变量）。
- **解决的问题**：字段标识契约四包统一（宿主标识键 `name` 优先于 `path`），归一化实现收敛到 core 单点。
- **影响**：语义与基线一致（旧的 `??` 链同序同义），仅归一化实现替换；`GroupedField` 新增 `renderKey` 字段（`@internal` 类型，未在公开导出面）。
- **证据**：`cross-package.spec.ts:56`「宿主标识键优先于 path：name 覆盖 path，值绑定与字段查找共用同一标识」；`VP-F15`（`name` 优先、仅 `path` 时取 `path`、容器属性剥离）；提交 `bd888e9`。
- **复核结论**：✅ 无误（`resolveFieldIdentity` 返回 `string`，与 `GroupedField.path: string` 一致；`''` 兜底与旧 `|| ''` 等价）。

### 13. `Field` 公开类型补实例访问器

- **位置**：`packages/vant-pro/src/components/form/types/index.ts:238-241`（`Field = (FieldTypeMap[C] | WithFields<D>) & Pick<AdditionalMethods<any>, 'getComponentRef' | 'getComponentComputedProps'>`）；`shared/core/index.ts:6`（`type AdditionalMethods`）
- **修改点**：字段公开类型复用 core `AdditionalMethods` 声明 `getComponentRef`/`getComponentComputedProps`，与 `BaseFormItem` 运行时经 `defineProperty`（不可枚举）挂载的访问器对齐。
- **解决的问题**：访问器已在运行时可用但类型面缺失，业务需 `as any`。
- **影响**：类型契约增强（纯增量，不收紧既有字段配置类型）；无运行时影响。
- **证据**：`BI-A16 [判别]`（`BaseFormItem.spec.ts:194-216`，`const field: Field = …` 后 `field.getComponentRef?.()` 无需断言且运行时有值）；提交 `3a99eb0`。
- **复核结论**：✅ 无误（`Pick` 只取两个可选方法，不污染字段配置字面量）。

### 14. `hidden` / `disabled` 的 JSDoc 与类型（CR-030）

- **位置**：`packages/vant-pro/src/components/form/types/index.ts:83-97`
- **修改点**：四包同构补充行为陈述，当前文件内 `hidden`、`disabled` 各出现**两个连续 JSDoc 块**（旧块 `:83-85`、`:91-93`；新块 `:86-89`、`:94-96`），新块声明「支持布尔、Ref 与 getter 形式，渲染期统一按 `toValue` 取值」「字段级取值优先，未显式指定时继承上层（表单或宿主 Provider）的禁用上下文」，并在 `hidden` 的新块中夹带「嵌套字段 `path` 使用各自独立的完整路径…」的 path 语义。
- **解决的问题**：CR-030 四包文案收敛（`hidden` 支持 `toValue` 解包、`disabled` 继承语义、嵌套 `path` 不拼接）。
- **影响**：仅文档；`hidden?: boolean` / `disabled?: boolean` 的类型面未同步放宽；无运行时影响。
- **证据**：`comment-conventions.spec.ts` 未覆盖本文件；四包同句已由 `grep` 核验逐字一致（`antd-vue-pro:118` / `antdv-next-pro:106` / `element-plus-pro:118` / `vant-pro:95`）；提交 `077f293`。
- **复核结论**：❌ 问题——(a) `:83-85` 与 `:91-93` 是**未被删除的旧 JSDoc 残留**（同一成员两段 `@description`，违反 AGENTS.md §2 的注释规范；docgen/IDE 取后者，前者纯噪声），且 `hidden` 的新块把 `path` 语义写进了 `hidden` 的说明、`path` 成员自身（`:79-82`）只有一句「字段标识namePath, 同name」；(b) 新块声称 `hidden` 支持 Ref/getter，但声明类型是 `hidden?: boolean`——运行时确实经 `toValue` 支持，**类型面却拒绝**（`BaseFormItem` 不得不用 `(field as any).hidden` 绕过，见 `BaseFormItem/index.vue:45`），文案与类型契约不一致。建议：删除两处旧 JSDoc 块；把嵌套 path 说明移到 `path` 成员；将类型放宽为 `hidden?: MaybeRefOrGetter<boolean>`（`disabled` 同理，或把 JSDoc 收窄为「渲染期按 toValue 取值」并说明类型面仅布尔）。

### 15. `SlotComponent` 渲染判定放宽为「非原始值即组件」

- **位置**：`packages/vant-pro/src/components/form/components/SlotComponent/index.vue:16-24`（`isRenderable = c !== null && c !== undefined && (typeof c === 'function' || typeof c === 'object')`）
- **修改点**：`v-if="isVNode(component) || typeof component === 'function'"` → `v-if="isRenderable(component)"`（组件定义对象也交给 `<component :is>`），原始值仍走文本插值；同时去掉 `import { isVNode }` 与注入类型断言。
- **解决的问题**：CR-086。`SlotComponentType` 显式允许组件对象，但此前只认 VNode/函数 → 组件对象落入文本插值，DOM 出现组件对象 JSON 文本（自引用对象还会抛循环引用错）。
- **影响**：运行时行为修复；与 `element-plus-pro` 同构文件逐字一致；无 API 变更。
- **证据**：`BI-A20 [判别]`（`BaseFormItem.spec.ts:260`，组件对象渲染组件本体、字符串按文本渲染）；`DOC-02`（`comment-conventions.spec.ts:55-65`，断言与 element 文件逐字一致且不含 `isVNode`）；提交 `2429b61`（`0f61b82` 登记为待批）。
- **复核结论**：✅ 无误（`null`/`undefined`/`number`/`boolean`/`string` 均按文本分支，函数式组件保留）。

### 16. `src/index.ts` 导出 JSDoc 拆分、`shared/core` 再导出面补齐

- **位置**：`packages/vant-pro/src/index.ts:12-45`（三段 JSDoc 各自紧贴 `export`）；`src/shared/core/index.ts:4-57`（补 `type AdditionalMethods`、`localePacks`、`normalizeColumn`、`normalizeColumns`、`resolveFieldIdentity`、`DEFAULT_FIELD_IDENTITY_KEYS`、`isObjectItem`）
- **修改点**：原先三段组件说明在一个 JSDoc 块内、仅最后一段绑定导出（ProForm 文档在 IDE 丢失）→ 拆为三个 `export {}`；适配层补齐 core 已公开但包内取不到的再导出。
- **解决的问题**：CR-024（导出文档绑定）、CR-025（§1.3 统一导入契约）。
- **影响**：文档/类型可见性；`shared/core` 是包内聚合入口，非新增公开 API（`normalizeColumn/normalizeColumns/localePacks` 未从 `src/index.ts` 再导出）；Changeset `.changeset/fix-adapters-export-surface-and-contracts.md`。
- **证据**：`setup.spec.ts` `SETUP-03`（经包名解析到 core 源码，与直接源码导入同一模块实例）；构建 dts 成功；提交 `077f293`（`3a99eb0`/`5a8a20d`/`bd888e9` 增量补充）。
- **复核结论**：⚠️ 建议改进（低危，2 点）：(a) `src/index.ts:63` 仍为 `app.component(ProComponentProvider.name!, ProComponentProvider)`，其余三包已改为 `ProComponentProvider.name ?? 'ProComponentProvider'`（`antd-vue-pro/src/index.ts:83-86` 等）——CR-025 的 install 项**漏改 vant**（运行时无影响：`component-provider/components/index.vue:38-39` 有静态 `name`）；(b) `shared/core/index.ts` 分组注释失准：`:5` 的 `// types` 只覆盖 `type AdditionalMethods`，紧随的 `localePacks`/`normalizeColumn(s)` 是值导出；`resolveFieldIdentity`/`DEFAULT_FIELD_IDENTITY_KEYS` 被放在 `:10` 的 `// hooks` 下，实为字段标识 utils。建议把 `// types` 下移或拆成 `// 字段标识 / 表格列归一` 分组。

### 17. 纯类型导入收敛（`import type`）

- **位置**：`component-provider/constants/index.ts:1-3`、`component-provider/types/index.ts:1-4`、`components/form/components/index.ts:1-4`、`form/hooks/useFields.ts:1`、`form/hooks/useFormPopup.ts:12`、`form/types/index.ts:1-13`、`components/ProForm/index.vue:49-50` 等
- **修改点**：值导入 `import { X }` 改为 `import type { X }`（含 `Field as VanField`、`Popup`、`AdditionalMethods` 等）；`eslint.config.mjs` 开启 `@typescript-eslint/consistent-type-imports`（error）。
- **解决的问题**：CR-089 统一类型绑定，避免纯类型导入进入运行时依赖图。
- **影响**：纯类型层，无运行时/API 影响；无需 Changeset。
- **证据**：`npx vue-tsc --noEmit` 0 错误 + `vite build` 成功；`npx eslint src __tests__` **0 error**；提交 `0f61b82`。
- **复核结论**：✅ 无误（`useFormPopup.ts:12` 的 `import type { Popup }` 后仍以 `ComponentProps<typeof Popup>` 使用，类型面不受影响）。

### 18. 文档更新：date-picker 数组模型示例、AI 协作章节、`updateProps/open` 语义

- **位置**：`packages/vant-pro/README.md:176-178`（AI 协作章节）、`:479-500`（date-picker/area 示例改 `date: string[]` + `displayFormatter: (val: string[]) => val?.join('-')`）、`:236/255/258`（**未更新**）；`docs/vant-pro/components/pro-form/index.md:60`（已更新为持久化/单次覆盖/控件侧取值）；`packages/vant-pro/AI-CONTEXT.md:59-80`（项目级覆盖层）、`:174`（反模式）
- **修改点**：README 的 `date-picker` 弹层示例改数组模型（旧示例 `date: ''` + `(val: string)` 实测内联与弹层两分支均抛 `values.map is not a function`）；新增「与 AI 编码工具协作」段；AI-CONTEXT 增补「写码前先读项目 `ProComponentProvider` 实际配置」硬规则；`docs/vant-pro` 的 `formPopup` 行补 `updateProps` 持久生效 / `open` 的 `customProps` 仅本次 / `initialValue` 为控件侧取值。
- **解决的问题**：CR-060 文档修正；AI 协作规则（属性优先级 Field > Provider > 内置默认）。
- **影响**：仅文档；随 `e73293a` 附 Changeset `.changeset/ai-provider-context-vant.md`（patch）。
- **证据**：`ai-context.spec.ts` `AC-01…AC-07`（`__tests__/ai-context.spec.ts:12-39`，静态断言 AI-CONTEXT 关键句在场）；提交 `46d2fef`、`e73293a`。
- **复核结论**：❌ 问题——**README 的 `formPopup` 表格仍是 CR-055/CR-059 之前的旧语义**，与实现、与新 JSDoc、与 `docs/vant-pro/components/pro-form/index.md:60` 直接矛盾：`README.md:236`「可传初始值（**原始数据**）」、`:255`「打开指定字段的弹层；**自动重置属性为默认值后合并 customProps**；`initialValue` 传**原始数据**」、`:258`「`updateProps(props)`：合并更新当前弹层属性」。而实现是 `open()` 不再重置基础属性、`initialValue` 取控件侧取值、`updateProps` 写持久基础属性。CR-060 声称「docs 补 updateProps/open/initialValue 语义说明」只落到 `docs/`，**包内 README（npm 页面与 `files` 发布物）漏改**。建议按 `docs/vant-pro/.../index.md:60` 的措辞同步 `README.md:236/255/258`，并把该表并入注释/文档契约用例（如 `comment-conventions.spec.ts`）以防回流。

### 19. 测试基建：vitest 别名/`restoreMocks`、RO mock 身份修复

- **位置**：`packages/vant-pro/vitest.config.ts:4-21`（`@qin-ui/pro-components-core` → `../core/src/index.ts` 别名 + `restoreMocks: true`）、`__tests__/setup.ts:21-50`（`ResizeObserverEntry` 类型化、`disconnect()` 用 `this.entry` 注销）
- **修改点**：测试期经源码消费 core（消除对 `es/` 构建产物的隐性依赖）；每用例后自动还原 `vi.spyOn` 替身；RO mock 的注册表条目改为构造期持有同一对象引用（原 `delete({callback, elements})` 因对象身份不同永远删不掉）。
- **解决的问题**：测试可信度（对构建产物的隐性依赖、mock 泄漏、注册表注销失败）。
- **影响**：仅测试基建；无运行时影响。
- **证据**：`SETUP-01`（disconnect 后条目移除）、`SETUP-02`（unobserve 仅移除元素）、`SETUP-03`（经包名解析到源码且与源码导入同一模块实例）；提交 `a9b4f13`、`938fcb7`、`0ea21e0`。
- **复核结论**：✅ 无误。

### 20. `package.json` / `tsconfig.json` 元数据

- **位置**：`packages/vant-pro/package.json:55`（`@types/node ^24` devDependency）、`:61-63`（`sideEffects: ["./es/index.js"]`）；`tsconfig.json:17`（`"types": ["node"]`）
- **修改点**：`sideEffects` 去掉 `"**/*.css"`；新增 `@types/node`；tsconfig 显式 `types: ["node"]`（供 `ai-context.spec.ts` 使用 `node:fs`/`node:path`）。
- **解决的问题**：CR-026（本包无 `<style>` 块、`es/` 无 CSS 产物、`exports` 未暴露 CSS 子路径，`**/*.css` 为无效声明）。
- **影响**：打包元数据；`sideEffects` 与其余三包的差异**经核实合理**（`ls packages/*/es/*.css`：antd/element/antdv-next 各 1 个 CSS 产物，vant-pro 0 个）；Changeset `.changeset/fix-vant-sideeffects-metadata.md`（patch）已写明理由。
- **证据**：`git log -p` 定位为 `0ea21e0`；`grep -rn "<style\|\.css" packages/vant-pro/src/` 无命中；构建产物无 CSS。
- **复核结论**：⚠️ 建议改进（低危）——`tsconfig.json` 在 `files` 发布清单内（`files: ["es","src","bin","README.md","LICENSE","api.json","AI-CONTEXT.md","tsconfig.json"]`），而 `types: ["node"]` 会把自动纳入的 `@types/*` 收窄为仅 `node`，且 `@types/node` 只是 devDependency；若有消费方 `extends` 该 tsconfig，将需要自备 `@types/node` 并失去其它自动 `@types`。**待确认**：是否有外部消费方 `extends`（仓库内仅本包使用）。建议改为在 `__tests__` 侧局部声明，或把 `@types/node` 提为 `peerDependencies`/`dependencies`。

### 21. 用例扩充盘点（CR-031 / CR-061 / CR-086 等）

- **位置/修改点**：新增 spec 文件 5 个（`baseFieldUtils.spec.ts` VP-F14/F15、`formHooks.spec.ts` VP-F16/F17/F18、`setup.spec.ts` SETUP-01/02/03、`comment-conventions.spec.ts` DOC-01/02、`ai-context.spec.ts` AC-01…07）；既有文件扩充（`BaseField.spec.ts` +6：BF-06/07/08/09、VP-B7、VP-B8；`useFormPopup.spec.ts` +2：VP-V17/V18，另 POP-01 扩展 + `VP-V11` 改不同 path 触发 keyed-map 分支；`BaseFormItem.spec.ts` +5：BI-A15/A15b/A16/A17/A20 + BFI-04 重写；`ProForm.spec.ts` +2：PF-D1、VP-V19；`hooks-locale.spec.ts` +2：HL-03/04；`cross-package.spec.ts` +1）。
- **解决的问题**：CR-031（补齐未覆盖的公开能力）、CR-061（补测 7 条并调整 3 条）、CR-086（BI-A20）、CR-022（重写恒真/零信息断言）。
- **影响**：仅测试；`package.json` 无 test 脚本变更。
- **证据**：`npx vitest run` → 15 files / 90 tests 全绿；55→90 用例增量与各提交 diff 行数吻合；`VP-V17` 用真实 `defer` Teleport（不 stub teleport）断言内容落在 `contentId` 容器、`VP-V18` 覆盖 `teleportTo`、`VP-V19` 覆盖「同批字段对象 + `:form` 替换」的 `formKey` 重挂载；提交 `f299454`、`0a47cfe`、`2429b61`、`46d2fef`、`e73293a`。
- **复核结论**：✅ 无误（判别性断言可失败：`BF-09` 的 `hasAttribute`、`BI-A17` 的节点恒等、`VP-V19` 的 `setupCount` 与节点恒等均为强判别）。⚠️ 提示：`comment-conventions.spec.ts`/`ai-context.spec.ts` 属「文档子串契约」，合法改词即转红，属设计取舍，仅需知悉维护成本。

## 遗留与建议

- **未随本批修复的过期文案（pre-existing，建议随手清理）**：`src/index.ts:20` 的公开 JSDoc 示例用 `component: 'input'`，而 `'input'` 既不在 `BaseComponentMap`（`constants/index.ts:84-100`）也不在 `ComponentName` 联合类型内 —— 按示例写会触发 `未识别的组件类型 "input"` 告警并降级为原生元素（叠加本报告 #4-2，placeholder/disabled 还会被剔除）。建议改为 `component: 'field'`（并考虑给 `ComponentName` 加 `'input'` 之类的原生元素白名单，或明确文档化原生回退语义）。
- **判别用例编号的注释残留（pre-existing，且新卫兵抓不到）**：`__tests__/BaseField.spec.ts:510/541/567` 的分节注释写 `VP-V10 / VP-V11 / VP-V12`，而同一分节的 `it()` 名为 `VP-F13a/b/c`（`:512/543/569`），且与 `useFormPopup.spec.ts:73/149/283` 的真实 `VP-V10/11/12` 撞号。经 `git blame`，注释与 `it()` 名同出 `e30b2d18`（是 `734e3c0` 的祖先，**不在本次改动范围**）；`scripts/check-test-ids.mjs` 只扫描带引号的编号字面量（`NAMED_PATTERN`/`BARE_PATTERN` 均要求前置引号），实测 `node scripts/check-test-ids.mjs` → `✓` exit 0，故注释残留不会被拦截。建议把分节注释与 `it()` 名对齐，并让卫兵扫描 `// 编号` 形式。
- **跨包漂移（vant 侧未跟上）**：(a) `install()` 的 `ProComponentProvider.name!`（#16-a）；(b) `<ProForm disabled>` 对字段无效（#11，其余三包成立）；(c) `sideEffects` 与三包不同（**已核实合理**，勿盲目对齐）。
- **门禁外但仓库纪律相关**：`npx eslint packages/vant-pro/src packages/vant-pro/__tests__` 为 **0 error / 187 warning**，warning 全部是 `@typescript-eslint/no-explicit-any`（新增文件 `utils/listeners.ts:3,4,17`、`utils/fieldKey.ts` 等），与包内既有风格一致，未新增 error。
- **未加测试的两处**：`dispatchListeners` 的「其余忽略」分支（#2）；`getControlPropsKeys` 的数组式 props 分支（#4-1，本报告以仓外探针 P-03/P-04 实证，未落地为仓库用例）。
- **待确认**：`tsconfig.json` 的 `types: ["node"]` 是否有外部 `extends` 消费方（#20）；`Field.disabled` 的 Ref/getter 形态是否计划进类型面（#14-b）。

## 门禁实测

命令与结果原文摘要（均在 `packages/vant-pro`，HEAD=`e73293a`，工作区 `git status --porcelain -- packages/vant-pro` 为空）：

1. `npx vitest run` → exit 0

   ```
   Test Files  15 passed (15)
        Tests  90 passed (90)
      Duration  2.12s
   ```

   仅有 1 处预期 stderr（`M10` 用例的孤立上下文告警）：`[useForm] root=false 但未找到注入的父表单实例（当前不在 ProForm 组件上下文中），已回退为创建独立根表单。`

2. `npx vue-tsc --noEmit` → 无任何输出，`TSC_EXIT=0`（0 错误）

3. `pnpm --filter "@qin-ui/vant-pro" build` → exit 0

   ```
   > @qin-ui/vant-pro@1.3.4 prebuild … tsx ../../scripts/generate-api-json.ts vant-pro && … generate-init-ai.ts vant-pro
   > @qin-ui/vant-pro@1.3.4 build … vue-tsc --noEmit && vite build
   ✓ 30 modules transformed.
   [vite:dts] Declaration files built in 17145ms.
   es/index.js  34.11 kB │ gzip: 7.83 kB │ map: 78.53 kB
   ✓ built in 23.14s
   ```

   产物 `es/index.js`、`api.json`、`bin/init-ai.mjs` 均被 gitignore 覆盖，未改动任何跟踪文件。

4. 附加核验（仓库纪律，非本次要求门禁）：`npx eslint packages/vant-pro/src packages/vant-pro/__tests__` → `✖ 187 problems (0 errors, 187 warnings)`；`node scripts/check-test-ids.mjs` → `[check-test-ids] 用例编号在同一包内唯一 ✓`（exit 0）

5. 仓外探针（不写仓库，仅 `/private/tmp/change-review/probe/`，最终复跑）：`npx vitest run --config /tmp/change-review/probe/vitest.probe.config.mjs` → `Test Files 1 passed (1) / Tests 8 passed (8)`（`root=/private/tmp/change-review`、`cacheDir` 指向探针本地目录、`vue`/`vant`/`@vue/test-utils`/core 全部经 `createRequire(PKG)` 的绝对路径别名解析，不写入仓库 `node_modules`，不依赖软链）；实证结论见 #4-1/#4-2/#4-3（P-03 数组式 props 仅收到 `{modelValue:2}`、P-04 对象式收到三者、P-05 `<div class="van-picker" type="tel">`）、#11（P-01 `VanForm.disabled=true` 但 `VanField/VanStepper.disabled=false`、P-01b `van-cell--disabled` 计数 0 且 stepper 加减号无 `disabled`、P-02 直接传 `BaseFormItem disabled` 时生效）、`hidden` 递归（P-06：嵌套分组 `hidden: true` 子字段被过滤，仅渲染 1 个输入框与「B」文案 ✅）、原生元素回退（P-07 `{"type":"tel","modelvalue":"abc"}`，`placeholder`/`disabled` 丢失）。

---

## 五、跨包与工程化改动（不属于单包）

### 1. 用例编号卫兵 `scripts/check-test-ids.mjs`（新增，+80 行，提交 `0ea21e0` / `ad60833`）

- **修改点**：新增独立脚本，扫描各包 `__tests__/**` 的用例编号并校验**同一包内唯一**：
  - 双模式识别：具名形式 `it('前缀-编号: 描述')` 与 `it.each` 表内 `{ id: '前缀-编号' }`；
  - 裸字面量收紧：需含连字符或 ≥2 位数字段，避免把 `'X2'`、`'O2'` 这类普通值误判为编号；
  - 同行多命中自动去重；跨行重复 → 打印两处位置并 `exit 1`。
- **解决的问题**：评审中发现 `element PT-09`、`vant VP-V15/VP-V16/M11` 等**编号重复/错位**导致用例报告不可定位（CR-021 类问题）；此前无任何自动化约束。
- **影响**：**仅工程化**，不影响运行时代码与包产物；新增根脚本 `check:test-ids`，并串入 `lint:check`（提交 `0ea21e0`），CI 由 `pnpm lint` 改为 `pnpm lint:check`（校验模式、不写文件）。
- **证据**：`pnpm check:test-ids` 全仓通过；CI 改动见 `.github/workflows/ci.yml`。

### 2. ESLint 类型导入规则（`eslint.config.mjs`，+7 行，提交 `0f61b82`）

- **修改点**：新增 `@typescript-eslint/consistent-type-imports`（`error`，`prefer: 'type-imports'`，`fixStyle: 'separate-type-imports'`）。
- **解决的问题**：纯类型绑定与运行时导入混写，导致打包产物残留无用导入、类型面与实现面边界不清（CR-089）。
- **影响**：**开发者体验/产物洁净度**；存量 61 文件、118 处已统一（`--fix` 59 处 + 人工 2 处）。可能影响下游使用者的 lint 结果（若继承本仓配置），运行时无影响。
- **证据**：`npx eslint "packages/**/*.{ts,vue}"` → 0 error。

### 3. 根脚本与 CI（`package.json` +7 行、`.github/workflows/ci.yml`）

- **修改点**：新增 `check:test-ids`、`lint:check:eslint`、`lint:check:stylelint`、`lint:check:prettier`，并由 `lint:check` 串联；CI 的 Lint 步骤改用 `pnpm lint:check`。
- **解决的问题**：原 `pnpm lint` 会**写文件**（`--fix`），在 CI 中无法作为"是否合格"的判据（CR-017 同类：文档化门禁与实际不符）。
- **影响**：CI 语义由"自动修复"变为"校验失败即红"；本地需要自动修复时仍可用 `pnpm lint`。

### 4. 测试基建（细节见 §四各包报告）

- **mock 隔离**：五包 `vitest` 配置开启 `restoreMocks`（提交 `0ea21e0`），消除跨用例 spy 泄漏。
- **`flushPromises` 去真实睡眠**：`__tests__/helpers/mount.ts` 由「`setTimeout(20)` 等待」改为「`nextTick` + `setTimeout(0)` + `nextTick`」，约百处调用点提速（提交 `0ea21e0`）。
- **告警守卫**：`antd-vue-pro` / `antdv-next-pro` / `element-plus-pro` 三包 `__tests__/setup.ts` 增加「未放行告警即失败」的 `afterEach`，白名单按探针实测逐包校准；`expectWarn` 由死代码复活为真实断言。
- **注释契约锁定**：三包新增 `__tests__/comment-conventions.spec.ts`（`DOC-01/02/03`），静态校验公开 JSDoc 结构。
- **源码消费 core**：测试期经 `src` 别名消费 core（提交 `a9b4f13`），消除对 `es` 构建产物的隐性依赖（此前必须先 build core 才能跑测试）。
- **RO/IO mock 身份**：修复 `ResizeObserver`/`IntersectionObserver` mock 的 `disconnect` 身份不匹配（提交 `938fcb7`）。

### 5. `examples` 演示应用

- `a0cd0b8`：增加 `passWithNoTests`，修复 `pnpm -r test` 在 examples 包必然失败（CR-017）。
- `58a03cf`：新增路由配置与测试脚本。
- 复核期新增 5 个可视化复核 demo（`examples/src/views/*-demo.vue`）：字段 a11y、列对象就地变异、分组列、Provider 控制表格尺寸、vant class/style 落点；用于人工目视确认对应修复。

### 6. Changeset 与发版

- 共 **32 份** changeset；bump 级别分布：`patch` 41 项（跨包计次）、**`minor` 4 项**：
  - `@qin-ui/pro-components-core` minor：CR-016「不再就地变异调用方数组」（`@mutates` 契约收敛）；
  - `@qin-ui/vant-pro` minor：CR-055「弹层取值统一为控件侧取值」；
  - `@qin-ui/antd-vue-pro` / `@qin-ui/antdv-next-pro` minor：查询表单回车语义与相关契约调整（详见两包报告）。
- 其余为 `patch`：缺陷修复、类型面收敛、文档同步、`sideEffects` 元数据等。

## 六、发版前检查清单

### 已实测通过（本次复核结论）

| 项       | 命令                                                 | 结果                                                                             |
| -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| 五包单测 | `pnpm -r test`                                       | **705 用例全绿**（core 207 / vant 90 / antd 133 / element 142 / antdv-next 133） |
| 类型检查 | `pnpm --filter "./packages/*" exec vue-tsc --noEmit` | **0 错误**                                                                       |
| 代码风格 | `npx prettier --check "packages/**/*.{ts,vue,json}"` | 通过                                                                             |
| Lint     | `npx eslint "packages/**/*.{ts,vue}"`                | **0 error**                                                                      |
| 编号卫兵 | `node scripts/check-test-ids.mjs`                    | 同包内编号唯一 ✓                                                                 |
| 产物构建 | `pnpm --filter "@qin-ui/<包>" build` ×5              | **五包全部成功**                                                                 |

### 发布前需 owner 决策 / 执行

1. **三处行为变更需确认**（均有 Changeset 说明，且 bump 为 `minor`）：
   - `core`：`useFields` / `useTable` 不再就地变异调用方数组（浅拷贝；元素仍共享）；
   - `vant-pro`：弹层与内联分支统一为控件侧取值（`valueFormatter.get` 参与往返）；
   - `antd-vue-pro` / `antdv-next-pro`：查询表单默认按钮回车语义（避免真实浏览器 click+submit 双触发）。
2. **版本提升与 CHANGELOG**：执行 `pnpm changeset version` 生成版本号与 CHANGELOG（当前四包版本：core 2.0.6 / antd 2.4.5 / antdv-next 1.4.5 / element 1.3.5 / vant 1.3.4）。
3. **文档站点**：`docs/` 下 ProTable 插槽「作用域参数」列、`hidden` 契约、vant 弹层语义、Provider 配置等已同步；如需发布站点，请执行站点构建（本清单未覆盖站点 build 门禁）。
4. **复核结论中的 ⚠️ 项**：见 §四各包报告末尾「遗留与建议」，逐条决定是否在本版处理。
5. **分支比对流程**：按 §一 执行 `git reset --soft 734e3c0` 后逐包 `git diff` 复核，确认无误再 `pnpm changeset version` + 打 tag。

## 五、CR → 提交索引

（摘自评审报告 §14.1；`—` 表示该条经确认忽略或无需提交）

| 序  | CR                     | 提交      |
| --- | ---------------------- | --------- |
| 2   | CR-082                 | `0ad097a` |
| 3   | CR-071                 | `5e02ba7` |
| 4   | CR-052 / CR-053        | `3bb3303` |
| 5   | CR-092 / CR-093        | `296a6a4` |
| 6   | CR-008                 | `029d10b` |
| 7   | CR-009                 | `c20e669` |
| 9   | CR-073                 | `5a8a20d` |
| 10  | CR-105                 | `bc0dd02` |
| 12  | CR-072                 | `e140615` |
| 15  | CR-011                 | `300f80b` |
| 19  | CR-095                 | `083c6b7` |
| 21  | CR-097                 | `f87d529` |
| 24  | CR-018                 | `84e2eaf` |
| 25  | CR-020                 | `84e2eaf` |
| 26  | CR-027                 | `84e2eaf` |
| 30  | CR-030                 | `077f293` |
| 31  | CR-021                 | `0ea21e0` |
| 32  | CR-023                 | `0ea21e0` |
| 33  | CR-029                 | `0ea21e0` |
| 34  | CR-026                 | `0ea21e0` |
| 37  | CR-022                 | `0a47cfe` |
| 38  | CR-031                 | `f299454` |
| 47  | CR-074                 | `088cb2c` |
| 48  | CR-075                 | `088cb2c` |
| 49  | CR-076                 | `088cb2c` |
| 50  | CR-077                 | `088cb2c` |
| 51  | CR-078                 | `088cb2c` |
| 52  | CR-079                 | `088cb2c` |
| 53  | CR-080                 | `088cb2c` |
| 54  | CR-081                 | `088cb2c` |
| 56  | CR-086                 | `0f61b82` |
| 57  | CR-087                 | `0f61b82` |
| 58  | CR-088                 | `0f61b82` |
| 59  | CR-089                 | `0f61b82` |
| 60  | CR-090                 | `0f61b82` |
| 62  | CR-086（vant）         | `2429b61` |
| 63  | CR-090 余项            | `2429b61` |
| 64  | CR-077①③④（antd 同源） | `2429b61` |
| 65  | CR-078④                | `2429b61` |
| 67  | CR-099（element）      | `c4b47db` |
| 68  | CR-094                 | `c4b47db` |
| 69  | CR-098                 | `c4b47db` |
| 70  | CR-100                 | `c4b47db` |
| 71  | CR-101                 | `c4b47db` |
| 75  | CR-016                 | `8f55302` |
| 72  | CR-102                 | `c4b47db` |
| 73  | CR-103                 | `c4b47db` |
| 39  | CR-106                 | `c7f85e7` |
| 40  | CR-055                 | `46d2fef` |
| 41  | CR-056                 | `46d2fef` |
| 42  | CR-057                 | `46d2fef` |
| 43  | CR-058                 | `46d2fef` |
| 44  | CR-059                 | `46d2fef` |
| 45  | CR-060                 | `46d2fef` |
| 46  | CR-061                 | `46d2fef` |

> 附：评审报告正文（CR 明细、判定证据、逐项修复记录）为仓库根目录 `CODE-REVIEW-REPORT.md`（按约定**未纳入 git**，请单独保留）。

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

## 八、复核发现的处置状态

| 类别                        | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **已修（本轮）**            | core 4 条一致性缺陷（`cc50e9e`：与浅拷贝实现相反的 JSDoc、`ensureColumnKeys` 注释不精确、`path=0` 的 falsy 守卫、`resolveFieldIdentity` 措辞）；examples 139 个 stylelint 错误与格式漂移（`05ac78c`）                                                                                                                                                                                                                                                                                                                                                                                               |
| **修复中（代理并行）**      | antd ❌「双通路重复校验」（单次输入 validator 2 次）；antd ⚠️ 机械项（过期 Changeset 文案、`@scroll` 边界句、`restoreMocks` 注释时序、四包重复死 JSDoc、`name > path` 文档化）；vant ❌2 + ⚠️（README 旧语义、重复 JSDoc 与 `hidden` 类型面不符、数组式 `props` 丢键、原生元素回退回归、`type` 泄漏、`install()` 兜底）；antdv-next ⚠️（不可达的手写 emit 兜底清单、`addIndexColumn` 文档默认值、用例标题超出断言）                                                                                                                                                                                 |
| **待 owner 决策**           | ① `AGENTS.md §3.4` 写 `Object.is`、代码实为 SameValueZero（改文档 or 改代码）；② `toPath` 对数组含 `null`/`undefined` 的不变量；③ **`<ProForm disabled>` 对字段无效（四包同构）**；④ **SearchForm 自定义查询按钮在真实浏览器可能 click+submit 双发（三包同构，现有用例因 happy-dom 假绿）**；⑤ `Column.hidden` / `Field.hidden` 的「支持 Ref/getter」承诺与公开类型 `boolean` 不一致（靠 `as any`）；⑥ 跨包漂移：antd / antdv-next 仍 attrs 优先、`container`/`hidden` 仍下发 SearchForm（CR-094/CR-098 未同步）；⑦ `element` 的 `tableProps()` 为静默快照（无告警/无兜底），是否与 antdv-next 对齐 |
| **建议不做（低危/信息性）** | `isDangerousKey` 缺 `@param/@returns` 与独立用例；浅拷贝使非数组入参由静默兜底变 `TypeError`（类型面已拦）；`fieldKey` 非对象键碰撞；`tsconfig types:["node"]` 随发布；`dispatchListeners`「其余忽略」分支无用例；`ProTable` 死可选链与不可达分支等清理项                                                                                                                                                                                                                                                                                                                                           |
