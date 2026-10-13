# packages/core/src/shared 只读审计报告

- 状态：**已完成（§0–§9 全部落盘，探针已删除，仓库无残留改动）**
- 审计对象（工作区当前版本，含未提交改动）：
  - `packages/core/src/shared/path.ts` sha256 `13aa5b77a528d1f573a1f0ed211951a74ee494eb8849ae1c8e983eb92420e8d3`
  - `packages/core/src/shared/utils/index.ts` sha256 `388eccb289d030ee9cd63a5a20cd8795a756cf905f2afe166cffbe1dd40f1a8b`
  - `packages/core/src/locale/index.ts` sha256 `f2edd1e85fa806d08c4ea1f0236fe3edd77eae86de922cbf438698bb597ad2d9`
  - `packages/core/src/locale/zh-CN.ts` sha256 `ca864808e7882a9db933692755fa2162ea9d6ca5437d7df1ee10034c63fb407f`
  - 相关用例：`packages/core/__tests__/{path,utils,locale,index,regressions}.spec.ts`
- 只读约束遵守：未修改仓库任何文件、未执行 git 写操作（仅 `git status/log` 只读查询）；探针全部写在 `/tmp/core-audit/`，`packages/core/node_modules` 仅以符号链接方式接入探针目录（不改动内容）。
- 实测环境：`tsx` 探针 `node v22.21.1`（含 `structuredClone`）；`vitest 4.1.11` + happy-dom 跑仓内套件。
- 基线：`pnpm --filter @qin-ui/pro-components-core test` → **11 文件 / 215 用例全绿**（说明下列发现均未被现有用例覆盖）。

## 0. 结论速览

| 级别         | 数量   | 说明                                                                                                                                                     |
| ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ❌ 明确缺陷  | **4**  | D1 数字/布尔路径读写行为错误；D2 `format` 占位符走原型链；D3 `pick` 使结果对象原型被源数据替换；D4 `cloneDeep` 兜底告警误报原因、并静默返回原引用        |
| ⚠️ 风险/缺口 | **19** | W1–W17（抛错型边界、语法检测缺口、判定过宽、文档与测试锁定缺口等）+ P1/P2（性能观察项）                                                                  |
| ✅ 实测通过  | **15** | 收窄语法与 lodash 对拍、告警去重与有界、SameValueZero、原型污染不可达、缓存冻结与驱逐、structuredClone 优先、降级告警一次性、循环引用、语言包 key 对齐等 |

**是否阻塞发版：不阻塞。** 4 个 ❌ 均为边界/防御性缺陷，正常业务路径（`get/set` 字符串或段数组路径、语言包既有文案、`pick` 传入对象、`cloneDeep` 传 JSON 型数据）不可达或影响有限；core 现有 215 用例全绿、类型面未受影响。建议 D2/D3/D4 + D1（3 行守卫）随下一个小版本一并修，成本极低。

最严重 3 条（详见 §7）：

1. **D1 `get`/`set` 数字或布尔路径**：`get({a:1}, 0)` 返回**整个对象**；`set({}, 0, 'v')` 写入键名 `"undefined"`（path.ts:149/154-162、191-210，实测 `shared-probe-path2.log` 1.1–1.8）。TS 签名已排除裸数字，但 JS/无类型配置可达。
2. **D2 `format` 占位符走原型链**：`format('{toString} {constructor}', {})` → `'function toString() { [native code] } function Object() { [native code] }'`（locale/index.ts:82-84，实测 `shared-probe-locale.log` 1.1/1.2），“缺参保留 `{key}`”的文档承诺对继承键失效。
3. **D3 `pick` 无危险键防护**：源对象含自有 `__proto__` 键时，返回对象的 `[[Prototype]]` 被替换为源数据（`pick(JSON.parse('{"__proto__":{"polluted":"yes"},"ok":1}'), ['__proto__','ok']).polluted === 'yes'`），lodash 4.17.21 因 `_baseSet.js:32` 守卫不受影响（utils/index.ts:84，实测 `shared-probe-utils.log` 2.9–2.11）；同文件 `camelizeProperties` 走 `Object.fromEntries` 则安全。

## 1. path.ts 核查（逐条：结论 + 行号 + 证据）

### 1.1 收窄语法与非法语法告警

✅ **合法语料与 lodash 全等**：`path.spec.ts:31-96` 对 `user.profile.hobbies[0]`、`user.tags.1.id`、`list.2` 等点分/数字段/简单括号语料做 `get/set/toPath/normalizePathKey` 四路对拍；本次实测额外覆盖 `'[0]'`→`['0']`、`'a[0][1]'`→`['a','0','1']`、`'a[b].c'`→`['a','b','c']`、`'a[0]b'`→`['a','0','b']`（与 lodash 一致），见 `shared-probe-path2.log` 3.x。

✅ **告警只出一次（去重集合跨 API 共享，非仅 dev 分支）**：`warnInvalid` 先查 `warnedPaths`（path.ts:37-46），实测量化：同一非法路径先 `get` 两次、再 `toPath`/`normalizePathKey`/`set` 各一次 → 共 **1 条**告警（`shared-probe-path.log` D1）；`.a`/`a.`/`a..b`/`a[]`/`a[b`/`a["x"]` 六类非法语料各触发 1 条且文案带具体原因（D2–D7）。仓内用例 `path.spec.ts:99-111` 亦断言重复调用仅 1 次。

✅ **去重集合有界**：容量 5000，超限时 `evictOldestBatch` 按插入序（FIFO）逐出 10%（path.ts:21-35,39-41）；`path.spec.ts:113-130` 灌入 5001 条不同非法路径后新路径仍会告警。

⚠️ **W4 非法括号语法存在检测缺口（无告警 + 垃圾段）**：

- `toPath('a[[0]]')` → `['a','[0',']']`，**0 条告警**，而 lodash 为 `['a','0']`；`normalizePathKey('a[[0]]')` → `'a.[0.]'`。
- `toPath('a]b')` → `['a]b']`（lodash `['a','b']`），同样无告警。
- 原因：`parseBracketPath` 只检测空段/未闭合/引号三类（path.ts:49-51,71-80），对 `[` 嵌套与游离 `]` 不设检；`parsePath` 仅在段中无 `[` 时用 `split('.')`（path.ts:94-101），因此含 `]` 无 `[` 的字符串整体当字面量（与模块头“非法语法输出告警”的定位不符）。
- 触发条件：字段/列 `name` 由模板拼接出畸形括号（如 `a[${i}]`，`i` 为 `[0]` 时得到 `a[[0]]`）→ 静默解析为垃圾段并用于读写。

✅ **段落兜底确定性**：未闭合 `a[b` → `['a','b']` + 告警（与模块头分歧 1 声明一致，`path.spec.ts:134-142`）；引号段 `a["x.y"]` 保留引号 + 告警（分歧 2，`path.spec.ts:144-152`）。

### 1.2 get / set 的目标与路径边界

✅ `get(null|undefined, p)` → `undefined`（path.ts:148，实测 A1/A2 与 lodash 全等）；`get({a:null}, 'a.b')` → `undefined`、`get({a:null}, 'a')` → `null`（path.ts:155-161 的“终点原样返回/中间断裂”语义，实测 A13/A14 与 lodash 全等）。

✅ 数组越界：`get([1,2],'5')` → `undefined`（经 `isSimple` 直取，path.ts:151；实测 A8 与 lodash 全等）。

