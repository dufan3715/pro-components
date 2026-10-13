# Core form/table 只读审计报告

- **仓库**：`/Users/dufan/Desktop/Code/My_project/pro-components`（Vue 3.5 + TS 5.9 + vitest 4 + happy-dom）
- **审计范围**：`packages/core/src/form/**`（useFields / useForm / useFormData / useFormRef / types / constants / index）、`packages/core/src/table/**`（useTable / useSearchFormExpand / types / index）——共 2523 行
- **未读**：`packages/core/src/shared/**`（按要求排除，仅通过运行时探针观察其行为）、UI 适配层（仅做定向 grep / 局部 20 行阅读以判定影响面）
- **约束遵守**：全程只读；仓库文件 0 改动（见 §5.4）；探针仅写在 `/private/tmp/core-audit/ftprobe`，实测后已删除
- **实测**：45 个探针用例（2 个 spec）**全部通过**（诊断型用例按"确认到的实际行为"锁定），原始输出见 §5.2

---

## 一、结论速览

| 严重级                                                | 数量   | 编号        |
| ----------------------------------------------------- | ------ | ----------- |
| ❌ 严重（功能缺陷 / 契约违背 / 崩溃）                 | **9**  | F-01 ~ F-09 |
| ⚠️ 风险（健壮性 / 静默失效 / 别名 / 内存 / 文档不符） | **19** | R-01 ~ R-19 |
| ✅ 通过（契约符合预期，含实测）                       | **16** | P-01 ~ P-16 |

**是否阻塞发版：建议阻塞（有条件）**

1. `useSearchFormExpand` 的三条缺陷 —— **F-03**（初值自动展开被任意 ≥2px 重测打回折叠）、**F-04**（旧 IntersectionObserver 的排队回调 disconnect 掉新 IO）、**F-05**（行元素"坐标链不可测"被过滤丢弃 → 折叠态显示行数超过 `minExpandRows`）—— 会同时影响四个 UI 包（core 同构 + 各包 `SearchForm.vue` 直接消费 `heightStyle`/`showExpandToggle`），属 **AGENTS §3.2 显式契约（初值自动展开 / 尺寸动态监听）的用户可见偏差**，实测可复现且无规避手段 → **建议先修 F-03/F-04/F-05 再发版**。
2. 其余 ❌（F-01/F-02/F-06/F-07/F-08/F-09）为"非法入参下的崩溃 / 静默失效 / 入参别名副作用 / 对外 API 陷阱"，正常调用路径不触发，可作为同一迭代的后续修复项，**不单独阻塞发版**。
3. 无数据损坏、无原型污染、无跨实例状态串号（唯一串号是刻意的 `searchParam` 引用共享，见 F-08 / R-02）。

---

## 二、缺陷与风险清单

> 位置均相对 `packages/core/src/`；"实测"给出探针编号，完整日志见 §5.2。

### ❌ 严重

#### F-01 `useFields`：`initFields` 含 `null`/`undefined` 项即摧毁整个字段 API

- **位置**：`form/useFields.ts:359-390`（触发点 `L382 if (Array.isArray(field.fields))`）
- **触发条件**：`initFields` 含 `null`/`undefined` 元素（如 `useForm(data, [maybeField])` 中 `maybeField` 未定义、条件数组漏过滤）
- **实测**：`FT1-B2` — `getField` / `getField(fn)` / `setField` / `deleteField` / `getParentField` **全部**抛
  `TypeError: Cannot read properties of null (reading 'fields')`；`appendField(undefined, …)` 因不遍历而不抛；`null` 项不会被清理（`fields.value[0]` 仍为 `null`）
- **最小复现**：
  ```ts
  const r = useFields([null, { path: 'a' }]);
  r.getField('a'); // TypeError: Cannot read properties of null (reading 'fields')
  r.setField('a', { label: 'X' }); // 同上
  ```
- **影响**：BFS 遍历是 `getField / setField / deleteField / appendField(path) / getParentField` 的唯一入口，一个 `null` 项使**全部字段查找与动态字段编排能力失效**，且报错点远离根因
- **建议**：`L382` 改 `Array.isArray(field?.fields)`；`L311` 构造期过滤 `null`/非对象项或 dev 告警

#### F-02 `useFields`：`initFields` 非数组时两种坏行为

- **位置**：`form/useFields.ts:311` `fields.value = [...(initFields || [])]`
- **触发条件**：误传对象/函数（`{}`、`() => {}`）→ 构造期 `TypeError: (initFields || []) is not iterable`；误传字符串 `'ab'` → **静默展开为 `['a','b']` 两个假字段**
- **实测**：`FT1-B1` — `{"{}":"TypeError: (initFields || []) is not iterable","fn":"TypeError: …","'ab'":"ok len=2 first=\"a\""}`；`0`/`''`/`false` 因 `||` 兜底为 `[]`
- **对比**：同仓 `useTable` 对 `columns`/`dataSource` 均有 `Array.isArray` 守卫（`table/useTable.ts:322,368`），`useFields` 缺同类守卫 → **同构 API 防御水位不一致**
- **建议**：`const initial = Array.isArray(initFields) ? initFields : []`，非数组时 dev 告警

#### F-03 `useSearchFormExpand`：初值自动展开后，任意一次 ≥2px 重测都会把状态打回折叠

- **位置**：`table/useSearchFormExpand.ts:300-305`（`expandStatus.value = initStatus`）被 `L388-413 watchEffect` 调用
- **触发条件**：IO 因隐藏区有初值把 `expandStatus` 置 `true` → 之后容器/行元素尺寸变化 ≥2px（窗口 resize、字段增减、textarea 自适应）或 `expand`/`layout` 变化 → `watchEffect` 重跑 → `setInitExpandStatus()` 无条件把 `expandStatus` 写回 `computedExpand.expandStatus`（默认 `false`）
- **实测**：`FT2-B3` — `{"afterInitExpand":true,"afterRemeasure":false,"ioCountNow":2}`
- **影响**：`isManualToggle` 只保护"用户手动点击"路径，**不保护自动展开路径** → 用户看到已填写的搜索条件自动展开后，窗口一抖就收起
- **建议**：把"IO 判定出的初值展开"记为一次性结果（如 `autoExpandedOnce`），重测时仅在 `isManualToggle === false && !autoExpanded` 时写回配置初值

#### F-04 `useSearchFormExpand`：旧 IntersectionObserver 的排队回调会 disconnect 掉新 IO

- **位置**：`table/useSearchFormExpand.ts:312-337`（每次 `setInitExpandStatus` 都 `disconnect()` 后 `new IntersectionObserver`）；`L331` 回调内 `intersectionObserver?.disconnect()` 操作的是**闭包变量当前指向的实例**
- **触发条件**：连续两次测量（`watchEffect` 与 formRef watch / 连续重测）→ 创建 IO#1、IO#2；IO#1 已入队回调此刻执行 → 写入基于旧 entries 的 `expandStatus`，并 disconnect 掉 IO#2
- **实测**：`FT2-B4` — `{"isNew":true,"io2DisconnectedByStaleCb":true,"expandStatus":true,"ioCount":2}`；`FT2-B3` 亦显示 IO 数量随重测线性增长
- **影响**：自动展开结果可能采信过期 entries，或新 IO 尚未回调即被断掉 → 自动展开丢失；伴随 Observer 反复创建/重建开销
- **建议**：IO 只创建一次并复用（仅 observe 新元素）；回调内用局部引用/`this` 断自己，并以 `generation` 计数丢弃过期回调

#### F-05 `useSearchFormExpand`：行元素"坐标链不可测"被过滤丢弃后继续，折叠态实际行数超过 `minExpandRows`