❌ **D1-a `get(obj, 0|1|true)` 返回整个对象**：`typeof path` 既非 string 也未进入数组分支，`path.length` 为 `undefined`，`for (let i = 0; i < path.length; ...)`（path.ts:156）整体跳过，函数末尾 `return cur`（path.ts:162）直接返回入参对象。实测：`get({a:1},0)` → `{a:1}`、`get({a:1},1)` → `{a:1}`、`get({a:1},true)` → `{a:1}`，lodash 均为 `undefined`（`shared-probe-path2.log` 1.1–1.3、1.7）。

❌ **D1-b `set(obj, 0|1.5|true, v)` 写入键名 `"undefined"`**：`n = path.length` 为 `undefined`，`n === 0` 不成立（path.ts:191-192），循环条件 `i < n-1` 为假，`last = path[n-1] = path[NaN] = undefined`（path.ts:209），`isDangerousKey(undefined)` 为 false（path.ts:128-130 要求 `typeof v === 'string'`），最终 `assignValue(nested, undefined, v)` → `obj['undefined'] = v`。实测 `set({},0,'v')` → `{undefined:'v'}`（lodash `{0:'v'}`）、`set({},1.5,'v')` → `{undefined:'v'}`、`set({a:1},true,'v')` → 追加 `undefined` 键（`shared-probe-path2.log` 1.4–1.8）。
最小复现：`set({}, 0, 'v')` / `get({a:1}, 0)`。建议：入口统一 `path = toPath(path)`（或显式拒绝非 string/array 入参）。

⚠️ **W5 `get(obj, [])` 返回 obj 本身**：空数组路径无段可走，末尾返回入参（path.ts:154-162），lodash 返回 `undefined`（实测 A3：ours `{a:1}` / lodash 空）。`set(obj, [], v)` 已被 `n === 0` 拦下并返回原对象（path.ts:192，与 lodash 一致，实测 B1）。建议 `if (path.length === 0) return undefined;`。

⚠️ **W1 `set` 对原始值目标抛 TypeError（lodash 静默返回）**：入口只拦 `obj == null`（path.ts:178），缺 lodash `_baseSet.js:18` 的 `isObject` 守卫；`set('abc','a',1)` → `TypeError: Cannot create property 'a' on string 'abc'`、`set(5,'x',1)` → 同类抛错，lodash 分别原样返回 `'abc'`/`5`（`shared-probe-path.log` B6/B7）。TS 签名限定 `obj: object`，故仅 JS/无类型调用可达。

⚠️ **W2 冻结 / 密封 / 只读属性目标抛 TypeError（与 lodash 一致，但无兜底）**：`set(Object.freeze({a:1}),'a',2)` → `TypeError: Cannot assign to read only property 'a'`（lodash 同抛，实测 B8/B9）；冻结对象上加新键 → `Cannot add property b, object is not extensible`（B10）；只读 getter → `Cannot set property x ... only a getter`（B11）；`Object.seal` 新键同样抛（path2 4.7）。`assignValue` 直接 `object[key] = value`（path.ts:224）无 try/catch，异常会沿调用栈（如渲染中写表单数据）上抛。Vue `readonly()` 目标不抛（set trap 仅 dev 告警并忽略，path2 4.1/4.2），风险主要来自 `Object.freeze`/`seal`/`defineProperty` 场景。

✅ **路径不存在/中间层自动创建与 lodash 全等**：`set` 路径 `a.b.c` 在 `a` 为原始值时覆盖为对象，实测与 lodash 完全一致（B14 / path2 4.8/4.9）；`set({}, '', 1)`、`set({'a.b':1,a:{b:2}},'a.b',9)` 均与 lodash 全等（B2/B3；字面量点号键优先与 lodash `isKey` 的 `value in Object(object)` 分支一致：`shared-probe-path.log` A7 SAME）。

✅ **数组索引段建数组判定（字符串口径）与 lodash 全等**：`set(['k', '0'|'1'], v)` → 数组、`'01'|'1.5'|'-1'|''|'a'` → 对象，7/7 与 lodash 一致（path2 5.x）。

⚠️ **W3 数字段 `isIndexKey` 过宽 → 建数组并写入“非索引属性”**：`isIndexKey` 对任意 `number` 直接返回 true（path.ts:118-119），lodash `isIndex` 还要求 `value > -1 && value % 1 == 0 && value < length`。实测 `set({}, ['k',-1|1.5|NaN|1e21], 'v')`：本实现建 **Array** 并挂 `'-1'/'1.5'/'NaN'/'1e+21'` 属性（`Object.keys` 可见但 `JSON.stringify`/`length` 不体现，形如 `{k:[]}`），lodash 一律建对象 `{'-1':'v'}` 等（`shared-probe-gap.log` 3.x，4 组 DIFF / 8 组 SAME）。类型面允许 `readonly (string|number)[]`，故 `['list', -1]` 是合法 TS 调用。

### 1.3 set 同值跳过的 SameValueZero 口径

✅ `sameValueZero`（path.ts:131-132）与 `assignValue` 跳过条件（path.ts:218-224）与模块头声明一致，实测：`0 → -0` 跳过（`Object.is(state.zero,-0)` 保持 false）、`-0 → 0` 跳过（保持 -0）、`NaN → NaN` 跳过、`{a:undefined}` 写 `undefined` 不重复写入；`path.spec.ts:350-389`（PT-04）用 `watch(..., {flush:'sync'})` 断言依赖零触发。lodash `assignValue` 采用同一 `eq` 口径（`shared-probe-path.log` C1/C2/C4 一致）。

### 1.4 toPath / normalizePathKey 分档缓存与冻结

✅ **按入参分档且与文档一致**（path.ts:265-272）：

- 非空字符串 → `cachedParse`，**同实例 + 已冻结**（`Object.freeze`，path.ts:107；实测 E11：`toPath('probe.cache.a.b') === toPath('probe.cache.a.b')`、`Object.isFrozen` true；就地 `push`/赋值抛 `TypeError` 且缓存不被污染 E12/E13，`path.spec.ts:230-273` PT-01 已锁定）。
- 数组 → `path.map(String)` 新数组、不缓存不冻结；数字/布尔 → 单段新数组、不冻结（E14 实测，PT-01 锁定）。
- 空字符串 / `null`/`undefined` / 对象 / symbol → 新空数组（E2/E9/E10；`path.spec.ts:208-217` 分歧 4）。

✅ **缓存有界 + FIFO 驱逐实测**：上限 5000（path.ts:18,104-113）。实测先取 `toPath('evict.probe.0')` 存实例，灌入 5200 条不同路径后再取同一路径 → **实例已变**（`false`）且仍冻结，证明旧条目被分批驱逐后重新解析（`shared-probe-path.log` E16）；驱逐为“每批 10%”摊还 O(1)/次插入（path.ts:25-35）。

✅ **段值归一化分档与文档一致、与 lodash 的已知分叉被用例锁定**：`toPath(['a',null])` → `['a','null']` 而 `normalizePathKey(['a',null])` → `'a.'`（模块头 232-235 + `path.spec.ts:278-308` PT-02）；`toPath(['a',0])`/`['a','']`/数字与布尔标量与 `join` 口径一致（E4/PT-02）。

⚠️ **补充分叉（未在文档/用例中列明）：段内 `-0`**：`toPath([-0])` → `['0']`，lodash → `['-0']`（`_toKey` 对负零有特判）；`normalizePathKey([-0]) === '0'` 与 `toPath([-0]).join('.') === '0'` 自洽，但与 lodash 的 `'-0'` 不同（`shared-probe-path.log` E5/E6）。属 PT-02 “归一化矩阵”未覆盖的同类边界，建议补一行用例或在文档补记。

### 1.5 isDangerousKey 判定矩阵与原型污染可达性

✅ **矩阵精确**：`__proto__`/`constructor`/`prototype` → true；`Constructor`/`__proto`/`toString`/`''`/`0`/`-1` → false；非字符串一律 false（含 `new String('__proto__')`，path.ts:128-130；`path.spec.ts:315-330` PT-03 + 实测 F1）。

✅ **写入侧不可达，读侧不设限（符合设计）**：9 组写入向量（`__proto__.polluted`、`['__proto__','polluted']`、`constructor.prototype.polluted`、`prototype.polluted`、`a.__proto__.polluted`、`__proto__` 直接赋值、`constructor`、`a.constructor`、`a.prototype`）后 `({}).polluted === undefined` 全部 **CLEAN**，目标对象自身也未被改写（F2–F10、F13、G2）；`get({}, ['__proto__'])` 会返回 `Object.prototype`（读侧无防护，与 lodash 一致 A12）。
✅ **与 lodash 4.17.21 的一致性声明成立**：`packages/core/node_modules/lodash-es/_baseSet.js:32` 同样对 `__proto__`/`constructor`/`prototype` 直接 `return object`，因此“合法数据键 `constructor`/`prototype` 被静默丢弃”是与 lodash 相同的既有语义，而非本实现新增偏差（对照实测 2.1–2.4、2.7、G3）。
✅ **不泄漏到包根导出**：`src/index.ts:6` 只导出 `get/set/normalizePathKey/toPath`，`index.spec.ts:50-55`（SX-02）对导出清单做双向断言，故 `@internal 仅包内使用` 的 JSDoc 声明可验证成立。

### 1.6 模块级状态与实例隔离

✅ 仅两处模块级状态，均有界：`pathCache`（≤5000 条，驱逐）、`warnedPaths`（≤5000 条，驱逐）（path.ts:18-22）。
⚠️ 状态随模块实例隔离：以 `import('...path?copy=2')` 制造第二实例后，同一非法路径在新实例中**再次告警**（`shared-probe-path.log` H1 = 1），即“只告警一次/缓存共享”均为**单模块实例**语义；若产物出现双份（CJS+ESM 双载、不同入口重复打包），告警与缓存会各存一份（无正确性影响，仅日志与内存翻倍）。文档未声明该边界，建议在 JSDoc 补一句“按模块实例生效”。

## 2. utils/index.ts 核查

### 2.1 isObjectItem 真值矩阵（utils/index.ts:54-55）

判定仅 `value !== null && typeof value === 'object'`，实测矩阵（`shared-probe-utils.log` 1.1）：

| 入参                                    | 结果     | 入参                            | 结果  |
| --------------------------------------- | -------- | ------------------------------- | ----- |
| `{}` / `[]` / `[1]`                     | **true** | `null` / `undefined`            | false |
| `Date` / `Map` / `RegExp` / `Promise`   | **true** | `0` / `''` / `false` / `Symbol` | false |
| `Object.create(null)` / `new Number(1)` | **true** | `function`                      | false |
| `reactive({})` / `ref({}).value`        | true     | 类实例                          | true  |

⚠️ **W11 判定过宽 + 无行为用例**：数组、`Date`、`Map`、`Promise`、装箱原始值、`globalThis` 等全部通过；JSDoc（utils/index.ts:46-53）只说“仅非 null 的对象视为有效项”，未点明“对象”包含上述形态。若下游用它过滤字段/列配置（`useSearchFormExpand.ts`、四包 `BaseFormItem/ColumnControl/ProTable/TableColumnRenderer` 均有调用点，仅统计文件级命中），一个 `Date`/数组型脏值会被当作合法配置项放行。并且 core 侧**没有任何行为用例**：`isObjectItem` 仅出现在 `index.spec.ts:15`（导出存在性），无真值矩阵断言。建议：明确契约（若要收紧为 plain object，改用同文件 `isPlainObject`）并补矩阵用例。

### 2.2 pick（utils/index.ts:78-87）与 toPropRecord

✅ **语义与幂等**：`pick` 返回新对象、只做浅拷贝（嵌套引用共享，`shared-probe-gap.log` 2.9），重复 keys 幂等（2.1），空 keys → `{}`（2.2），不存在键 → 不收（2.3），数字/布尔/Symbol 键均可用（2.6/2.10），自有+继承属性均收（`toString`/`constructor`，2.4/2.5，与 `utils.spec.ts:78-105` 的 lodash 对拍一致）。

❌ **D3 无危险键防护 → 结果对象原型被源数据替换**：`pick` 用普通赋值 `result[key] = value`（utils/index.ts:84）。源对象若含**自有** `__proto__` 键（`JSON.parse('{"__proto__":{"polluted":"yes"},"ok":1}')` 即可造出），赋值走 `[[Set]]` 语义改写结果对象的原型：实测 `Object.keys(result) === ['ok']`、`Object.getPrototypeOf(result) !== Object.prototype`、`result.polluted === 'yes'`（`shared-probe-utils.log` 2.9/2.11）；lodash 同场景因为 `_baseSet.js:32` 的危险键守卫，结果原型仍是 `Object.prototype`（2.10）。全局 `Object.prototype` **未被污染**（2.9 `leakedGlobal: CLEAN`），影响面是**该次 pick 的返回值**：其原型链上挂着攻击者可控键，后续 `key in result`、属性读取、展开合并、交给 `reactive()` 时都会看到这些键。同文件的 `camelizeProperties` 因走 `Object.fromEntries`（CreateDataProperty 语义）而**天然免疫**（实测 `shared-probe-utils.log` 3.7：own key `__proto__` + 原型保持 `Object.prototype`），可见这是 `pick` 的实现选择而非全模块约定。建议：`pick` 复用 `isDangerousKey`（path.ts 已导出模块内实现）或改用 `Object.defineProperty`/`Object.fromEntries` 累积。

⚠️ **W8 null / undefined / 原始值目标抛 TypeError（lodash 返回 `{}`）**：`key in object`（utils/index.ts:84）对 `null`/`undefined`/数字抛错。实测 `pick(null,['a'])` → `TypeError: Cannot use 'in' operator to search for 'a' in null`（lodash `{}`）、`pick(undefined,['a'])` → 同类（lodash `{}`）、`pick(5,['toString'])` → 同类（lodash 返回 `object`）（`shared-probe-gap.log` 2.1–2.6）。TS 签名要求 `T extends object`，仅 JS/无类型调用可达（例如把 `field.attrs` 这类可能为 `null` 的配置直接传入）。

ⓘ **toPropRecord 不在 core**：全仓仅 `packages/antdv-next-pro/src/shared/ui/index.ts:75` 定义（`const toPropRecord = (keys: string[]) => ...`），core `shared/**` 无同名/同构实现，故本次无可核对象（详见 §8）。

### 2.3 camelizeProperties（utils/index.ts:110,128-137）

✅ **data-_/aria-_ 保名与无误伤**：`'data-testid'`/`'aria-label'`/`'DATA-x'`/`'Data-Y'`/`'ARIA-live'` 原样保留；`'database-name'` → `databaseName`、`'ariafoo-bar'` → `ariafooBar`、`'my-data-x'` → `myDataX`、`'dataIndex'` → 不变（锚定 `/^(data|aria)-/i`，无前缀误伤，`shared-probe-utils.log` 3.1 + `utils.spec.ts:328-350` SU-04）。
✅ 仅遍历自有可枚举属性（`Object.entries`），原型链属性不参与（3.4）；不修改入参（`shared-probe-gap.log` 4.3）；`__proto__` 自有键安全（3.7）。