- **位置**：注释 `table/useSearchFormExpand.ts:140`（"无可见行或**任一元素坐标链不可测时返回 null**"）vs 实现 `L149-161`（`L149-155` 过滤丢弃 `absTop === null || offsetHeight <= 0` 的元素后继续，仅当**全部**被滤空才 `return null`）
- **触发条件**：任意一个顶层行元素 `offsetTop` 链不可测（隐藏、`display:contents`、跨 shadow/iframe 等），其余行仍可测
- **实测**：`FT2-B2`（5 行，第 2 行不可测）— `{"collapseHeight":112,"expected2Rows":72,"expectedIfNullFallback":80}`
  真实两行底应为 **72**，丢弃一行后 `boundaries[1]` 取到第 3 行底 **112** → **折叠态展示 3 行**，且未走"行高算术"兜底（80）
- **影响**：折叠行数与 `minExpandRows` 不符（多显示行）；注释与实现不符会误导后续维护
- **建议**：二选一 —— 实现改为"任一不可测即返回 null"（走算术兜底），或修正注释并接受"部分行可测"的降级语义；两种口径都应在返回值中表达"丢弃了几行"

#### F-06 `useTable`：多站点 `appendColumn`/`prependColumn` 产生**重复 key**（与注释契约不符）

- **位置**：`table/useTable.ts:614-627`；注释 `L614` 称"多位点匹配时克隆列对象并**独立生成 key**"，实现为 `normalizeColumn({ ...col }, allocateColumnKey)`，而 `normalizeColumn` **仅在 `key` 为 `undefined/null` 时分配**（`L243-262`）
- **触发条件**：`appendColumn(finder, { key: 'x', … }, { all: true })` 命中 ≥2 处且列自带 key
- **实测**：`FT2-A9` — `{"keysAfterKeyed":["a","x","b","x"],"keysAfterAuto":["a","__col_2","b","__col_1"]}`
- **影响**：违背 AGENTS §3.3"`normalizeColumn` 确保每个列具备唯一 `key`"；UI 库以 `key` 作列表 key/列管理标识会出现重复键告警或列错乱；`setColumn('x')` 亦只能命中第一个
- **建议**：多站点克隆时强制重分配（如 `normalizeColumn({ ...col, key: undefined }, allocateColumnKey)`），或改注释并明确"多站点共享 key"语义

#### F-07 `useTable.normalizeColumn`：环状 `children` 直接爆栈；不可扩展（未冻结）对象直接 TypeError

- **位置**：`table/useTable.ts:236-238`（`Object.isFrozen` 判定）、`L263-267` + `L339-343`（无环检测的递归）
- **触发条件**：① `const a = {title:'A'}; a.children = [a]`；② `Object.preventExtensions({title:'X'})`
- **实测**：`FT2-A4` — `{"preventExtensions":"TypeError: Cannot add property key, object is not extensible","cyclic":"RangeError: Maximum call stack size exceeded"}`；对照冻结对象 ✅ `{"frozen":{"copy":true,"key":"__col_1"}}`。环状用例在 `useTable({ columns: [...] })` **构造期**即抛 `RangeError`
- **影响**：非法列配置不是被拒绝而是崩溃（栈溢出），错误信息不可读
- **建议**：递归加 `WeakSet` 访问集（命中抛可读错误或跳过）；"能否写 key"的判定改用 `Object.isExtensible`（比 `isFrozen` 更准确）

#### F-08 `useFormData`：初始对象被直接 `reactive` 收编（别名副作用），同仓 `useTable` 只克隆了 `pageParam`

- **位置**：`form/useFormData.ts:136-139`, `L180-187`；对比 `table/useTable.ts:314-315`（`pageParam` 深拷贝快照）与 `L383`（`searchParam` 原样传入）；`useForm.ts:160`
- **触发条件**：把外部对象（模块常量、`props.xxx`、多处共用的默认值）传给 `useForm` / `useFormData` / `useTable({ searchParam })`
- **实测**：
  - `FT1-C1` — `useFormData(init); setFormData({c:3})` → `{"initKeys":["c"],"formKeys":["c"]}`（**"全量替换"会真实 `delete` 调用方对象上的 key**）
  - `FT1-C1b` — 同一对象喂两个实例 → `{"crossTalk":true,"sameReactive":true}`
  - `FT2-A3` — `{"searchCallerSees":"x","formSees":"from-outside"}`（`searchForm.formData` 与调用方对象双向互通）
  - `FT1-C2` — `useFormData(arrayLike)` 非 plain object 时**静默丢弃**初始数据（`{"arrInitKeys":[]}`）
- **影响**：表单写入污染外部对象；共用默认值对象产生跨实例脏数据；`pageParam` 受保护而 `searchParam` 不受保护，**同 Hook 内防御水位不一致**
- **建议**：`useFormData` 入参统一深/浅拷贝（或在 JSDoc 显式声明"按引用收编、外部变更双向可见"）；`searchParam` 复用 `_initSearchParam` 的快照思路

#### F-09 `useSearchFormExpand.cleanupObservers`：调用后 ResizeObserver 永久失明（对外 API 陷阱）

- **位置**：`table/useSearchFormExpand.ts:71-84`（未复位 `observedFormEl`/`observedItemEls`）、`L202-213`、`L345-361`
- **触发条件**：外部调用公开导出的 `cleanupObservers()` 后再测量 —— 容器观察只在 `formRef` watch 中建立（watch 因值未变不重跑），且残留的 `observedItemEls` 让 `syncObservedItems` 认为行元素"已观察"而不再 `observe`
- **实测**：`FT2-B5` — `{"observedFormBefore":true,"roCount":2,"ro2ObservedForm":false,"ro2ObservedItems":0,"ro2IsNew":true}`（新 RO 既不观察容器、也**没有**补登记行元素）
- **备注**：grep 显示仓库内除 `L87 onBeforeUnmount` 外无其他调用点，**当前发版路径不受影响**，但该函数出现在 `UseSearchFormExpandReturn` 契约中，属对外陷阱
- **建议**：`cleanupObservers` 内复位 `observedFormEl = null`、`observedItemEls = new Set()`、`measuredEl = undefined`；或不导出

### ⚠️ 风险

| 编号     | 位置                                                                                                     | 触发条件                                                                                                         | 实测证据                                                                                                                                                                       | 影响与建议                                                                                                                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R-01** | `form/useFields.ts:38-47, 313-314, 369-376`                                                              | `fieldIdentityKeys` 传空数组或键名写错（如 `['key']`）                                                           | `FT1-B4` `{"getFnAll":2,"appended":0,"deleted":2,"setFieldNoop":"A","warnCount":0}`                                                                                            | 所有字段标识解析为 `''` → `getField`/`setField`/`deleteField`/`appendField(path)` **全部静默失效且零告警**（仅函数匹配可用）。建议 dev 环境对"全部字段标识为空"告警一次                                                     |
| **R-02** | `table/useTable.ts:41, 374-381`                                                                          | 分页键自定义（`pageParam: { page, size }`）后调 `setPageParam({ page: 2 })`                                      | `FT2-A1` `customKeys` 未变                                                                                                                                                     | `pageParamProperty` 是模块私有常量，**无任何配置入口**，自定义分页键被白名单静默丢弃（AGENTS §3.3 措辞暗示可配置）。建议开放配置项，或丢弃未知键时 dev 告警                                                                 |
| **R-03** | `table/useTable.ts:390`                                                                                  | `pageParam` 出现初始快照不含的 key（`table.pageParam.x = 1`，或初始对象缺 `total` 后 `setPageParam({ total })`） | `FT2-A2` `{"pageHasResidue":true,"runtimeExtra":"RESIDUE"}` / `totalResidue:42`                                                                                                | `resetQueryParams` 是**合并写**而非替换，`pageParam` 残留运行期键；对照 `searchParam` 走 `setFormData` 是**真替换**（`searchKeys:["kw"]`）→ 同一函数内两种重置语义。接口 JSDoc 已自述"刻意设计"，仍建议"先删快照外键再合并" |
| **R-04** | `table/useTable.ts:380`（经 `shared/utils.pick`）                                                        | `setPageParam(null / undefined / () => undefined)`                                                               | `FT2-A1` `TypeError: Cannot use 'in' operator to search for 'current' in null/undefined`                                                                                       | 4 种非法入参均抛**与分页无关**的迷惑错误（函数式重载漏 `return` 是常见笔误）。建议入参守卫 + dev 告警或静默 no-op                                                                                                           |
| **R-05** | `table/useTable.ts:358-364`                                                                              | `columns.value = columns.value` / `columns.value = <非数组>`                                                     | `FT2-A5` `{"identityChanged":true,"cleared":[]}`                                                                                                                               | 自赋值经 setter 复制成**新数组**（引用变化，可能触发下游 watch/重渲染）；非数组入参**静默清空列数组**。建议加 `if (next === columnState.value) return` 与非数组告警                                                         |
| **R-06** | `table/useTable.ts:494-498`                                                                              | `setColumn(path, { children: 'oops' })`；或期望入参列对象不被改写                                                | `FT2-A8` `{"callerMutated":{"hasChildrenArr":true,"childKey":"__col_1"},"childrenErr":"TypeError: merged.children.map is not a function"}`                                     | merge 分支**就地改写调用方对象**（补 `key`、重赋 `children`）、`children` 非数组直接 `.map` 抛错、每次 merge 重建 children 数组。建议 `Array.isArray` 守卫 + 克隆后合并                                                     |
| **R-07** | `table/useTable.ts:481-490`                                                                              | rewrite 时新对象显式给 `key: '__col_999'`                                                                        | `FT2-A8` `rewriteAutoLike:"a-new"`                                                                                                                                             | 形如 `__col_` 前缀的**显式 key 被静默覆盖**为原列 key（该分支 JSDoc 完全未提"key 继承"规则）。建议在 JSDoc 标注继承条件                                                                                                     |
| **R-08** | `table/useTable.ts:403-404, 416-417`                                                                     | 列 `key` 为数字（`{ key: 0 }`）                                                                                  | `FT2-A7` `allMarked` 中 `[0,null,[]]`：`setColumn(0)` 与 `setColumn('0')` **均不命中**                                                                                         | `keyStr = String(key)` 后与原始 key 严格比较，数字 key 永不可定位（TS 层 `key?: Path<T>` 本不允许，属 JS/`any` 场景）。建议比对前统一 `String(columnItem.key)`                                                              |
| **R-09** | `form/useFields.ts:624-628`                                                                              | `appendField(finder, fieldWithChildren, { all: true })` 多站点插入                                               | `FT1-B6` `{"shareArray":true,"shareChild":true,"bidirectionalChild":"MUT"}`                                                                                                    | `{...f}` 浅拷贝使多个插入项**共享同一 `fields` 子数组与同一批子对象**，改一处另一处同步变化（顶层属性彼此独立 ✅）。建议按需深拷贝 `fields` 子树                                                                            |
| **R-10** | `form/useFields.ts:322-341, 369`                                                                         | 重复标识 + `setField(rewrite)` 改名后按名查找                                                                    | `FT1-B7` `{"dupHit":"B1","bfsFirst":"RENAMED"}`                                                                                                                                | 缓存坐标优先于 BFS 首个匹配 → 同一 API 冷/热路径可能返回不同实例（不返回脏对象，但顺序口径不一致）。建议缓存命中后仍按"最小坐标"择优，或文档禁止重复标识                                                                    |
| **R-11** | `form/useFields.ts:316, 369`                                                                             | 长生命周期动态表单持续产生新 `path`                                                                              | 静态：`_map` 仅在"回验失配"时删单条，无整体清理、无上限                                                                                                                        | `_map` 随历史标识数单调增长；已删字段的条目要到"再次以同名路径查找"才被清掉。建议 `deleteField` 时清理该子树坐标                                                                                                            |
| **R-12** | `form/useForm.ts:189-202`                                                                                | 代理创建后、`getCurrentForm()` 为空期间读方法                                                                    | `FT1-A2` `readMethod=undefined callErr=p.setFormData is not a function`                                                                                                        | 缺失实例时"读属性返回 `undefined`、调用抛 TypeError"，与 `set`/`deleteProperty` 的"静默丢弃"（`L203-215`）**容错哲学不一致**；挂载前经代理调用即崩。建议返回 no-op 包装或 dev 告警                                          |
| **R-13** | `form/useForm.ts:221-230`                                                                                | 当前实例带**不可配置**自有属性时做 `Object.keys(proxy)`/展开/JSON                                                | `FT1-A3` `TypeError:'getOwnPropertyDescriptor' on proxy: trap reported non-configurability for property 'nc' which is either non-existent or configurable in the proxy target` | 代理不变量冲突（`useForm` 返回的对象字面量属性均可配置，故当前不可达；若适配层将来用 `defineProperty(configurable:false)` 包装实例即触发）。建议 trap 内把 `configurable` 归一为 `true`                                     |
| **R-14** | `form/useFormRef.ts:8-43`（调用方 `antd-vue-pro/.../ProForm/index.vue:99,155`）                          | 组件卸载（Vue 函数式 ref 传入 `null`）                                                                           | 静态：核心无注销 API，仅靠 Vue 传 `null` 落回 `formRef.value`                                                                                                                  | 实例会被清空（无悬垂）✅，但声明的 `Ref<F \| undefined>` 实际会写入 `null`（类型失真；下游 `formRef.value.$el` 需容忍 `null`）。建议类型放宽为 `Ref<F \| null \| undefined>` 并显式定义 `setFormRef(null)` 语义             |
| **R-15** | `table/useSearchFormExpand.ts:282-287, 301, 317`                                                         | 手动展开/收起后再替换 `:form` 实例或改 `expand` 配置                                                             | `FT2-B6` `{"manual":{"status":true,"lock":true},"afterIoFire":true,"toggledTwice":false,"lockStill":true}`                                                                     | 锁定按契约生效 ✅，但 `isManualToggle` **无任何复位通道**（全文仅 `L282` 初始化与 `L285` 置位）→ 实例替换/配置变更后用户意图已失效仍被永久锁死。建议在 `formRef` 实例变化或 `expand` 变化时复位                             |
| **R-16** | `table/useSearchFormExpand.ts:289-294, 318-330`                                                          | 隐藏区初值为 `false` / `0` / `' '`                                                                               | `FT2-B7` `{"false":true,"0":true,"emptyArr":false,"emptyObj":false,"nonEmptyObj":true,"space":true,"null":false}`                                                              | `false`、`0`、`' '` 均判定"有值"→ 自动展开（布尔 `false` 筛选条件误触发）；`Date`/`File` 等无自有键对象判为"空"。建议明确空值口径并写入 JSDoc                                                                               |
| **R-17** | `table/useSearchFormExpand.ts:408-410, 416-424` + 适配层 `SearchForm.vue` 仅 grid 分支应用 `heightStyle` | `layout !== 'grid'` 时消费 `heightStyle`                                                                         | `FT2-B8` `{"inlineShowToggle":false,"inlineCurrentHeight":0}`                                                                                                                  | 非 grid 布局下 `collapseHeight` 恒为初始 `0` → `heightStyle === '0px'`（四个适配层当前只在 grid 分支应用 ✅，属**潜在**踩坑）。建议非 grid 时 `collapseHeight` 取自然高度或让 `heightStyle` 返回 `undefined`                |
| **R-18** | `table/useSearchFormExpand.ts:86-88, 345-413`                                                            | 在 setup 之外调用 Hook                                                                                           | `FT2-B9` `[Vue warn]: onBeforeUnmount is called when there is no active component instance…`；`FT2-C1` 组件内 `warnings:0` ✅                                                  | 无 `getCurrentInstance()` 守卫 → Vue 告警 + `watch/watchEffect` 无 owner 永不停止（测试/工具函数场景泄漏）。建议 setup 外降级为手动 `cleanupObservers` 模式                                                                 |
| **R-19** | `table/useSearchFormExpand.ts:367-380` vs `183-189`                                                      | 可见字段数 / `formRef` / `expand` 变化                                                                           | 静态：`watchEffect` 直连 `updateHeights()`，绕过 `measureRafId` 合帧                                                                                                           | 同帧内可能多次全量 `querySelectorAll` + 祖先链判定（`getOuterFormItemEls`）。建议统一走 `scheduleMeasure`                                                                                                                   |