⚠️ **W9 保名规则与「目标驼峰 prop」冲突（字段/列层误放行）**：`camelizeProperties({'data-source': {...}, 'data-index': 1, 'aria-sort': 'asc'})` 三个键**全部原样保留**（`shared-probe-gap.log` 4.1）。也就是说：按 kebab 风格书写的 `data-source`（意图是 `dataSource` 折叠面板/表格数据源 prop）、`data-index`（意图是列配置 `dataIndex`——本库列定义的一等键）不会被转换，随后作为 attribute 透传到组件上被静默忽略（`data-index="1"` 落到 DOM 而非列渲染逻辑）。触发条件：宿主用 kebab-case 写 `dataSource`/`dataIndex` 这类以 `data` 开头、恰好被 `data-` 前缀命中的 prop 名。建议：把豁免规则收窄为“键在原始对象中就是 `data-*`/`aria-*` 校验属性（值必须是字符串/数字）”或在文档写明该冲突。

⚠️ **W10 非幂等与键变形**：实测 `{'a--b':1,'-lead':3,'trail-':4}` → `{'a-B':1,'Lead':3,'trail':4}`（Vue `camelize` 的 `-(\w)` 行为），再次 camelize → `{'aB':1,...}`，即**二次处理结果不同**（`shared-probe-gap.log` 4.2）；数组入参被静默变成普通对象 `{0:'x',1:'y'}`（4.4）；Symbol 键被丢弃（`shared-probe-utils.log` 3.5）；`null` 入参抛 `TypeError`（3.3，TS 已挡）。均为异常键名场景，属低危但会静默改变键集合。

### 2.4 isPlainObject / getObject / isPromise

✅ **isPlainObject 与 lodash 语义等价**（utils/index.ts:64-75）：类实例/数组/Date/RegExp/Map/Set/Error/函数/`Object.create(null)`/双层空原型链/Proxy 包装对象全部与 lodash 逐例一致（`utils.spec.ts:38-76` 21 例对拍 + 实测 4.5/4.6）。
⚠️ **W15 原型上存在「无 prototype 的构造函数」时抛 TypeError**：`isPlainObject(Object.create({ constructor: () => {} }))` → `TypeError: Function has non-object prototype 'undefined' in instanceof check`（`Ctor instanceof Ctor`，utils/index.ts:72），lodash 同场景**同样抛错**（实测 4.1/4.2），故“语义等价”声明成立，但这是一个无防护的抛错面（原型链上挂箭头函数的对象在业务里罕见，列为低危）。
✅ **模块级常量**：`toString`/`getProto`/`rootObjectCtorString`（utils/index.ts:57-61）在模块加载时一次性获取，无增长。
✅ **getObject** 对 plain object 原样返回引用、其余返回 `{}`（utils/index.ts:106-108；`utils.spec.ts:18-28` SU-01/SU-02 覆盖数组/字符串/null/undefined）。
ⓘ `isPromise`（utils/index.ts:159-164）按 Promises/A+ 判 thenable，用例覆盖 Promise/async/自定义 thenable/非 thenable（`utils.spec.ts:288-326`）；访问 `.then` 会触发 getter，若 getter 抛错会直接外抛（同类低危观察项，与 W15 同族）。

## 3. cloneDeep 核查（utils/index.ts:17-44）

### 3.1 structuredClone 优先（utils/index.ts:21-28）

✅ 实测原生路径完整保留 `Date` / `Map` / `Set` / `RegExp` / `-0` / `NaN` / `undefined` 自有键 / `BigInt`，且 **0 条降级告警**（`shared-probe-utils.log` 5.1）；循环引用自引用闭合（5.2）；JSON 子集与 `lodash.cloneDeep` 对拍相等（5.17）；`reactive` 入口经 `isProxy → toRaw` 解包后走原生路径（`utils.spec.ts:108-143` CR-008 + 本探针 12）。
✅ **嵌套响应式代理确实走 JSON 降级**（与 JSDoc utils/index.ts:14-15 声明一致）：`structuredClone(new Proxy({},{}))`、`structuredClone({inner: reactive({})})`、`structuredClone(toRaw(outer))` 在 Node 22 均抛 `DOMException: #<Object> could not be cloned.`（`shared-probe-proxy.log` 1-7）；实测 `cloneDeep({ m: markRaw(new Map()), inner: reactive({y:1}) })` 结果 `m instanceof Map === false`（JSON 路径的判定信号，11），而纯可结构化 reactive 保持原生（12）。

### 3.2 JSON 降级与告警一次性

✅ **降级告警只出一次（同一模块实例）**：`warnedJsonFallback` 模块级布尔（utils/index.ts:17,29-34）。实测连续两次 `cloneDeep({fn})` → 仅 **1 条** `cloneDeep 已降级为 JSON 拷贝…`（`shared-probe-utils.log` 5.3/5.4；`shared-probe-gap.log` 1.5）。
✅ **实例隔离**：以 `import('...utils/index?copy=2')` 制造第二模块实例后，再次调用**重新告警 1 条**，其第二次调用又归零（`shared-probe-gap.log` 1.6/1.7）→ 去重状态按模块实例隔离，双份产物会双份告警（同 §1.6 边界）。
✅ **降级形态与 JSDoc 列表一致**：`Map/Set/RegExp → {}`、`Date → ISO 字符串`、`NaN/Infinity → null`、函数与 Symbol 键静默丢弃、**顶层**函数/`undefined`/`Symbol` 返回原引用（`shared-probe-utils.log` 5.5–5.11）。
✅ **无 structuredClone + 循环引用** → 输出 `cloneDeep 降级失败…已返回原引用` 并返回同一引用（5.10）；该兜底告警**不去重**（每次调用各一条，5.13 两条），与文档只对“已降级为 JSON 拷贝”声明一次性一致。

❌ **D4 兜底告警归因错误 + 静默返回原引用**：兜底分支的文案把原因写死为“数据含循环引用且环境不支持 structuredClone”（utils/index.ts:39-42），但实测两条真实触发都与该描述不符：

- `cloneDeep({ fn: () => 1, big: 10n })`（**structuredClone 存在**、**无循环引用**）：原生路径因函数抛 `DataCloneError` → JSON 路径因 `BigInt` 使 `JSON.stringify` 抛 `TypeError` → 落入兜底，输出上述归因文案并**返回原引用**（`same: true`，`shared-probe-utils.log` 5.12）。
- 抛错 getter：`cloneDeep({ get boom() { throw new Error('getter-boom') } })` → `structuredClone` 与 `JSON.stringify` 先后抛错并被 `catch {}` 吞掉（utils/index.ts:25,38）→ 同一误报 + 返回原引用（5.13）。
  影响：用户拿到“循环引用/环境不支持”的错误提示去排查，真实原因是数据类型或数据访问器抛错；且快照隔离已失效却只有一条归因错误的告警。建议：`catch (e)` 分支按失败阶段分别提示（DOMException/DataCloneError vs JSON 序列化失败），并在文案中列出真实候选原因（不可结构化类型 / BigInt / 抛错 getter / 循环引用）。

### 3.3 其余 cloneDeep 风险

⚠️ **W6 首次告警后“静默快照隔离失效”**：`warnedJsonFallback` 一旦置位，后续所有降级调用都不再出声。实测在同一进程内先触发一次降级告警，再 `cloneDeep(fn)`（顶层函数，返回**原引用**）→ `warned = 0`（`shared-probe-utils.log` 5.6，警告计数为 0 说明没有任何提示）。也就是长生命周期应用中只有第一次降级会被播报，之后 `cloneDeep` 可能悄悄返回原对象（快照隔离失效且无感知）。建议：把“返回原引用”这类**隔离失效**与“JSON 拷贝变形”分开计数（例如返回原引用时每次告警或 `console.error`），或在返回值上做可检测标记。
⚠️ **W7 降级路径未列明的类型变形**：稀疏数组空洞被填成 `null`（`[1,,3]` → 洞消失，5.11 `sparseHole:false`）、任意类实例丢原型变为普通对象（`cloneDeep(classInstance) instanceof Ctor === false`，5.18；`Date` 子类同样丢子类原型，`shared-probe-proxy.log` 13）、`cloneDeep(ref({a:1}))`（**整体传 Ref**，非 `.value`）返回同时含 `dep/__v_isRef/_rawValue/_value` 却没有 `value` 访问器的对象（`shared-probe-gap.log` 1.4）——JSDoc 只声明“入口为响应式代理时解包一层”，未提示 Ref/类实例需先 `.value`/自行处理。建议在 JSDoc 边界段落补两句。

## 4. locale/\*\* 与 format 核查

### 4.1 format（locale/index.ts:77-85）

❌ **D2 占位符解析走原型链**：`key in params`（locale/index.ts:83）会命中 `Object.prototype`，实测（`shared-probe-locale.log` 1.1–1.5）：

- `format('{toString}', {})` → `'function toString() { [native code] }'`
- `format('{constructor}', {})` → `'function Object() { [native code] }'`
- `format('{__proto__}', {})` → `'[object Object]'`；`{hasOwnProperty}`/`{valueOf}` 同理
  即“缺参保留 `{key}`”（`locale.spec.ts:34`）只对非继承键成立；而自定义语言包文案一旦包含 `{constructor}`/`{valueOf}` 之类名字（翻译事故或恶意覆盖）就会把原生函数源码渲染到界面上。自有键遮蔽原型正常（1.6 `{toString}` + `{toString:'X'}` → `'X'`）。建议：改为 `Object.prototype.hasOwnProperty.call(params, key)` 或把 params 归一化到 `Object.create(null)`。
  ✅ 其余口径：缺参保留原样（1.7）、重复占位符全替换（1.8 `'1-1-1'`）、`params` 为 `null`/省略时短路返回原文（1.10/1.12，`locale/index.ts:81` 的 `text.includes('{')` 短路也避免了无占位符时的正则开销）、数组 params 意外可用（1.11）、既有语言包真实文案替换正确（1.16 `'共 100 条'`）。
  ⓘ 边界口径：`{a}` 对应 `params.a === undefined` 时会输出字符串 `'undefined'`（1.9，`in` 判定为真）；`{a.b}`/`{a-b}`/`{}`/`{ }`（非 `\w+`）不被替换（1.13）；`'{{a}}'` → `'{1}'`（1.15）。三项都是 `\w+` 正则的既有口径，现有语言包只使用 `{index}`/`{total}` 两个简单名（2.5），无实际影响。
  ⚠️ **W14 `format` 无缺键/空值防护，core 无 key 级回退**：`format(undefined, {...})` → `TypeError: Cannot read properties of undefined (reading 'includes')`（`shared-probe-locale.log` 1.17/1.18）。core 的 `locale/**` **不提供** `t()` 之类的取词函数，也就没有 key 级回退；实测四个 UI 包各自实现 `t()` 且用 `overrides?.[key] ?? pack[key] ?? key` 兜底（`antd-vue-pro/src/locale/index.ts:66-67`、`antdv-next-pro/src/locale/index.ts:66-67`、`element-plus-pro/src/locale/index.ts:65-66`、`vant-pro/src/locale/index.ts:64-65`），因此包内路径不会把 `undefined` 交给 `format`——但回退值是**键名本身**（缺键时界面显示 `table.query` 字面量），且这一层不在 core 范围内。对直接 import `format` 的消费者（core 根导出含 `format`）仍建议加 `typeof text === 'string'` 守卫。

### 4.2 语言包内容与 key 对齐

✅ **key 三向完全对齐**：`localePacks` 三包相较 zh-CN **无缺失、无多余**（`shared-probe-locale.log` 2.2，比 `locale.spec.ts:47-52` LC-05 的“排序后相等”更强）；每个 key 的占位符集合三包**完全一致**（2.3 空差异；含 `{placeholder}` 的 key 仅 `table.columnFallback`、`pagination.total`，2.5）；语言包 key 中无 `__proto__`/`constructor`/`prototype`/`toString` 敏感名（2.6），`localePacks` 自身原型正常（2.7）。
⚠️ **W13 语言包未冻结且是共享可变单例**：`zhCN/zhTW/enUS/localePacks` 的 `Object.isFrozen` 全为 `false`（`shared-probe-locale.log` 2.8，`as const` 只作用于编译期）。实测运行期改写 `zhCN['table.query']` 会**同步反映**到 `localePacks['zh-CN'].table.query`（同一引用，2.9 `follows: true`）→ 任何一处（含测试）误改都会污染全局文案，且无版本/隔离保护。建议 `Object.freeze` 三包（或至少在文档标注“共享单例、勿改”）。
⚠️ **W16 语言包「文案值」未被用例锁定**：`locale.spec.ts:38-45`（LC-04）只断言 `typeof === 'object'`，LC-05 只比对 key 集合，LC-03/LC-06 用的是**内联字符串**而非 `zhCN['pagination.total']`。因此三包任一文案值被改动/打错（如繁简混用、占位符拼错位置）core 用例都会全绿。实测当前值抽检正常：`table.query` = 查询/查詢/Search、`table.columnFallback` = `列{index}`/`欄{index}`/`Column {index}`、`table.sizeDefault` = 默认/預設/Default。建议补最小值锁定（至少 `pagination.total` 的 `format` 结果三语各一条）。
ⓘ 类型面：`ProLocale = Record<ProLocaleKey, string>`（locale/index.ts:14-16,22）能在编译期挡住“缺 key”，但 `zhTW`/`enUS` 是**变量**赋值，多出的 key 不受 excess property check 约束（运行期由 LC-05 补位）。

### 4.3 resolveLocaleName（locale/index.ts:45-63）

✅ 语言名解析矩阵 17/17 符合预期：`zh-cn/zh-CN/ZH/en/en_US/EN-gb/zh-Hans/zh-hans-cn/zh-/zht/zhx/''/'  '/ZH` → 预期值；繁体优先判定正确命中 `zh-tw`/`zh_TW`/`zhtw`/`zh-HK`/`zh_hk`/`zh_MO`/`zh-hant`/`zh-Hant-TW`/`zh_TW.UTF-8`（`shared-probe-locale.log` 3.1）；注释“繁体判定先于 zh 前缀”与实现顺序一致（locale/index.ts:48-60）。
⚠️ **W12 非字符串入参抛错**：`resolveLocaleName(123)` → `TypeError: lang.toLowerCase is not a function`（3.2）；`0`/`''`/`null`/`undefined` 因 `!lang` falsy 短路回退 `zh-CN`，但其它 truthy 非字符串（数字/对象）直接抛（3.3）。TS 签名 `string | null | undefined` 已排除，属防御性缺口，建议 `typeof lang !== 'string'` 守卫。

## 5. 注释与实现一致性（只报告）

✅ **核对一致的声明**：