### ✅ 通过（含实测）

| 编号     | 项                                                                                                                                                                                                                                                                         | 证据                                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P-01** | `createFormProxy` 方法引用恒等（`proxy.setFormData === proxy.setFormData`），且运行期替换实例后仍恒等、调用实时路由到新实例                                                                                                                                                | `FT1-A1` `{"identity":true,"routedToB":1,"liveProp":2}`                                                                                                     |
| **P-02** | 代理非函数属性**不缓存**，每次读实时取当前实例；getter 每次求值；实例替换后立即生效                                                                                                                                                                                        | `FT1-A3/A4` `{"getterCalls":2,"methodStable":true,"rerouted":2}`                                                                                            |
| **P-03** | 代理反射 traps 齐全：`Object.keys` / `in` / 展开在实例存在时正确，缺失时分别为 `[]` / `false` / `undefined`                                                                                                                                                                | `FT1-A3` `keysOk spreadOk`（不可配置属性分支见 R-13）                                                                                                       |
| **P-04** | `useFields` 路径归一：`path: 0` 可被 `getField(0)`/`getField('0')`/`appendField(0,…)` 命中；`path: ''` 不参与字符串匹配（`getField('')→undefined`、`appendField('')` 不插入）；`appendField('missing')` 静默不插入                                                         | `FT1-B3` `{"zeroGet":"零","zeroGetStr":"零","appendEmptyLen":0,"appendMissingNoop":true}`                                                                   |
| **P-05** | `useFields` 浅拷贝语义符合 JSDoc：数组级隔离（增删不污染入参数组）+ 元素级同一引用（就地变异双向可见）                                                                                                                                                                     | `FT1-B5` `{"sameRef":true,"callerSeesMerge":"A2","initLen":1,"elementsAreSame":true}`                                                                       |
| **P-06** | 嵌套删除后缓存回验有效：`deleteField('g.x')` 后 `getField('g.y')` 正确、`appendField('g.y')` 插入到正确父组                                                                                                                                                                | `FT1-B7` `{"afterNestedDelete":"Y","nestedOrder":["Y","Z"]}`                                                                                                |
| **P-07** | `setField` merge 对"旧值 ref、新值非 ref"处理正确（`toRaw` 读原值 + 先 delete 再赋值），实测替换为普通值且**无 Vue 只读 ref 赋值告警**                                                                                                                                     | `FT1-B8` `{"after":"plain","isRefLike":false,"warnMsgs":[]}`                                                                                                |
| **P-08** | `useFields` 响应式完整：push/unshift/元素属性改写/splice 删除均触发追踪（无丢失追踪、无死循环）                                                                                                                                                                            | `FT1-B10` `["a:A","a:A,b:B","a:A2,b:B","a:A2"]`                                                                                                             |
| **P-09** | 原型链污染防护有效：`__proto__.x` / `constructor.prototype.x` / `a.__proto__.x` 与批量 `__proto__` 键均未污染 `Object.prototype`                                                                                                                                           | `FT1-C3` `"polluted":{}`                                                                                                                                    |
| **P-10** | `setPageParam` 白名单严格生效：未知 key 不污染；部分更新"只写不删"；单独更新 `pageSize` 不丢 `current`/`total`                                                                                                                                                             | `FT2-A1` `{"afterUnknown":{"current":2,"pageSize":10,"total":0},"afterPartial":{"current":2,"pageSize":20,"total":0}}`                                      |
| **P-11** | `resetQueryParams` 的 `pageParam` 快照确为**构建期深拷贝**：构造后改写调用方对象（`current=777`）仍恢复为 `3`；`searchParam` 走真替换（运行期新增 key 被清除）                                                                                                             | `FT2-A2` `page.current=3, page.total=99, searchKeys=["kw"]`                                                                                                 |
| **P-12** | `useTable` 列能力：冻结列降级为解冻副本且不改原对象；`children` 空数组不递归；`ensureColumnKeys` 读取即补齐（顶层 + 子列，含删除后回填）；`deleteColumn(all)` 同组多命中不错位；`appendColumn(undefined)` 末尾/头部插入；非数组 `columns/dataSource` 回落 `[]`；响应式正常 | `FT2-A4` / `FT2-A5` `refilled:[["p",["__col_3"]],["__col_4",[]]]` / `FT2-A11` `{"afterDelete":0,"seen":[2,3]}` / `FT2-A10` `keys:["z","a","b"]` / `FT2-A12` |
| **P-13** | `useTable` 每实例独立 key 种子（闭包 `allocateColumnKey`），模块级 `fallbackColumnKeySeed` 仅在裸调 `normalizeColumn(s)` 时递增 → 实例间不串号                                                                                                                             | `FT2-A9` 每实例均从 `__col_1` 起编                                                                                                                          |
| **P-14** | `useSearchFormExpand` 测量主干正确：`scrollHeight` 取自然高度（200）、行高取首行布局盒高度（32）、`minExpandRows=2` 时折叠高度取第 2 行真实底部（72）、溢出 >1px 显示按钮、`heightStyle="72px"`；死区（<2px）不写入；`formRef` 替换重建基线并重挂 RO                       | `FT2-B1` `{"proFormHeight":200,"rowHeight":32,"collapseHeight":72,"showExpandToggle":true}` / `FT2-B11` `{"h1":120,"h2":999,"roLastObservesNew":true}`      |
| **P-15** | 组件内使用无告警；卸载时 RO/IO 均 `disconnect`（`onBeforeUnmount → cleanupObservers`）；`expand=false` 或无 `formRef` 时 `proFormHeight="unset"`、`heightStyle=undefined`（首测前不施加高度约束）                                                                          | `FT2-C1` `{"warnings":0,"roDisconnected":true,"ioDisconnected":true}` / `FT2-B10` `{"proFormHeight":"unset","currentHeight":"unset"}`                       |
| **P-16** | 组件上下文中 `useFormData()`（无参）确实复用父级注入的数据 store；`useForm(false)` 在无 ProForm 祖先时告警并回退独立根表单（不与父共享数据、父数据不受影响）                                                                                                               | `FT1-D1` `{"directUseFormDataShared":true,"childSharedData":false,"parentA":1,"childA":2}`                                                                  |

---

## 三、逐文件核查（静态阅读 + 实测定位）