- `path.ts:9-15` 模块头分歧 1（未闭合括号）、分歧 2（引号段）、分歧 3（`normalizePathKey` 非字符串返回 `''`）逐条实测一致（§1.1、C 段矩阵、`path.spec.ts:133-160`）。
- `path.ts:150` 行内注释“单段命中或字面量点号 key”与实现一致，且与 lodash `isKey` 的 `value in Object(object)` 分支行为相同（A7 SAME），故不必列为分歧。
- `path.ts:216` “SameValueZero…`0` 与 `-0` 视为相同”与实现/用例一致（§1.3）。
- `path.ts:180` “原型污染防护（对齐 lodash 4.17.21）”经 `lodash-es/_baseSet.js:32` 只读核对**成立**（三键同样直接返回原对象）。
- `path.ts:123` `@internal …包外不可达` 成立：`src/index.ts:6` 白名单导出 + `index.spec.ts:50-55` 双向导出断言。
- `utils/index.ts:6-15` cloneDeep 的原生/降级/兜底/代理解包描述与实测一致（除下文 (b)、(d)）。

⚠️ **不完整或不准确的注释（建议改写）**：

- (a) `path.ts:9-15` “与 lodash get/set/toPath 的行为差异”只列 3 条解析口径差异，实际还有：裸数字/布尔路径读写（D1）、空数组路径返回入参（W5）、原始值目标抛错（W1）、数字段 `-1/1.5/NaN` 建数组（W3）、冻结/密封目标抛错（W2）、`toPath([-0])`（§1.4）。建议收敛实现（统一 `toPath` 归一化 + `isObjectLike` 守卫）后把差异清单缩到“解析口径”一类。
- (b) `utils/index.ts:13` “最后兜底（环境无 structuredClone **且**数据含循环引用导致 JSON 亦失败）”与真实触发条件不符：BigInt、抛错 getter 等任何 `JSON.stringify` 抛错都会进入该分支（与 structuredClone 是否存在无关）→ 归入 D4。
- (c) `path.ts:7` “非法语法…输出告警”与 W4 的两类未检测畸形语法（`a[[0]]`、`a]b`）不符。
- (d) `utils/index.ts:49` isObjectItem 的“非 null 的对象视为有效项”未点明数组/Date/Map/Promise/装箱值同样为 true（W11）。
- (e) `path.ts:253` toPath JSDoc “非法语法（空段、未闭合括号、引号段）输出告警”自身列举是准确的，但与模块头“非法路径告警”的广义表述存在落差（同 (c)）。
  ✅ **注释规范抽查（AGENTS §2.2）**：审计文件内无 `TODO`/`FIXME`/`XXX`/`console.log`/`debugger` 残留（grep 退出码 1），无被注释死代码，无连续多行 `//` 拼接注释（awk 全量检查 0 命中）；仅存单行 `//` 注释 3/2/1/3 处，均为 1 行内说明。

## 6. 性能

✅ **无 O(n²)、无重复正则灾难回溯、无无界缓存**：

- `get`（path.ts:154-162）与 `set`（path.ts:198-210）均为单遍线性遍历，路径解析 O(len)；`parseBracketPath`（path.ts:57-89）单次扫描 + `indexOf`，无回溯嵌套；`parsePath` 无 `[` 时走原生 `split`（path.ts:96）。
- 模块级状态全部有界：`pathCache` 5000、`warnedPaths` 5000（分批 FIFO 驱逐，§1.1/1.4），`cloneDeep` 仅一个布尔标志；未发现按调用/按字段增长的 Map/Set/数组。
- 正则均为线性模式：`/^(?:0|[1-9]\d*)$/`、`/\{(\w+)\}/g`、`/^(data|aria)-/i`。
- 实测 200k 次调用耗时（`shared-probe-path.log` E17）：`toPath('hot.path.a.b.c')` **3ms**、`toPath('hot[0].path.b.c')`（冻结缓存命中）**2ms**、`normalizePathKey('hot[0].path.b.c')` **49ms**。

⚠️ **P1 `normalizePathKey` 括号分支不复用缓存（唯一可观测的性能缺口）**：`normalizePathKey` 对含 `[` 的字符串直接 `parseBracketPath(path).join('.')`（path.ts:240），未走 `cachedParse`，因此每次调用都要重新扫描 + 新建字符串。实测 49ms vs 缓存路径 2ms（≈25×，同 200k 次）。调用点确实存在（仅统计命中行数：`core/src/form/useFields.ts` 3 处、`core/src/form/useFormData.ts` 3 处、`element-plus-pro/…/TableColumnRenderer.vue` 4 处、`element-plus-pro/…/BaseFormItem/index.vue` 与 `ColumnControl.vue` 各 2 处等），若出现在按字段/按列循环或渲染期，属可避免的重复开销。建议：`return cachedParse(path).join('.');`（同时保留“无 `[` 直接返回原串”的零分配快路径），或对归一化结果加一层 Map 缓存。
⚠️ **P2 函数体内正则字面量每次求值新建 RegExp 对象**：`isIndexKey`（path.ts:119）、`format`（locale/index.ts:82，已被 `text.includes('{')` 短路保护，无占位符时不构造）。量级实测极小（见上 E17），列为观察项，不构成优化需求。
ⓘ `get` 对字符串路径先做 `path in obj` 原型链查找（path.ts:150），多段路径为每段一次哈希查找，属常量开销；`evictOldestBatch` 每批 O(500)，摊还到每次插入 O(1)（§1.4 实测驱逐生效）。

## 7. 缺陷与风险清单

严重级：❌ = 明确缺陷（行为与文档/契约/lodash 对标不符）；⚠️ = 风险或缺口（含防御性、文档、测试锁定、性能）。所有条目均为**本次实测**得出，未实测的推测一律未列入。

| ID      | 级别            | 位置                                                   | 触发条件                                                                                          | 最小复现（实测输出）                                                                                                                                                                                                                                                                  | 建议                                                                                                                                                       |
| ------- | --------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1**  | ❌ 中           | `path.ts:149,154-162`（get）/ `191-192,209-210`（set） | JS/无类型调用传入裸 `number`/`boolean` 路径（TS 签名已排除）                                      | `get({a:1},0)` → `{a:1}`；`get({a:1},true)` → `{a:1}`；`set({},0,'v')` → `{undefined:'v'}`；`set({},1.5,'v')` → `{undefined:'v'}`（lodash 分别 `undefined` / `{0:'v'}`）                                                                                                              | 入口统一 `path = toPath(path)`（path.ts:265 已具备该能力）；或非 string/array 直接 `return obj/undefined`                                                  |
| **D2**  | ❌ 中低         | `locale/index.ts:82-84`                                | 文案占位符名命中 `Object.prototype` 继承键（或自定义语言包/翻译误写）                             | `format('{toString} {constructor}', {})` → `'function toString() { [native code] } function Object() { [native code] }'`；`{__proto__}` → `'[object Object]'`                                                                                                                         | 用 `Object.prototype.hasOwnProperty.call(params, key)` 判存在；或把 params 归一化到 `Object.create(null)`                                                  |
| **D3**  | ❌ 中           | `utils/index.ts:83-85`                                 | `pick` 的源对象含**自有** `__proto__` 键（`JSON.parse` 服务端数据即可造出）                       | `const r = pick(JSON.parse('{"__proto__":{"polluted":"yes"},"ok":1}'), ['__proto__','ok'])` → `Object.keys(r)=['ok']`、`Object.getPrototypeOf(r)!==Object.prototype`、`r.polluted==='yes'`；lodash 同场景原型保持 `Object.prototype`（全局 `Object.prototype` 未被污染）              | 复用 `path.ts` 的 `isDangerousKey` 跳过危险键，或改用 `Object.fromEntries`/`Object.defineProperty` 累积（同文件 `camelizeProperties` 即安全）              |
| **D4**  | ❌ 低           | `utils/index.ts:38-43`（文案）/ `25,38`（吞错）        | 含函数属性**且**含 `BigInt`；或数据带抛错 getter；此时 structuredClone 与 `JSON.stringify` 均失败 | `cloneDeep({fn:()=>1, big:10n})` → 告警“数据含循环引用且环境不支持 structuredClone”（两条前提均假）且 `copy === source`；抛错 getter 同款误报                                                                                                                                         | 按失败阶段区分文案（不可结构化类型 / JSON 序列化失败），并列出真实候选原因（BigInt、抛错 getter、循环引用）；`catch` 处保留原始错误信息                    |
| **W1**  | ⚠️ 低           | `path.ts:178`                                          | `set` 目标为原始值（TS 外调用）                                                                   | `set('abc','a',1)` → `TypeError: Cannot create property 'a' on string 'abc'`；lodash 返回 `'abc'`                                                                                                                                                                                     | 补 `isObjectLike(obj)` 守卫（对齐 lodash `_baseSet.js:18`）                                                                                                |
| **W2**  | ⚠️ 低           | `path.ts:218-226`                                      | 目标为 `Object.freeze`/`seal`/只读 getter（含响应式冻结状态）                                     | `set(Object.freeze({a:1}),'a',2)` → `TypeError: Cannot assign to read only property 'a'`（lodash 同抛）；`set(frozen,'b',2)` → `Cannot add property b`                                                                                                                                | 明确“冻结目标会抛错”的边界，或 `try/catch` 后静默返回 `obj`（视契约而定；Vue `readonly()` 目标本身不抛）                                                   |
| **W3**  | ⚠️ 中低         | `path.ts:118-119,205`                                  | 段数组中出现负数/小数/`NaN`/超大数字段（TS 合法）                                                 | `set({}, ['k',-1], 'v')` → `{k:[]}`（属性 `'-1'` 被 `JSON.stringify` 隐藏）；lodash → `{k:{'-1':'v'}}`（1.5/NaN/1e21 同类）                                                                                                                                                           | `isIndexKey` 数值分支对齐 lodash `isIndex`：`typeof v === 'number' && Number.isInteger(v) && v >= 0`                                                       |
| **W4**  | ⚠️ 中低         | `path.ts:48-92`                                        | 路径含嵌套 `[[` 或游离 `]`                                                                        | `toPath('a[[0]]')` → `['a','[0',']']`（0 告警，lodash `['a','0']`）；`toPath('a]b')` → `['a]b']`（lodash `['a','b']`）                                                                                                                                                                | 解析时检测 `]` 未配对/`[` 嵌套 → 记 `warnInvalid` 并给出文档化兜底                                                                                         |
| **W5**  | ⚠️ 低           | `path.ts:154-162`                                      | `get` 传空数组路径                                                                                | `get({a:1},[])` → `{a:1}`（lodash `undefined`）                                                                                                                                                                                                                                       | `if (path.length === 0) return undefined;`（`set` 已有等价守卫）                                                                                           |
| **W6**  | ⚠️ 中           | `utils/index.ts:17,29-34,37`                           | 进程内已发生过一次降级告警之后                                                                    | 先 `cloneDeep({fn:()=>1})`（告警 1 条），再 `cloneDeep(fn)` → **返回原引用且 0 告警**                                                                                                                                                                                                 | 把“返回原引用/隔离失效”与“JSON 变形”分开：前者每次告警或 `console.error`，或返回值可检测标记                                                               |
| **W7**  | ⚠️ 低           | `utils/index.ts:35-43`                                 | 进入 JSON 降级路径                                                                                | 稀疏数组洞 → `null`（`1 in copy.sparse === true`）；`cloneDeep(classInstance) instanceof Ctor === false`；`cloneDeep(ref({a:1}))` 得到含 `dep/_value` 但无 `value` 访问器的对象                                                                                                       | JSDoc 边界段落补列：稀疏洞、类实例原型、Ref 需先 `.value`                                                                                                  |
| **W8**  | ⚠️ 中低         | `utils/index.ts:83-85`                                 | `pick` 目标为 `null`/`undefined`/原始值（JS 或无类型配置）                                        | `pick(null,['a'])` → `TypeError: Cannot use 'in' operator to search for 'a' in null`（lodash `{}`）；`pick(undefined,…)`/`pick(5,…)` 同类                                                                                                                                             | 入口 `if (object == null) return {} as ...`（顺带对齐 lodash 对原始值的容忍）                                                                              |
| **W9**  | ⚠️ 中低         | `utils/index.ts:110,133`（`/^(data\|aria)-/i`）        | 用 kebab 写以 `data`/`aria` 开头的**目标驼峰 prop**                                               | `camelizeProperties({'data-source':{a:1},'data-index':1})` → 两键**原样保留**，`dataSource`/`dataIndex` 永不生效（`data-index` 会作为 attribute 透传）                                                                                                                                | 收窄豁免（仅纯 `data-*`/`aria-*` 字符串属性）或在文档显式警示该冲突                                                                                        |
| **W10** | ⚠️ 低           | `utils/index.ts:128-137`                               | 键含连续/首尾连字符、数组入参、Symbol 键                                                          | `{'a--b':1,'-lead':3,'trail-':4}` → `{'a-B':1,'Lead':3,'trail':4}`，二次处理 → `{'aB':1,…}`（**非幂等**）；数组 → `{0:'x',1:'y'}`；Symbol 键丢失                                                                                                                                      | 归一化后校验（`key` 仍含 `-` 时再次 camelize），数组/Symbol 入参显式拒绝或文档标注                                                                         |
| **W11** | ⚠️ 中           | `utils/index.ts:54-55`；用例面 `index.spec.ts:15`      | 用它过滤字段/列配置，传入数组/Date/Map/Promise/装箱值                                             | 矩阵：`[]`/`Date`/`Map`/`RegExp`/`Promise`/`new Number(1)`/`globalThis` 全部 `true`；core 无行为用例（仅导出存在性断言）                                                                                                                                                              | 明确契约（若要求 plain object 改用 `isPlainObject`）并补真值矩阵用例                                                                                       |
| **W12** | ⚠️ 低           | `locale/index.ts:45-47`                                | `resolveLocaleName` 收到 truthy 非字符串（JS 调用）                                               | `resolveLocaleName(123)` → `TypeError: lang.toLowerCase is not a function`（`0`/`''` 因 falsy 短路回退 `zh-CN`）                                                                                                                                                                      | 补 `typeof lang !== 'string'` 守卫                                                                                                                         |
| **W13** | ⚠️ 低           | `locale/index.ts:8-11,22-26`                           | 任何运行期写入语言包（含测试）                                                                    | `Object.isFrozen(zhCN) === false`；改写 `zhCN['table.query']` 后 `localePacks['zh-CN']['table.query']` 同步变化                                                                                                                                                                       | `Object.freeze` 三包 + `localePacks`，或文档标注“共享单例、勿改”                                                                                           |
| **W14** | ⚠️ 低           | `locale/index.ts:77-84`                                | 直接调用 `format(undefined, …)` / 缺 key 的自定义 pack                                            | `format(undefined,{a:1})` → `TypeError: Cannot read properties of undefined (reading 'includes')`；core 无 `t()`/key 级回退（四包在 UI 层 `?? key` 兜底，缺键显示键名）                                                                                                               | `typeof text === 'string'` 守卫；如需 key 级回退应在 core 提供 `t()`（回退 zh-CN 而非键名）                                                                |
| **W15** | ⚠️ 低           | `utils/index.ts:69-74`                                 | 对象原型链上挂有**无 `prototype` 的构造函数**（箭头函数）                                         | `isPlainObject(Object.create({constructor:()=>{}}))` → `TypeError: Function has non-object prototype 'undefined' in instanceof check`（**lodash 同抛**，语义等价声明成立）                                                                                                            | 可选：`Ctor instanceof Ctor` 前加 `try/catch` 或先判 `Ctor.prototype`，使守卫自身不抛                                                                      |
| **W16** | ⚠️ 中           | `packages/core/__tests__/{locale,utils,path}.spec.ts`  | 文案值/边界被改动                                                                                 | 语言包**值**未被锁定：LC-04 只断 `typeof`、LC-05 只比 key，LC-03/LC-06 用内联字符串；`pick` 仅 3 例（继承/toString/空 keys）、`format` 4 例、`isObjectItem` 0 例、`camelizeProperties` 未覆盖双横线/数组/Symbol、降级/兜底告警文案无断言。core 215 用例全绿仍可漏掉 D2/D3/D4/W3/W8/W9 | 补：三包 `pagination.total`/`columnFallback` 的 `format` 结果断言、`isObjectItem` 矩阵、`pick(null)`/`__proto__` 用例、`format` 原型链键用例、告警文案断言 |
| **W17** | ⚠️ 低           | `path.ts:266`                                          | 段数组含 `-0`                                                                                     | `toPath([-0])` → `['0']`，lodash → `['-0']`（`normalizePathKey([-0])`/`join` 自洽为 `'0'`）                                                                                                                                                                                           | 在文档补记该差异，或对齐 lodash `_toKey` 的 `-0` 特判                                                                                                      |
| **P1**  | ⚠️ 中低（性能） | `path.ts:240`                                          | 路径含 `[` 且被高频调用（form/table 侧有调用点）                                                  | 200k 次：`toPath('hot[0].path.b.c')` 2ms（缓存）vs `normalizePathKey('hot[0].path.b.c')` **49ms**（每次重解析）                                                                                                                                                                       | 复用 `cachedParse(path).join('.')`，或加归一化结果缓存                                                                                                     |
| **P2**  | ⚠️ 极低（性能） | `path.ts:119`、`locale/index.ts:82`                    | 函数体内正则每次求值                                                                              | 无独立量测；200k 次点分 `toPath` 仅 3ms，量级可忽略                                                                                                                                                                                                                                   | 提到模块级常量（可选）                                                                                                                                     |