### 3.1 `form/useFields.ts`（650 行）

| #   | 项                                                       | 结论                                                                                                           | 位置               |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | `initFields` 为 `undefined`/`null`/`[]`/`0`/`''`/`false` | ✅ 均得到空 fields（`\|\|` 兜底）                                                                              | L311               |
| 2   | `initFields` 非数组（对象/函数/字符串）                  | ❌ F-02                                                                                                        | L311               |
| 3   | `initFields` 含 `null`/`undefined`/原始值项              | ❌ F-01（`null` 摧毁全部查找 API；原始值不抛但产生无标识字段）                                                 | L359-390           |
| 4   | `path: ''`                                               | ⚠️ 不参与字符串匹配、不登记缓存；`getField('')` 恒 `undefined`（doc 仅在 appendField/prependField 声明该口径） | L44-46, L369-376   |
| 5   | `path: 0`                                                | ✅ 经 `normalizePathKey` 归一为 `'0'`，数字/字符串入参均命中                                                   | L44, L349          |
| 6   | 重复 `path`                                              | ⚠️ R-10（首个命中；缓存与 BFS 在改名后口径可能不一致）                                                         | L322-341, L369     |
| 7   | 嵌套同名                                                 | ✅ BFS 覆盖任意深度，坐标 `[i,'fields',j,…]` 与 `cacheMatch` 的 `slice(0,-2)` 一致                             | L359-391           |
| 8   | `fieldIdentityKeys` 全空/全不匹配                        | ⚠️ R-01（静默失能、零告警）                                                                                    | L38-47, L313-314   |
| 9   | `appendField`/`prependField` 无匹配分组                  | ⚠️ 静默不插入（无返回值/无告警）；`path` 未传 → 末尾/开头插入 ✅                                               | L605-635           |
| 10  | `appendField`/`prependField` 的 `path: 0`/`''`           | ✅ `0` 命中 `path:0` 字段后插入；`''` 零命中不插入                                                             | L612-629           |
| 11  | `deleteField` 无匹配 / 多命中                            | ✅ 无匹配空转；多命中经 `applyByGroupDesc` 组内降序 splice，无索引错位                                         | L504-518           |
| 12  | 浅拷贝改造后元素级就地变异                               | ⚠️ R-09（数组级隔离 ✅、元素级共享为设计使然、多站点克隆共享子对象）                                           | L311, L624-628     |
| 13  | `getField`/`setField` 缓存路径脏数据                     | ✅ 命中前回验标识一致，失配即删条目回退 BFS，**不返回过期对象**；但 `_map` 无上限（R-11）                      | L322-341           |
| 14  | `setField` 更新函数返回 falsy                            | ⚠️ `if (!value) return` 静默跳过（doc 只写 `null`/`undefined`）                                                | L458               |
| 15  | `setField` merge 覆盖只读 ref                            | ✅ P-07                                                                                                        | L462-476           |
| 16  | `getField` 返回活引用 / `all` 语义                       | ✅ `all:true` 无匹配返回 `[]`、单数无匹配 `undefined`；`getParentField` 顶层返回虚拟根容器                     | L400-414, L589-603 |

### 3.2 `table/useTable.ts`（654 行）

| #   | 项                                             | 结论                                                                                                                                                                          | 位置               |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | `setPageParam` 白名单浅拷贝                    | ✅ P-10；配置面缺口见 R-02、非法入参见 R-04                                                                                                                                   | L41, L374-381      |
| 2   | 自定义 `pageParamProperty`                     | ❌ R-02：**不存在配置入口**（模块私有常量），自定义分页键被静默丢弃                                                                                                           | L41, L380          |
| 3   | `resetQueryParams` 深拷贝快照                  | ✅ P-11（快照独立性 + 自定义键恢复 + 恢复结果与快照互相独立）                                                                                                                 | L314-315, L385-392 |
| 4   | `resetQueryParams` 重置语义                    | ⚠️ R-03（合并写残留）                                                                                                                                                         | L390               |
| 5   | `normalizeColumn(s)` 唯一 key                  | ✅ 兜底链 `key→dataIndex→prop→columnKey→__col_N`；❌ F-06（多站点克隆不重分配）；❌ F-07（环状/不可扩展）                                                                     | L230-292           |
| 6   | 元素级变异后读取即补齐                         | ✅ P-12（含 children 递归；一次 effect 内收敛、无死循环）                                                                                                                     | L331-365           |
| 7   | `ensureColumnKeys` children 分支               | ✅ 父列有 key 时递归子列；父列缺 key 时由 `normalizeColumn` 递归兜住，行为等价（子列 key 先于后续同级分配，仅顺序差异，无正确性影响）                                         | L331-346           |
| 8   | `children` 空数组 / 自引用 / 冻结 / 响应式代理 | ✅ 空数组跳过；❌ F-07 自引用爆栈；✅ 冻结降级副本；✅ `reactive(冻结对象)` 仍命中 `Object.isFrozen`（Vue 对不可扩展对象不建代理）                                            | L236-267           |
| 9   | `setColumn` merge / rewrite                    | ⚠️ R-06（就地改写入参、`children` 非数组抛错）、R-07（`__col_` 显式 key 被覆盖）；rewrite 继承原 key ✅                                                                       | L469-504           |
| 10  | `appendColumn`/`prependColumn`                 | ✅ 单站点保持原引用并就地补 key、未传 path 时末尾/开头插入、空数组不插入；❌ F-06 多站点重复 key；⚠️ 调用方对象被就地补 `key`（`FT2-A10` `callerObjectMutatedKey:"__col_1"`） | L598-638           |
| 11  | `deleteColumn` 多站点                          | ✅ 组内降序 splice（`FT2-A11` `afterDelete:0`）                                                                                                                               | L522-538           |
| 12  | `updaterMatch` 键比对                          | ✅ 空串 key 可命中（与 useFields 不同，doc 已声明）；⚠️ R-08 数字 key 不可命中；`all` 默认值按定位方式区分 ✅                                                                 | L394-447           |
| 13  | 分页键全链路一致性                             | ⚠️ 见 R-02/R-03；**`packages/core/src/table` 内不存在 `getIndex`**（grep 确认序号能力在三个适配层 `ProTable.vue`），core 侧无可核查实现                                       | —                  |
| 14  | `columns`/`dataSource` 入参防御                | ✅ 非数组回落 `[]`（`FT2-A12`）；⚠️ 运行期 `columns.value = <非数组>` 静默清空（R-05）                                                                                        | L322, L360, L368   |
| 15  | `pageParam`/`searchParam` 入参别名             | ✅ `pageParam` 浅拷贝不污染入参（`FT2-A3` `pageCallerMutated:1`）；❌ `searchParam` 原样收编（F-08）                                                                          | L372, L383         |

### 3.3 `form/useForm.ts`（234 行）