**发版结论**：不阻塞。建议修复顺序 **D3 → D2 → D1 → D4 → W9/W11/W6/P1 → W16（补用例）**，其中 D1/D2/D3 合计约 10 行改动。

## 8. 未完成项

1. **`toPropRecord` 无 core 侧对象可核**：全仓仅在 `packages/antdv-next-pro/src/shared/ui/index.ts:75` 定义，`packages/core/src/shared/**` 内不存在同名/同构实现 → 该核查项在本次范围内无对应代码（未测，未计入结论）。若需核查应单独授权 `antdv-next-pro`。
2. **`form/**`、`table/**` 未读**（按范围排除）→ 无法量化 D1/W3/P1 在表单/表格链路上的端到端可达性与调用频率（只做到文件名级命中统计，未读实现）。
3. **仅跑 core 包门禁**：`pnpm -r test`、`pnpm --filter "./packages/*" exec vue-tsc --noEmit`、prettier-check 未执行（只读审计的时间预算），故不覆盖跨包同构漂移。
4. **未做浏览器实机/SSR 复验**：探针运行于 `node v22.21.1`；`Object.freeze` 抛错、`structuredClone` 对 Proxy 的 `DataCloneError`、Ref 克隆形态未在真实浏览器/SSR 下二次确认（happy-dom 只覆盖了仓内套件）。
5. **未做内存/GC 量化**：缓存无界性只用“驱逐后实例变化”（E16）证伪，未测 RSS/堆增长曲线。
6. **时间预算内未测**：`set` 目标为自定义 `set` trap 抛错的 Proxy、`get` 触发抛错 getter、`camelizeProperties`/`pick` 在四包内的真实传参形态（范围外）。

## 9. 实测记录

### 9.1 命令与结果

| 命令                                             | 结果                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git status --porcelain`（只读）                 | 审计基线为**含未提交改动**的工作区：` M .changeset/review-top10-fixes.md`、` M packages/core/src/shared/path.ts`、` M packages/core/src/shared/utils/index.ts`、` M packages/core/src/table/index.ts`、`?? .changeset/fix-core-public-type-face.md`；审计前后**完全一致**（无仓库写入） |
| `shasum -a 256`（审计文件）                      | 见报告头（path.ts `13aa5b77…`、utils/index.ts `388eccb2…`、locale/index.ts `f2edd1e8…`、zh-CN.ts `ca864808…`）                                                                                                                                                                          |
| `pnpm --filter @qin-ui/pro-components-core test` | **11 文件 / 215 用例全部通过**（vitest 4.1.11，1.10s）→ 下列发现均未被现有用例覆盖                                                                                                                                                                                                      |
| `read` 只读核对 lodash 源码                      | `lodash-es/_baseSet.js:18`（`!isObject` 直接返回）、`:32`（`__proto__`/`constructor`/`prototype` 守卫）、`_baseAssignValue.js:13`                                                                                                                                                       |
| 注释卫生 grep/awk                                | 审计文件内 `TODO/FIXME/XXX/console.log/debugger` 命中 0；连续多行 `//` 注释 0                                                                                                                                                                                                           |

### 9.2 探针清单（均在 `/tmp/core-audit/`，import 仓库 `src`，测后已删除）

| 探针                     | 覆盖                                                                                                                                                              | 日志                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `shared-probe-path.ts`   | get/set 边界与 lodash 差分、±0/NaN 同值、告警去重、toPath/normalizePathKey 分档与冻结、缓存驱逐、isDangerousKey 矩阵与 9 组污染向量、模块实例隔离、200k 次性能    | `shared-probe-path.log`（94 行）  |
| `shared-probe-path2.ts`  | 数字/布尔裸路径、lodash 危险键真实行为、畸形括号语法、Vue `readonly`/冻结/seal、数字段建数组判定                                                                  | `shared-probe-path2.log`（51 行） |
| `shared-probe-utils.ts`  | isObjectItem 矩阵、pick 边界与 `__proto__`、camelize 矩阵/幂等/原型安全、isPlainObject 抛错面、cloneDeep 全矩阵（原生/降级/兜底/告警计数/循环/类型变形/代理解包） | `shared-probe-utils.log`（51 行） |
| `shared-probe-locale.ts` | format 原型链/缺参/重复/短路、语言包 key 与占位符三包对齐、冻结与可变性、resolveLocaleName 矩阵                                                                   | `shared-probe-locale.log`         |
| `shared-probe-gap.ts`    | cloneDeep 嵌套代理与实例隔离、pick 对拍 lodash、isIndexKey 对拍 lodash `isIndex`、camelize 误放行/幂等、数组入参                                                  | `shared-probe-gap.log`            |
| `shared-probe-proxy.ts`  | `structuredClone` 对裸 Proxy/嵌套代理/toRaw/ref 的抛错矩阵（用于确认降级路径）                                                                                    | 标准输出（已记录于 §3.1）         |

### 9.3 清理

- 已删除本次全部探针（6 个 `.ts` + 6 个 `.log`）与探针目录符号链接 `node_modules`；`/tmp/core-audit/` 内他方产物（`form-table.md`、`path-only.md`、`probe-*.ts`、`correctness.md` 等）**未触碰**。
- 仓库残留改动检查：`git status --porcelain` 输出与审计基线逐行一致（无新增/删除），仓库内无探针残留。