| #   | 项                                            | 结论                                                                                                                                                                                                            | 位置     |
| --- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | `createFormProxy` 方法记忆化 + 动态路由       | ✅ P-01/P-02                                                                                                                                                                                                    | L182-202 |
| 2   | 实例缺失时读/写/删                            | ⚠️ R-12（读返回 `undefined`；`set`/`deleteProperty` 静默丢弃）                                                                                                                                                  | L189-215 |
| 3   | 反射 traps                                    | ✅ P-03；⚠️ R-13（不可配置属性不变量）                                                                                                                                                                          | L216-230 |
| 4   | `methodCache` 增长边界                        | ✅ 键为属性名，条目数受"被访问过的属性名"上界约束（非用户数据驱动），无泄漏                                                                                                                                     | L182     |
| 5   | `useForm` 重载分派                            | ✅ 按 `args.length` + 首参 `boolean` 分派；`null`/`0` 经 `?? {}` 与 `isPlainObject` 双重兜底                                                                                                                    | L128-148 |
| 6   | `root=false` 降级                             | ⚠️ 无注入时 `console.warn`（无去重，每次调用打印）+ 回退独立根表单；`FT1-D1` 实测同时出现 Vue `injection "Symbol(form)" not found` 与自身告警两条                                                               | L149-158 |
| 7   | WeakMap / `formKey` 契约（AGENTS §3.1、§3.5） | ⛔ **不在本次范围**：grep 确认 `WeakMap`/`formKey` 在 `packages/core/src` 内**零出现**，实现位于三个适配层 `ProForm/index.vue`（`getFormKey` + `:key="formKey"`）；字段实例 WeakMap 注册在适配层 `BaseFormItem` | —        |

### 3.4 `form/useFormData.ts`（200 行）

| #   | 项                       | 结论                                                                                                                                                                                                                                                                                                                                                                                       | 位置               |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| 1   | 初始数据收编方式         | ❌ F-08（`reactive(initialObject)` 直接代理入参对象，批量覆盖会 `delete` 调用方 key；非 plain object 静默丢弃）                                                                                                                                                                                                                                                                            | L136-139, L180-187 |
| 2   | 批量覆盖语义             | ✅ 全量替换（删除新对象不含的自有 key 后 `Object.assign`），`formData` 引用保持不变                                                                                                                                                                                                                                                                                                        | L180-187           |
| 3   | 危险键过滤               | ✅ P-09（批量入口 `isDangerousKey` + 路径写入侧守卫）                                                                                                                                                                                                                                                                                                                                      | L175-179           |
| 4   | 单参非对象 / `null` 批量 | ⚠️ 静默 `return`（`FT1-C2`）                                                                                                                                                                                                                                                                                                                                                               | L174               |
| 5   | 子表单数据注入           | ⚠️ 仅 `initFormData === undefined` 且在组件上下文才 inject；`useForm(false)` 因 `L132` 把 `initFormData` 兜底成 `{}` 而**永不**走 inject（`FT1-D1` `directUseFormDataShared:true` vs `childSharedData:false`）。真实 ProForm 子树中 `inject(InjectionFormKey)` 会整体返回父实例（早退），故仅"无 ProForm 祖先"的回退路径表现为不复用数据 —— 与 L130 注释"子表单默认与父共享数据"口径不一致 | L130-134           |
| 6   | 路径读写                 | ✅ `getFormData(null/undefined) → undefined`；路径函数式更新、批量函数式更新语义符合 JSDoc                                                                                                                                                                                                                                                                                                 | L141-189           |

### 3.5 `form/useFormRef.ts`（45 行）

| #   | 项                            | 结论                                                                                                                                                                                          | 位置     |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | 注册/注销对称性               | ⚠️ R-14：核心只有 `setFormRef(inst)`，无注销 API；实际由适配层 `:ref="setFormRef"` 在卸载时收到 Vue 传入的 `null` 而清空（无悬垂实例），但类型 `Ref<F \| undefined>` 与实际可能为 `null` 不符 | L8-43    |
| 2   | 与 `useSearchFormExpand` 联动 | ✅ 卸载时 `formRef.value = null` → watch 走 `(null)?.$el === undefined` 分支，`observedFormEl` 复位为 `undefined` 并断开 RO；随后 `onBeforeUnmount` 再兜底 `cleanupObservers()`               | L345-361 |

### 3.6 `table/useSearchFormExpand.ts`（442 行）

| #   | 项                                    | 结论                                                                                                                                                                                     | 位置                 |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | `scrollHeight` 测量 + 死区            | ✅ P-14（`>0` 且与上次写入差 ≥2px 才写）                                                                                                                                                 | L246-259             |
| 2   | RO 驱动 + 观察集合同步                | ✅ 容器与行元素共用 RO、增量 observe/unobserve；❌ F-09（`cleanupObservers` 后残留集合导致新 RO 全空）                                                                                   | L191-213             |
| 3   | `isManualToggle` 锁定                 | ✅ 置位后 IO 回调/初值写入均早退（`FT2-B6` `afterIoFire` 保持手动值）；⚠️ R-15 无复位通道                                                                                                | L282-287, L301, L317 |
| 4   | 初值自动展开四者时序                  | ❌ F-03（重测打回折叠）、❌ F-04（旧 IO 断新 IO + 每次重建）；快速连续切换本身安全（`FT2-B6` `toggledTwice:false`）                                                                      | L300-337, L388-413   |
| 5   | 注释"任一元素坐标链不可测时返回 null" | ❌ F-05（实现为过滤丢弃后继续，折叠行数随之偏移）                                                                                                                                        | L140 vs L149-161     |
| 6   | Observer 未 disconnect / 卸载后回调   | ✅ 卸载路径 `onBeforeUnmount → cleanupObservers` 断开两者并 `cancelAnimationFrame`；`FT2-C1` 实测 `roDisconnected`/`ioDisconnected` 均 true。IO 回调自身 disconnect 存在跨代竞态（F-04） | L71-88, L331         |
| 7   | 重复初始化 / 同帧多测                 | ⚠️ R-19（`watchEffect` 直连 `updateHeights`，绕过 rAF 合帧）                                                                                                                             | L367-380             |
| 8   | setup 外调用                          | ⚠️ R-18                                                                                                                                                                                  | L86-88, L345-413     |
| 9   | 行高/折叠高度公式                     | ✅ `min(第 minExpandRows 行底, 自然高)`；行数不足时退化为自然高度（按钮不显示）；`FT2-B1` 72 = 第 2 行底                                                                                 | L232-244, L393-404   |
| 10  | 非 grid 布局                          | ⚠️ R-17（`heightStyle` 可算出 `0px`；四个适配层当前只在 grid 分支应用 → 潜在风险）                                                                                                       | L408-424             |
| 11  | `hasFieldValue` 判定                  | ⚠️ R-16                                                                                                                                                                                  | L289-294             |
| 12  | `formRef` 替换重建基线                | ✅ P-14（`measuredEl` 变化清空三个 `lastApplied*`，强制重写）                                                                                                                            | L221-226             |

### 3.7 响应式与生命周期 / 内存（核查清单第 5、6 项）

| 项                                                | 结论                                                                                                                                                                       | 证据                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `fields` 增删改追踪                               | ✅ 全路径触发，无丢失追踪、无 effect 死循环                                                                                                                                | `FT1-B10`                                   |
| `columns` 增删改追踪 + 读取补齐不产生额外渲染轮次 | ✅ 4 次变更 4 次追踪；补齐写入在 `watchEffect` 中收敛（`runs:1`）                                                                                                          | `FT2-A6`, `FT2-A11`                         |
| `dataSource` 追踪                                 | ✅ 普通 `ref([...])`（深响应式），赋值/元素改写均可追踪                                                                                                                    | 静态 `L368-370`                             |
| setup 外调用降级                                  | ✅ `useFormData` 不 inject/provide、零告警（`FT1-C4`）；⚠️ `useForm(root=false)` 告警 + 回退（`FT1-D1`）；⚠️ `useSearchFormExpand` Vue 告警 + 无 owner watcher（`FT2-B9`） | `FT1-C4`, `FT1-D1`, `FT2-B9`                |
| `useFormRef` 注册/注销成对                        | ⚠️ R-14（核心无注销；依赖 Vue 函数式 ref 传 `null`）                                                                                                                       | `antd-vue-pro/.../ProForm/index.vue:99,155` |
| `createFormProxy.methodCache`（Map，非 WeakMap）  | ✅ 有界（按被访问属性名）；每次访问仍实时取实例做函数性判定，缓存只影响"包装函数引用"                                                                                      | `FT1-A1/A2/A4`                              |
| `useFields._map`（Map）                           | ⚠️ R-11 无整体清理/无上限                                                                                                                                                  | `L316, L369`                                |
| `fallbackColumnKeySeed`（模块级自增）             | ✅ 仅在裸调 `normalizeColumn(s)` 时递增；`useTable` 实例各持闭包种子，**无跨实例串号**                                                                                     | `FT2-A4/A9`                                 |
| 告警去重集合的隔离/增长边界                       | ⛔ 不在本次范围：去重逻辑位于 `shared/path`；`form/**`、`table/**` 内**不存在**告警集合（R-01 的静默失效正源于此处无告警）                                                 | grep + `FT1-B4 warnCount:0`                 |
| WeakMap 缓存                                      | ⛔ 不在本次范围：`packages/core/src` 内零 `WeakMap`（AGENTS §3.5 的字段实例 WeakMap 在适配层）                                                                             | grep                                        |

---

## 四、未完成项

1. **适配层联动未逐行审计**（按要求只读 form/table）：`ProForm` 的 `getFormKey`/WeakMap 重挂载契约、`BaseFormItem` 的字段实例 WeakMap、`SearchForm` 的 `heightStyle` 应用条件、`ProTable` 的 `getIndex` 序号与 `pageParam` 对接 —— 仅做定向 grep + 局部 20 行阅读用于判定影响面。**R-02（自定义分页键）与 F-06（重复列 key）的实际业务影响需结合 `ProTable` 用法确认。**
2. **`shared/**` 未读**：`normalizePathKey` 的收窄语法、`pick`/`cloneDeep`/`isPlainObject`/`applyByGroupDesc`的实现细节通过探针间接确认（如`pick(null)`因`in` 运算符抛错 → R-04），未做源码级复核。
3. **未做真实浏览器布局验证**：`useSearchFormExpand` 的测量在 happy-dom + 假 Observer 替身下完成（`offsetTop`/`offsetHeight`/`scrollHeight` 为人工注入），真实浏览器的 `position:relative` 栅格列、`display:contents`、缩放祖先等场景未覆盖；**F-05 的"行数偏移"在真实 DOM 下的复现概率需浏览器验证**。
4. **未做性能基准**：R-19 的重复 `querySelectorAll`、F-04 的 Observer 重建开销仅静态判断，未量化（仓库具备 vitest bench 能力，未使用）。
5. **未核对 Git 历史 / Changeset**：无法判定 F-03/F-04/F-05 是"新引入回归"还是"长期存在"，故"阻塞发版"结论基于影响面而非回归判定。
6. **未覆盖 TS 类型层**：未运行 `vue-tsc --noEmit`（只读审计 + 耗时考虑），R-14（`Ref<F|undefined>` 写入 `null`）、R-08（数字列 key）等类型契约问题仅静态判断。

---

## 五、实测记录

### 5.1 探针与运行方式（已删除，仅留档）

- 探针：`/private/tmp/core-audit/ftprobe/__tests__/ft1-form.spec.ts`（form 层 25 例）、`ft2-table.spec.ts`（table + expand 层 20 例）
- 配置：`/private/tmp/core-audit/vitest.ft.config.ts`（`root=packages/core`、`environment=happy-dom`、`dir=/private/tmp/core-audit/ftprobe`）
- 运行：`cd packages/core && ./node_modules/.bin/vitest run --config /private/tmp/core-audit/vitest.ft.config.ts --reporter=verbose`
- 结果：`Test Files 2 passed (2) / Tests 45 passed (45)`，`exit=0`
- 替身：`FakeRO`（记录 `observed` 集合与 `disconnect` 状态）、`FakeIO`（保留实例、可手动 `fire(entries)` 制造"旧回调晚到"）、受控 `requestAnimationFrame` 队列（`flushRaf()` 手动推进）
- 说明：诊断型用例（F-01/F-03/F-04/F-05/F-06/F-08 等）按**实测确认到的缺陷行为**断言，故全绿；`JSON.stringify` 会丢弃 `undefined` 值键，正文已按原始语义补齐

### 5.2 关键原始输出（全部 45 条）

```
[FT1-A1] identity=true routedToB=1 liveProp=2
[FT1-A2] readMethod=undefined callErr=p.setFormData is not a function
[FT1-A3] keysOk spreadOk nonConfigurableInvariantErr=TypeError:'getOwnPropertyDescriptor' on proxy: trap reported non-configurability for property 'nc' which is either non-existent or configurable in the proxy target
[FT1-A4] getterCalls=2 methodStable=true rerouted=2
[FT1-A5] a=2 label=A2 formDataSame=true
[FT1-B1] {"0":"ok len=0 first=undefined","{}":"TypeError: (initFields || []) is not iterable","fn":"TypeError: (initFields || []) is not iterable","'ab'":"ok len=2 first=\"a\"","''":"ok len=0 first=undefined","false":"ok len=0 first=undefined"}
[FT1-B2] {"getField":"TypeError: Cannot read properties of null (reading 'fields')","getField(fn)":"TypeError: Cannot read properties of null (reading 'fields')","setField":"TypeError: Cannot read properties of null (reading 'fields')","deleteField":"TypeError: Cannot read properties of null (reading 'fields')","getParentField":"TypeError: Cannot read properties of null (reading 'fields')","appendField":"no-throw"}
[FT1-B3] {"zeroGet":"零","zeroGetStr":"零","dupGet":"A","dupAll":["A","A2"],"appendEmptyLen":0,"afterZeroOrder":["空","零",null,"A","A2"],"afterDeleteA":["空","零",null,"A2"],"appendMissingNoop":true}
[FT1-B4] {"getFnAll":2,"appended":0,"deleted":2,"setFieldNoop":"A","warnCount":0,"warnMsgs":[]}
[FT1-B5] {"sameRef":true,"callerSeesMerge":"A2","initLen":1,"elementsAreSame":true}
[FT1-B6] {"order":["A","X","B","X"],"shareArray":true,"shareChild":true,"bidirectionalChild":"MUT","bidirectionalArrayLen":2,"topLevelIsolated":true}
[FT1-B7] {"afterNestedDelete":"Y","nestedOrder":["Y","Z"],"dupHit":"B1","bfsFirst":"RENAMED","delTarget":["RENAMED"]}
[FT1-B8] {"beforeReadIsRef":"v0","after":"plain","isRefLike":false,"warnMsgs":[]}
[FT1-B9] {"labelAfterFalsy":"A","allHidden":true,"afterRewrite":"REWRITTEN"}
[FT1-B10] ["a:A","a:A,b:B","a:A2,b:B","a:A2"]
[FT1-B11] {"liveMutated":"MUT","allEmpty":[],"parentOfRoot":1,"parentVoid":true}
[FT1-C1] {"initKeys":["c"],"formKeys":["c"]}
[FT1-C1b] {"crossTalk":true,"sameReactive":true}
[FT1-C2] {"arrInitKeys":[],"afterNoops":["a"]}
[FT1-C3] {"probes":[["path __proto__.p1","no-throw"],["path constructor.prototype.p2","no-throw"],["path a.__proto__.p3","no-throw"],["batch proto key","no-throw"]],"polluted":{},"formKeys":["ok"]}
[FT1-C4] {"keys":["a"],"undefinedInitKeys":[],"warns":0}
[FT2-A1] {"afterUnknown":{"current":2,"pageSize":10,"total":0},"afterPartial":{"current":2,"pageSize":20,"total":0},"customKeys":{"page":1,"size":10,"current":1,"pageSize":10,"total":0},"errs":{"null":"TypeError: Cannot use 'in' operator to search for 'current' in null","undefined":"TypeError: Cannot use 'in' operator to search for 'current' in undefined","fn->undefined":"TypeError: Cannot use 'in' operator to search for 'current' in undefined","fn->null":"TypeError: Cannot use 'in' operator to search for 'current' in null"}}
[FT2-A2] {"afterReset":{"page":{"current":3,"pageSize":30,"total":99,"runtimeExtra":"RESIDUE"},"search":{"kw":"k0"},"searchKeys":["kw"],"pageHasResidue":true},"totalResidue":42,"initPageNow":{"current":777,"pageSize":30,"total":99},"initSearchNow":{"kw":"k0"}}
[FT2-A3] {"pageCallerMutated":1,"searchCallerSees":"x","formSees":"from-outside"}
[FT2-A4] {"frozen":{"copy":true,"key":"__col_1"},"frozenChildren":{"parentKey":"__col_2","childKey":"__col_3"},"preventExtensions":"TypeError: Cannot add property key, object is not extensible","cyclic":"RangeError: Maximum call stack size exceeded","autoKeys":["__col_6","__col_7"],"nonArray":[],"nonObjectItem":1}
[FT2-A5] {"keysInit":[["p",["__col_1"]],["__col_2",[]]],"refilled":[["p",["__col_3"]],["__col_4",[]]],"identityChanged":true,"cleared":[]}
[FT2-A6] {"runs":1,"seen":[["__col_1"]]}
[FT2-A7] {"emptyMarked":1,"allMarked":[["",1,[]],[0,null,[]],["g",true,[true]]]}
[FT2-A8] {"callerMutated":{"hasChildrenArr":true,"childKey":"__col_1"},"childrenErr":"TypeError: merged.children.map is not a function","rewriteInherits":"a","rewriteExplicit":"a-new","rewriteAutoLike":"a-new"}
[FT2-A9] {"keysAfterKeyed":["a","x","b","x"],"keysAfterAuto":["a","__col_2","b","__col_1"],"sameChildrenArray":false,"sameChildObject":true}
[FT2-A10] {"keys":["z","a","b"],"callerObjectMutatedKey":"__col_1"}
[FT2-A11] {"afterDelete":0,"seen":[2,3]}
[FT2-A12] {"columns":[],"dataSource":[],"defaults":{"current":1,"pageSize":10,"total":0},"searchKeys":[]}
[FT2-B1] {"proFormHeight":200,"rowHeight":32,"showExpandToggle":true,"collapseHeight":72,"currentHeight":72,"heightStyle":"72px","roCount":1,"roObservedForm":6,"warns":["[Vue warn]: onBeforeUnmount is called when there is no activ"]}
[FT2-B2] {"rowBoundaries":32,"collapseHeight":112,"expected2Rows":72,"expectedIfNullFallback":80}
[FT2-B3] {"afterInitExpand":true,"afterRemeasure":false,"ioCountAfterInit":1,"ioCountNow":2,"ioDisconnected":true}
[FT2-B4] {"isNew":true,"io2DisconnectedByStaleCb":true,"expandStatus":true,"ioCount":2}
[FT2-B5] {"observedFormBefore":true,"roCount":2,"ro2ObservedForm":false,"ro2ObservedItems":0,"ro2IsNew":true}
[FT2-B6] {"manual":{"status":true,"lock":true},"afterIoFire":true,"toggledTwice":false,"lockStill":true}
[FT2-B7] {"0":true,"false":true,"emptyArr":false,"emptyObj":false,"nonEmptyObj":true,"space":true,"null":false}
[FT2-B8] {"before":{"status":true,"height":200},"inlineShowToggle":false,"inlineCurrentHeight":0}
[FT2-B9] {"warnCount":1,"msgs":["[Vue warn]: onBeforeUnmount is called when there is no active component instance to be ass"]}
[FT2-B10] {"proFormHeight":"unset","showToggle":false,"currentHeight":"unset"}
[FT2-B11] {"h1":120,"h2":999,"roCount":2,"roLastObservesNew":true}
[FT1-D1] {"childIsParent":false,"directUseFormDataShared":true,"childSharedData":false,"parentA":1,"childA":2,"warns":["[Vue warn]: injection \"Symbol(form)\" not found.","[useForm] root=false 但未找到注入的父表单实例（当前不在 ProForm 组件上下文中），已回退为创建独立根表单。"]}
[FT2-C1] {"roObserved":2,"ioCount":0,"warnings":0,"roDisconnected":true,"ioDisconnected":true}
```

### 5.3 探针自查（初版误判，已修正，供复核者参考）

- 初版 `formEl.offsetTop=100` 而行元素 `offsetTop` 从 0 起 → 相对坐标全为负 → `measureRowBoundaries` 走 `null` 兜底（`collapseHeight=80`），一度误判为 F-05；改为共享坐标系后 `collapseHeight=72`（P-14），F-05 才在"部分行可测"场景下正确复现（112）。
- 元素引用比较需用 `toRaw()`（`ref` 深响应式下 `fields.value[i]` 是代理，`=== raw` 恒 false）；`prependField` 后原元素索引会位移。
- `FT2-B6` 中手动 `changeExpandStatus()` 先把状态置 `true`，故"IO 回调不得改写"的正确期望是 `true`（而非 `false`）。

### 5.4 仓库残留检查（重要：工作区非干净，但与本审计无关）

- 已删除本次探针：`/private/tmp/core-audit/ftprobe/`、`/private/tmp/core-audit/vitest.ft.config.ts`、`/private/tmp/core-audit/ft-run{1,2,3}.txt`（删除前逐个核对路径存在且为本会话所建）
- **本审计零写入**：`git status --porcelain -- packages/core/src/form packages/core/src/table/useTable.ts packages/core/src/table/useSearchFormExpand.ts` 为空 → **被审计的 6 个源文件全部为 HEAD 原样**，全部结论对应当前 HEAD 版本
- **工作区存在 8 处并发改动（非本会话产生）**，由同一批次其他 agent 并行修改（mtime 08:53:45 与 09:08:55–09:09:33；本会话探针运行于 09:04–09:08）：
  `M .changeset/review-top10-fixes.md`、`M packages/core/__tests__/locale.spec.ts`、`M packages/core/__tests__/utils.spec.ts`、`M packages/core/src/locale/index.ts`、`M packages/core/src/shared/path.ts`、`M packages/core/src/shared/utils/index.ts`、`M packages/core/src/table/index.ts`（新增 `type UseSearchFormExpandReturn` 导出）、`?? .changeset/fix-core-public-type-face.md`
  → 本会话**未执行任何 git 写操作**，未修改、未新增、未删除任何仓库文件
- **对证据有效性的影响评估**：`packages/core/src/shared/utils/index.ts` 于 09:09:31 新增 `pick` 的危险键跳过（`if (isDangerousKey(key)) continue`），`key in object` 一行未动 → R-04 的 `pick(null/undefined)` 抛错结论不受影响；`shared/path.ts`（08:53:45，本会话开始前）改动 1 行，P-09 原型污染防护在 09:04 实测无污染，结论同样成立。`table/index.ts` 的并发改动为纯类型导出，不影响任何运行时结论。
- 复核提示：如需完全可复现，请在并发改动收敛后用同一探针套件重跑（探针代码已在 §5.1 描述、断言口径已在正文给出）。
