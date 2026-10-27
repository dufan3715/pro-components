# @qin-ui/pro-components-core

## 2.1.1

### Patch Changes

- 1573e89: 补充 `useSearchFormExpand` 初值判定边界说明：`Date` / `File` / `RegExp` 等无可枚举自有键的非普通对象按“无值”处理，含可枚举键但值为 `undefined` 的空壳普通对象按“有值”处理。
- 1573e89: 补充 `resetQueryParams` 的分页重置边界说明：分页按初始化快照合并写，仅恢复快照中存在的键，运行期新增的分页键在重置后保留；搜索条件仍按快照批量覆盖。

## 2.1.0

### Minor Changes

- cd82522: 新增 `omit(object, keys)` 与 `omitBy(object, predicate)` 两个公共工具（core 本轮按 **minor** 发布）：
  - `omit`：返回新对象并剔除指定顶层键。拷贝自有与继承的可枚举属性（含 Symbol 键；数组入参不拷贝 Symbol 键，对齐 lodash）；`null` / `undefined` 入参返回空对象；不修改源对象；危险键（`__proto__` / `constructor` / `prototype`）不参与拷贝；仅处理顶层键，不解析 `a.b` 深层路径。数字 / 布尔键按字符串键比对（对齐 lodash `toKey`），`omit({ 1: 'a' }, [1])` 与 `omit(['x', 'y'], [1])` 均能正确剔除。
  - `omitBy`：返回新对象并剔除谓词返回真值的属性，谓词入参为 `(value, key)` 且必填（仅支持函数形态，不支持 lodash 的 iteratee 简写）。遍历自有与继承的可枚举属性（含 Symbol 键；数组入参不拷贝 Symbol 键）；危险键不参与拷贝；`null` / `undefined` 入参返回空对象；不修改源对象。典型用法：`omitBy(attrs, value => value === undefined)` 剔除未提供的绑定键。

  **发布口径说明**：本轮 core 新增公共 API，按语义化版本以 minor 发布；此前「core 仅 patch」的约定由本条目明确覆盖。

### Patch Changes

- 1f4620e: 补齐 core 的发布元数据（无运行时代码变更）：
  - `package.json` 新增 `repository` / `homepage` / `keywords`，npm 页面可回溯源码仓库；
  - `exports` 新增 `"./package.json"` 子路径，`import '@qin-ui/pro-components-core/package.json'` 不再报 `ERR_PACKAGE_PATH_NOT_EXPORTED`（工具链读取包版本/元信息可用）；四个 UI 包已在本次同步补齐同一子路径，五包口径一致。

- bdbd58d: 修复 `data-*` / `aria-*` 属性名被驼峰化破坏的问题：
  - **现象**：`camelizeProperties` 对全部 key 调用 `camelize`，`data-testid` 变成 `dataTestid`、`aria-label` 变成 `ariaLabel`，属性名在 DOM 上被破坏 —— 可访问性属性（`aria-*`）、测试选择器（`data-testid`）、第三方埋点属性全部失效。四个包的 `ProForm` 都是 `mergeProps(injectAttrs.value, camelizeProperties(attrs))` 且无白名单，直接下发宿主 `<Form>`，均受影响。
  - **修复**：`camelizeProperties` 对 `data-*` 与 `aria-*` 前缀的 key（大小写不敏感，如 `ARIA-live`）按原样保留，其余 key 仍转换为 camelCase。
  - **行为边界**：仅前缀为 `data-` / `aria-` 的属性名保名；`kebab-case` 属性（`user-name`、`row-key`、`on-row-click`）转换语义不变。
  - **回归**：`SU-04`（core 单元：转换语义 + 保名 + 驼峰变体不存在）、`PF-D1`（四包：带 `data-testid` / `aria-label` 的 `ProForm` 渲染后宿主 `<form>` 上属性名原样存在）。

  破坏性变更：无。

- 029d10b: 修复 `cloneDeep` 对 Vue 响应式数据静默降级为 JSON 拷贝的问题：
  - **现象**：`cloneDeep(reactive({...}))` / `cloneDeep(ref({...}).value)` 会把 `Date` 变成 ISO 字符串、`Map` / `Set` / `RegExp` / `Error` 变成 `{}`、`NaN` / `Infinity` 变成 `null`，并打印一条「已降级为 JSON 拷贝」的告警 —— 而数据本身完全可结构化克隆。受影响调用链包括 `useTable` 的列快照与 `resetQueryParams` 的重置快照。
  - **原因**：`cloneDeep` 直接把入参交给 `structuredClone`，而 Vue 的 `reactive()` / `ref.value` 都是 Proxy，`structuredClone` 对其必抛 `DataCloneError`，从而误入 JSON 降级分支。
  - **修复**：`cloneDeep` 入口先判断 `isProxy(value)`，是响应式代理则 `toRaw(value)` 解包后再克隆；JSON 降级与最终兜底路径统一使用解包后的对象。JSON 降级语义（含告警）对真正不可结构化克隆的数据保持不变。
  - **行为边界**：仅解包入口一层；若原始对象内部持有已响应式代理，仍走 JSON 降级路径（已在 JSDoc 中标注）。
  - **回归**：新增 `CR-008 [判别]` 用例 —— 响应式入参克隆后 `Date` / `Map` 类型与取值不降级、结果为非代理普通对象、与源快照隔离、且不产生降级告警，并覆盖 `ref.value` 形态。

  破坏性变更：无。

- c20e669: 修复 `useTable` 的列 `key` 规范化未覆盖元素级变异的问题：
  - **现象**：只有整体重赋值 `table.columns.value = [...]` 会自动补齐列 `key`；直接对数组做元素级操作（`columns.value.push(...)` / `splice(...)` / `columns.value[i] = {...}`）时新列没有 `key` —— 列控制（ColumnControl）下拉看不到该列，按 `key` 的 `setColumn` / `deleteColumn` 定位失效。
  - **原因**：`columns` 为普通 `ref`，补 `key` 只发生在构造、`setColumn` / `appendColumn` / `prependColumn` 与整体重赋值的同步监听里，元素级变异不经过任何规范化入口。
  - **修复**：`columns` 改为 `customRef` —— 内部经 `ref` 转发以**保持数组与元素的深层响应式以及原引用语义**；读取时幂等就地补齐**缺失**的 `key`（命中即跳过、不改写已有 `key`、不重建 `children` 数组），整体重赋值时先规范化再收编。原仅覆盖整体重赋值的同步监听移除，规范化入口收敛为一处。
  - **保持不变的契约**：
    - `@resizeColumn` 式就地变异列对象（`col.width = w`）照常生效（写入可见、渲染更新）—— 新增用例 `PT-A15` 锁定该契约；
    - 初始传入的数组仍为状态本体（`toRaw(table.columns.value) === 原数组`）；元素引用在多次读取间恒等；
    - `key` 兜底链（`dataIndex → prop → columnKey → 自增`）与冻结列的副本语义与既有 `normalizeColumn` 完全一致。
  - **行为边界**：只补齐缺失 `key`，不重写调用方显式提供的 `key`（重复 `key` 不做去重）。
  - **回归**：`TT-27`（`push` / 索引赋值后读取即补齐唯一 `key`）、`TT-28`（元素级插入的分组列递归补齐 `children`）、`PT-A15`（`resizeColumn` 契约）。

  破坏性变更：无。

- 8f55302: `useFields` / `useTable` 不再就地变异调用方传入的数组（`@mutates` 契约收敛，CR-016）：
  - **变更前**：`useFields(initFields)` 与 `useTable({ columns, dataSource, pageParam })` 直接持有调用方传入的**数组/对象引用**，因此 `appendField` / `prependField` / `deleteField`、列增删与整体重赋值（`table.columns.value = [...]`）会**就地修改调用方数组**（`push`/`unshift`/`splice`/索引赋值）。
  - **变更后**：入口对数组做**一次浅拷贝**（`dataSource`、`pageParam` 同理），内部增删与整体重赋值只作用于内部状态：
    - 调用方数组的**长度与元素位置不再被改写**；
    - **元素仍共享**（浅拷贝语义）：列/字段**对象**的就地变异（如 `resizeColumn` 式写 `width`）依旧双向可见；
    - `normalizeColumns` / `normalizeColumn` 对**列对象**就地补齐 `key` 的既有 `@mutates` 行为保持不变（仍是文档化契约）；直接调用这两个工具函数时传入的数组仍会被就地变异，仅 `useTable` 内部改为传入其浅拷贝。
  - **升级影响（行为变更）**：若你的代码依赖「传入的数组就是状态本体」（例如拿到 `table.columns.value` 后直接 push，期望原数组同步变化，或断言 `table.columns.value === 传入数组`），请改为通过 `table.columns.value` / `appendColumn` / `deleteColumn` 等实例 API 操作；仅读取元素对象的代码不受影响。
  - **迁移示例**：
    ```ts
    // 变更前（依赖数组共享）
    const columns = [{ dataIndex: 'name' }];
    const table = useTable({ columns });
    table.columns.value.push({ dataIndex: 'age' }); // 旧行为：columns 也被 push
    // 变更后：内部数组新增，columns 长度保持 1；如需同步请自行维护
    ```

- 9d2fa7b: `cloneDeep` 的降级告警归因修正：
  - **告警误报**：`cloneDeep({ fn, big: 10n })`（structuredClone 存在、无循环引用）与「数据带抛错 getter」此前都会输出「数据含循环引用且环境不支持 structuredClone」——两条前提皆假；现按真实失败阶段归因，文案给出 JSON 序列化与 structuredClone 各自的失败原因，并列出真实候选原因（BigInt、抛错的数据访问器、循环引用、不可结构化类型）。
  - **静默返回原引用**：快照失败（返回原引用、快照隔离失效）此前受「降级告警仅一次」去重约束，首次之后完全无声；现该分支**每次调用都告警**，`cloneDeep` 降级为 JSON 拷贝的类型变形告警仍保持一次性。
  - 告警不受构建模式门控：开发与生产环境一律输出（`console.warn` 行为与包内其它告警一致）。

  验证：判别用例 `SU-06`（一次性告警）、`SU-09`（按真实原因归因 + 每次失败都告警），回退即失败。

  破坏性变更：无（仅告警文案与输出时机，返回值行为不变）。

- 9d2fa7b: 两项边界口径按 owner 决策收敛（此前登记为待决策项）：
  - **`camelizeProperties` 的 `data-*` / `aria-*` 保名收窄为按取值形态判定**：取值为 **DOM 属性值**（字符串 / 数字 / 布尔，如 `data-testid="x"`、`aria-hidden="true"`）时按键名原样保留；取值为**组件 prop 形态**（对象 / 数组 / 函数，如 kebab 写法的 `data-source` / `data-columns`）时参与驼峰转换。
    - **变更前**：`data-` / `aria-` 前缀一律保名，`<ProTable :data-source="rows">`、`<ProForm :data-columns="[...]">` 这类 kebab 写法的驼峰 prop **永不生效**，最终作为 attribute 透传被静默忽略。
    - **变更后**：`data-source` → `dataSource`、`data-columns` → `dataColumns`；纯 DOM 属性写法不受影响。
    - 边界：数字取值仍按 DOM 属性处理（`data-index="1"` 形式的列表下标写法保持原样），需要列配置 `dataIndex` prop 时请用驼峰写法 `:dataIndex`。
  - **`isIndexKey` 对齐 lodash：仅有效数组下标建数组**（`0` ~ `2^32 - 2` 的非负整数）的路径段自动创建数组。此前的数字段一律建数组，`set({}, ['k', -1], 'v')` 得到 `{ k: [] }` 并把值挂成 `JSON.stringify` 不可见的隐藏属性；现按对象键处理（`{ k: { '-1': 'v' } }`，与 lodash 一致）。超出上限的整数段（`1e21`、`2^53`）同样按对象键处理。

  验证：判别用例 `SU-11`、`PT-07`（回退即失败）。

- cd0690c: `useFormData` 不再把调用方传入的初始数据对象直接收编为表单数据本体（`useForm` / `useTable` 的 `searchParam` 同样受益）：
  - **变更前**：`reactive(initFormData)` 直接把入参对象代理为表单数据，因此
    - 批量覆盖（`setFormData({...})` 的全量替换语义）会**真实 `delete` 调用方对象上的 key**；
    - 同一对象喂给两个实例（模块常量、`props.xxx`、多处共用的默认值）会互相污染；
    - `setFormData('a', 1)` 的顶层写入会同步改写调用方对象。
  - **变更后**：内部持有入参的**顶层浅拷贝**，上述写入只作用于内部数据；`formData` 引用稳定性、全量替换语义与 `resetQueryParams` 的快照行为均不变。**嵌套对象仍按引用共享**（与 `useFields` / `useTable` 数组的「一次浅拷贝」口径一致）：嵌套字段的就地变异对调用方可见。
  - `useTable` 的 `searchParam` 由此与 `pageParam` 的入参隔离口径一致。

  验证：判别用例 `FD-01`（改写为顶层隔离契约）、`FD-26`、`TT-37`（回退即失败）。

  **迁移提示**：若此前依赖「传入对象即表单数据本体」（例如创建表单后继续改写该对象期望表单同步变化，或断言 `form.formData === initFormData`），请改为通过 `form.formData` / `setFormData` 读写；仅读取表单数据的代码不受影响。

- cd0690c: core 的字段 / 列配置入参防御与列 key 唯一性：
  - **`useFields` 非数组入参**：此前传对象 / 函数抛 `TypeError: (initFields || []) is not iterable`，传字符串 `'ab'` 被**静默拆成 `['a','b']` 两个假字段**；现非数组入参回退空数组（与 `useTable` 的 `columns` / `dataSource` 同口径）。
  - **`useFields` 含非对象项**：`initFields` 含 `null` / `undefined` / 原始值时，此前 `getField` / `setField` / `deleteField` / `getParentField` 全部抛 `TypeError: Cannot read properties of null (reading 'fields')`（BFS 遍历是这些 API 的唯一入口，一个脏项使全部字段查找与动态编排失效）；现构造期剔除非对象项，且 BFS 对 `children` 中的非对象项免疫。嵌套 `children` 内的脏项原样保留在子数组中，但不参与遍历。
  - **`appendColumn` / `prependColumn` 多位点插入的重复 key**：`{ all: true }` 命中 ≥2 个位点时此前克隆列对象沿用显式 key（实测得到 `["a","x","b","x"]`），与「每个列具备唯一 key」的契约不符，宿主表格会出现重复键告警或列错乱；现每个位点获得独立克隆列，克隆列及其 `children` 各层重新分配 key、互不共享，调用方的列对象不再被回写。
  - **`normalizeColumn` 的非法列配置**：环状 `children`（自引用 / 互引用）此前直接爆栈 `RangeError: Maximum call stack size exceeded`（`useTable` 构造期即抛）；`Object.preventExtensions` / `Object.seal` 的列对象补 key 时抛 `TypeError: Cannot add property key, object is not extensible`。现递归带访问集，环状引用原样保留不再深入；「不可扩展」判定改用 `Object.isExtensible`（较 `Object.isFrozen` 更准确），降级为解冻浅拷贝副本。

  验证：新增判别用例 `FF-47` / `FF-48` / `TT-35` / `TT-36`（回退任一修复即失败）。

  **行为变化提示**：多位点插入的克隆列不再保留调用方传入的显式 key（`dataIndex` 不再作为回退比对参与 `setColumn` / `deleteColumn` 定位），请改用列查找函数（`appendColumn(c => …, …)` 同款 `ColumnFindBy`）或自动 key（`__col_N`）定位这些克隆列；环状 `children` 的克隆按位点复用同一副本，不再无限递归。

- 84e2eaf: 修复 core 的 falsy key 守卫、表单代理 `delete` 与注入类型：
  - **`0` / `''` 作为合法 key 不可用**（CR-020）：`useFields` / `useFormData` / `useTable` 中的 `if (!path)` 守卫把 `0` 与 `''` 当作「未传参」直接返回，数组下标场景（`setColumn(0, …)`、`getFormData(0)`、`setField(0, …)`）与空字符串字段名静默失效。现改为仅 `undefined` / `null` 早退；`useFormData` 的读写路径对数字/布尔 key 统一经 `normalizePathKey` 归一，`useTable` 的列匹配在遍历外一次性归一后进行字符串比对（不进入热路径）。
  - **`createFormProxy` 的 `delete` 被静默吞掉**（CR-018）：代理缺少 `deleteProperty` trap，`delete proxy.key` 返回 `true` 但实例属性仍在。现转发到当前实例（实例缺失时仍静默返回 `true`）。
  - **`useSearchFormExpand` 的 `columnGap` 为死配置**（CR-027）：折叠高度计算只读取 `rowGap`，`columnGap` 从未参与，已从 hook 的 props 类型中移除（列间距由栅格布局自身消费，不经该 hook）。
  - **`InjectionFormSlotsKey` 类型与实际注入形态不符**（CR-028）：声明为 `InjectionKey<Record<string, any>>`，实际 provide 的是 `ShallowRef<Record<string, any>>`，消费端必须断言绕过类型系统。类型已改为 `InjectionKey<ShallowRef<Record<string, any>>>`。

  行为变更：数字与空字符串 key 现在会命中真实键位（此前静默返回/跳过）；`columnGap` 不再出现在 `useSearchFormExpand` 的 props 类型中（运行时忽略多余键，不影响既有调用）。

  破坏性变更：无（均为缺陷修复；`columnGap` 仅为类型面收敛）。

- 9cb6cdd: core 的路径边界判定与非法入参兜底：
  - `appendField` / `prependField` / `appendColumn` / `prependColumn` 的路径判定由 falsy 改为 nullish：`0` 与 `''` 现在按**已提供路径**处理（与「`0` 是合法字段/列 key」一致）。**行为变化**：当提供了路径但没有匹配的分组时，此前会被当作"未传路径"而追加到顶层末尾，现在为**静默不插入**；未传 `path`（`undefined` / `null`）的行为不变（仍为顶层插入）。
  - 非数组入参恢复兜底：`useTable` 的初始化列、列整体重赋值、初始化数据源三处改为 `Array.isArray(x) ? [...x] : []`，`as any` 或 JS 调用方传入非数组时不再抛 `TypeError`（与浅拷贝改造前的行为一致）。
  - 文档口径校准（无行为变更）：`toPath` 的缓存/冻结行为按分支陈述（仅非空字符串分支返回缓存并冻结的同一实例）；`toPath` 与 `normalizePathKey` 的 JSDoc 写明「数组段含 `null` / `undefined` 时 `join('.')` 不变量不成立」的边界；`isDangerousKey` 标注 `@internal`（仍不进包根导出面）。

- 9d2fa7b: `get` / `set` 的路径入口统一归一，修复裸数字 / 布尔路径的错误读写：
  - **变更前**（TS 签名已排除、JS 或无类型调用可达）：`get({ a: 1 }, 0)` 返回**整个对象**（`path.length` 为 `undefined`，遍历整体跳过）；`set({}, 0, 'v')` 写入键名 `"undefined"`（`{"undefined":"v"}`）。
  - **变更后**：`get` / `set` 对非字符串路径统一经 `toPath` 归一——数字 / 布尔标量按单段键读取或写入（`get({ 0: 'v' }, 0)` → `'v'`、`set({}, 0, 'v')` → `{ 0: 'v' }`，与 lodash 一致）；段数组逐段 `String` 归一；空段数组、`null` / `undefined`、对象与 symbol 路径不产生读取与写入（`get` 返回 `undefined`，`set` 原样返回目标对象）。字符串路径行为完全不变。
  - `normalizePathKey` 的括号分支改为复用模块级解析缓存（同路径仅解析一次）。

  验证：判别用例 `PT-05` 与 lodash `get` / `set` 逐例对拍（回退即失败）。

  破坏性变更：无（此前为错误行为；若曾有代码依赖 `set(obj, 0, v)` 写入 `obj.undefined`，需改为显式字符串路径）。

- 9d2fa7b: core 的文档口径与安全边界修正：
  - **JSDoc 归位**：`camelizeProperties` 的 JSDoc 此前被模块内 `const verbatimAttrRE` 隔断而挂到该私有常量上，公开 API 在产物 d.ts 中零文档；现归位到函数本身。
  - **`@internal` 口径校正**：`isDangerousKey` 的说明与相关 Changeset 文案统一为「包内工具、未纳入包根导出面」（`exports` 未声明子路径，包外不可达）。
  - **`format`（locale）** 的占位符解析改用自有属性判定：`format('{toString}', {})` 不再把原型链上的成员当作参数替换（此前会输出原生函数源码）。
  - **`pick`** 跳过危险键（`__proto__` / `constructor` / `prototype`）：以 JSON 数据为源时不再替换结果对象的原型（复用包内 `isDangerousKey`）。

  新增判别用例 `LC-08` / `SU-08`。

  说明：`useSearchFormExpand` 为 qin-ui 各包内部使用的 Hook（经各包 `shared/core` 内部 barrel 引入，不在四个包的公共入口链上），其返回类型 `UseSearchFormExpandReturn` 维持包内可见范围，不纳入 core 包根导出面。

- bd888e9: 统一「字段标识」契约（宿主标识键优先于 `path`）并修复 element 的两处相关问题：
  - **element：`ProLocale` 类型放宽**。此前 `ProLocale = typeof zhCN`（`as const` 字面量）使 `Partial<ProLocale>` 只接受与内置文案逐字相同的值，`:locale="{ 'table.query': '搜索' }"` 必然类型报错。现为 `Record<keyof typeof zhCN, string>`，保留本包 `date-picker.*` 等扩展键，取值放宽为任意字符串。
  - **element：字段标识改为 `prop` 优先**。`el-form-item` 的标识属性是 `prop`（对应 antd/vant 的 `name`），但此前实现照搬了 `name ?? path`：`{ path: 'a', name: 'b' }` 会绑到 `b` 且 `name` 被吞掉，`{ prop: 'a', path: 'b' }` 会被 `path` 覆盖。现统一为「宿主标识键优先于 `path`」——element 取 `prop ?? path`，`name` 不再参与标识解析，作为控件自身属性透传（`el-form-item` 无 `name` prop）。
  - **core：标识键可配置化（新增 API）**。新增 `resolveFieldIdentity(field, keys)`、`DEFAULT_FIELD_IDENTITY_KEYS = ['name', 'path']` 与 `UseFieldsOptions`；`useFields(fields, { fieldIdentityKeys })` 与 `useForm(initData, fields, root?, options?)` 支持自定义标识键序。此前 core 的字段查找 API（`getField` / `setField` / `deleteField` / `getParentField`）固定按 `name ?? path` 解析，与 element 的渲染标识不一致（`{ prop: 'a' }` 时 `getField('a')` 静默 miss），现字段读写、表单域标识与查找 API 共用同一解析结果。
  - **`antd-vue-pro` / `antdv-next-pro` / `vant-pro`**：hook 内联的 `name ?? path` 收口到 `resolveFieldIdentity(field)`（默认键序），并各补 1 条规则锁用例；`shared/core` 补再导出以符合统一导入契约。

  **行为差异披露（四个 UI 包）**：标识解析结果统一经 `normalizePathKey` 归一化，渲染到 DOM `path` 属性与 `:path` 的值随之变化 —— 方括号写法（如 `path: 'a[0]'`）由 `a[0]` 变为 `a.0`；number / boolean 标识（如 `path: 0`）由空串变为 `"0"` / `"false"`。语义等价，且此前 hook 与 core 查找对该写法本就不一致；若业务代码读取过 DOM `path` 属性或依赖 `:path` 的原样透传，请按归一化后的值适配。

  **迁移提示**：
  1. element 下若曾用 `prop` 表示「仅校验路径、值绑定用 `path`」的解耦写法，现 `prop` 即字段标识（优先于 `path`），请改用 `path` 单独声明绑定路径；
  2. element 下若曾仅用 `name` 作字段标识，请改用 `path`（该写法在 element 类型层本就不受支持：`BaseCommon` 只声明 `path`，`name` 由控件 props 合入）。

- 修复终审报告中记录的行为回归与边界问题：
  - **vant-pro**
    - 自定义控件（组件对象 / render 函数 / ProForm 插槽 / `componentMap` 覆盖项）按 attrs 透传契约整体接收 Field 层属性，含 `label` / `rules`（由控件自行渲染）；内置控件仍按其声明的 props 面剔除未声明键。
    - 字段级 `disabled` 的字符串形态与宿主 Boolean prop 解析一致：`''` 与 `'disabled'` 为 `true`，其余取真值；`null` / `undefined` 回落 Provider 注入值。
    - `component` 为原生元素（如 `'input'`）时按 `value` / `checked` 回显并回写输入，不再生成无用的 `modelvalue` 属性。
    - 原生元素回退合并字段配置的 `onInput` / `onChange`（此前被内部监听器覆盖），输入与变更事件均正常写回字段值。
    - 自定义控件（对象组件 / render 函数 / `componentMap` 覆盖项 / ProForm 插槽）接收 `path` prop，与 README 的字段路径契约一致。
    - `useFormPopup(false)` 在 `<ProForm :form="form">` 场景下路由到传入实例的 `formPopup`，不再注入未参与渲染的兜底弹层。
  - **antd-vue-pro / antdv-next-pro**
    - 包装组件或插槽内嵌宿主控件时，单次输入只触发一次校验（`BaseField` 派生 FormItem 校验上下文，变更统一经字段事件回传）。
    - `v-model:size` 初值为 `undefined` 时不再短路 Provider 注入尺寸；`Control` 回写仍优先。
    - 显式 `:columns` 模式下渲染源不受 `table.setColumn` 影响，列控入口隐藏（`control.columnControl` 在该模式下不生效，文档已注明）。
    - `default` 插槽行为保持透传宿主表格（可用于宿主列组件声明列），JSDoc 补充说明。
  - **element-plus-pro**
    - `table.searchForm` 的字段查找 / 读写与 `prop`/`path` 渲染标识共用同一解析结果（core `useTable` 新增 `fieldIdentityKeys` 并通过适配层透传）。
    - `SizeControl` 高亮项跟随表格有效尺寸（Provider 注入 / 显式绑定 / 宿主 ConfigProvider）。
    - 显式 `:columns` 模式下列控入口隐藏（`control.columnControl` 在该模式下不生效，文档已注明）；`default` 插槽提示单独立项迁移说明（见对应 changeset）。
    - 环状分组列（含 `a→b→a` 互引用）按不可变祖先路径截断，不再重复展开或栈溢出。
    - `peerDependencies.element-plus` 下限调整为 `^2.14.5`：`TableEmits` 类型自 2.14.5 起由宿主根导出，与 `devDependencies` 对齐。
  - **四包同构**
    - 显式 `undefined` 绑定（如 `v-bind="{ disabled: props.disabled }"`）不再冲掉 Provider 注入值（合并前剔除 `undefined` 键）。
    - 运行期新增宿主 attrs key（如挂载后再传 `columns` / `border` / `disabled`）参与 `formAttrs` / `tableAttrs` 等派生（统一 `useReactiveAttrs`），不再停留在旧 attrs 快照。
    - 包根补齐文档承诺的公开类型（type-only）：`ColumnControlConfig`（antd / antdv-next / element）、`ColumnScope`（element）、`ValueFormatter`（四包）、`PageParam`（antd / antdv-next / element）；`Base` 从 ProForm 文档 Types 列表移除（未出现在公开签名中）。
    - 移除无对应公开组件的 `ProFormItemProps` / `ProFormItemInstance` 类型导出（antd / antdv-next / element）；`TableEmits` 保留为 element 宿主事件类型并补充说明。
    - Provider 的 `pro-form.grid` 在未显式传 `grid` 时生效；显式 `grid=false` 仍可关闭。
    - 运行期新增自定义组件键的 `componentVars` 同样下发到字段。
  - **core**
    - `useTable`：多位点插入的环状 `children` 不再爆栈；`columns` 含 `null` / 空位时列操作不抛错；数字 / 布尔列 `key` 按字符串形态命中 `setColumn` 等查找；冻结 / 密封列与环状 `children` 组合时复用同一次规范化结果，连续读取不再逐层加深副本；直接向 `columns.value` 写入冻结列时跳过无法就地补齐的 `children` 并提示一次，受支持的初始 `columns` / `setColumn` / `appendColumn` 入口仍会复制并补齐 `key`；`setColumn` 的 merge 分支先复制顶层配置，冻结列不再抛错，调用方 `children` 数组不被替换；冻结 `children` 的缺失 key 检查按数组缓存，重复读取不再全树扫描；冻结列提示按实例去重，文案含 `prependColumn`。
    - `useFields`：环状 `fields` 下 `getField` / `setField` / `deleteField` / `appendField` / `getParentField` 遍历终止；`updateType: 'rewrite'` 就地重写并保持字段对象身份（渲染 key 不漂移）；多位点插入逐层克隆嵌套 `fields`。
    - `useFormData`：空段数组 / 对象 / Symbol 路径不再写入空字符串键；段数组保留字面量段语义（`['a.b']` 不重解释为嵌套）。
    - `useSearchFormExpand`：`cleanupObservers()` 复位初值判定状态，`updateHeights()` 重建观察后可再次产出初值自动展开结果。
    - `omit` / `pick` 的数字 / 布尔键按 `toKey` 归一（`-0` 保留为 `'-0'`）；新增 `omitBy`（见对应 changeset）；`DEFAULT_FIELD_IDENTITY_KEYS` 冻结为只读常量，外部无法再改写全进程默认键序。
    - 新增 `useReactiveAttrs()`：把组件 attrs 同步为浅响应式快照，供包装组件的派生 computed 响应新增 / 删除的宿主属性。
    - 四个桌面包的 `tsconfig.json` 不再把 `types` 收窄到 `node`，消费方 `extends` 时无需自行安装 `@types/node`。

- 5a8a20d: 修复字段配置中含 `null` / 原始值项时的渲染期崩溃：
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

- a113993: 修复 `useSearchFormExpand` 的五项用户可见缺陷（四个 UI 包的 `SearchForm` 与 `ProTable` 搜索区共用本 Hook）：
  - **初值自动展开后被打回折叠**：隐藏区有已填写条件时 Hook 会自动展开，此后任意一次 ≥2px 的重测（窗口 resize、字段增减、textarea 自适应）都会把 `expandStatus` 无条件写回 `expand` 配置初值，用户看到已填写的条件窗口一抖就收起。现「初值判定」结果一次性产出，后续重测保持当前展开状态（`isManualToggle` 手动锁定语义不变）。
  - **旧的 IntersectionObserver 排队回调会断开新实例**：每次测量都 `disconnect()` 后重建 IO，先前入队的回调执行时操作的是闭包变量指向的**新**实例，导致新判定被断掉、自动展开丢失。现判定复用同一 IO 实例（仅补登记新元素），回调内断开的是自身实例，并以代际计数丢弃实例切换前入队的过期回调。
  - **折叠态多显示行**：行元素「坐标链不可测」（隐藏、`display:contents`、跨 shadow/iframe 等）时此前被静默丢弃后继续测量，导致第 minExpandRows 行的边界取到更靠后的行，折叠高度偏大（实测多显示一行）。现任一元素坐标链不可测即整组放弃，折叠高度回退行高算术。
  - **非 grid 布局下 `heightStyle` 为 `'0px'`**：`collapseHeight` 只在 grid 布局计算，inline 布局下保持初始值 `0`，直接消费该 Hook 的调用方会拿到 `heightStyle === '0px'`（四个适配层当前只在 grid 分支应用该样式，属潜在踩坑）。现 non-grid 或未启用折叠时 `currentHeight` 为 `'unset'`、`heightStyle` 为 `undefined`（**行为变更**：此前读到的 `0` / `'0px'` 变为 `'unset'` / `undefined`）。
  - **`cleanupObservers()` 后永久失明**：调用后残留的 `observedFormEl` / `observedItemEls` 让后续测量认为容器与行元素「已观察」，既不再 `observe` 也不重建容器观察。现该函数复位全部观察与测量状态，随后的 `updateHeights()` 会重新建立容器与行元素观察。

  验证：新增判别用例 `SE-12` ~ `SE-16`（回退任一修复即失败）；examples 的 SearchForm 工作台可用于真实浏览器复核。

  破坏性变更：无。

- 300f80b: 修复 `toPath` 的非字符串入参行为，并让共享解析缓存不可被就地修改：
  - **现象**：`toPath(123)` / `toPath(true)` / `toPath({})` 抛 `TypeError: p.indexOf is not a function`、`toPath(['a', 'b'])` 抛 `TypeError: p.split is not a function`；同时 `toPath` 返回的是模块级解析缓存中的**同一数组实例**，写方一旦就地修改即污染后续所有同路径解析。
  - **修复**（以 lodash `toPath` 为对标基线，与 `normalizePathKey` 口径一致）：
    - 入参放宽为 `unknown`：数组 → 逐段 `String`；`number` / `boolean` → 单段 `String(v)`；`null` / `undefined` / 对象 / symbol → `[]`；字符串路径行为完全不变。
    - 与 `normalizePathKey` 的对齐口径：两者逐段 `String` 后拼接，普通路径下 `toPath(v).join('.') === normalizePathKey(v)`；数组段含 `null` / `undefined` 时口径不同（`toPath(['a', null])` 为 `['a', 'null']`，`normalizePathKey(['a', null])` 为 `'a.'`），以各自 JSDoc 记录的行为边界为准。
    - 解析结果写入缓存时 `Object.freeze`（仅创建时一次性，不做逐次 `slice()` 拷贝）—— 只读方零影响，写入方立即抛 `TypeError`，不再可能静默污染缓存。
  - **与 lodash 的有意分歧（用例显式锁定）**：
    - 对象与 symbol → `[]`（lodash 产出 `['object Object']` 与原样 symbol 段，均不可用作路径 key）；
    - 小数 → `['1.5']`（lodash 先把数字 `toString` 再按点分拆为 `['1','5']`）。
  - **对齐 lodash 的部分**：数组、整数、布尔逐项对拍一致；`null` / `undefined` / 空字符串同样返回 `[]`。
  - **只读契约说明**：返回值仍为缓存中的同一实例（保持零分配），已冻结；antd 的 `NamePath` 类型要求可变数组，故未改用 `readonly string[]` 类型。

  破坏性变更：无（字符串路径行为与返回值内容不变；非字符串入参此前会抛错，现按上述规则返回确定性结果）。

- cc83f0b: 修复代码评审 §2.3 Top-10 优先修复项（其余 P1 项按决策暂不纳入本轮）：
  - **表格**：列 `hidden` 统一按响应式解包（`Ref` / getter 形态不再被永久隐藏），覆盖三包 `ProTable`、`ColumnControl` 与 core 的搜索字段可见性判定；`addIndexColumn` 默认值口径统一为 `true`——README props 表原写 `false`，与 Provider 默认表、运行时实现矛盾，本次以运行时行为为准修正文档。
  - **表单**：未传 `:form` 的 `ProForm` 兜底表单实例改为 `setup` 同步期创建，消除 `provide() can only be used inside setup()` 告警，兜底实例的数据 store 注入恢复生效；element-plus / vant 的分组字段 `disabled` 向子字段传播（element 的禁用上下文 provider 改为「继承 + 未声明不改写」，vant 以 prop 显式透传）。
  - **core**：批量 `setFormData` 过滤 `__proto__` / `constructor` / `prototype` 危险键（复用包内工具 `isDangerousKey`，未纳入包根导出面），服务端下发的初始数据不再可替换表单对象原型；嵌套字段路径 JSDoc 示例更正为完整点分路径（`address.city`）。
  - **测试基建**：`core` 表格用例去掉对被 gitignore 的 `es/index.js` 产物的子进程依赖，改为进程内断言；三包 UI 测试中「`if (el.exists())` 守卫导致的零断言通过」全部改为硬断言并补齐 `searchFields` 前置（含 antd / antdv-next 的 `SizeControl` 用例改为真实交互）；「手动展开不被自动测量覆盖」判别用例改为二次测量越过死区，经突变验证可失败；element「点击查询」改为只点击 + `attachTo: document.body` 验证原生隐式提交路径；补齐 `addIndexColumn` 默认与反向用例。

  破坏性变更：无（`addIndexColumn` 仅修正文档默认值，运行时行为未变）。

## 2.0.6

### Patch Changes

- 修复 ProTable SearchForm 在 Modal/Dialog 缩放过渡内挂载时折叠高度测量错误（如 antd Modal zoom 动画期间挂载，折叠高度被错误计算为 28.8px 并误显示展开按钮）
  - 折叠高度改为按真实行边界测量（第 minExpandRows 行的底部），不再以首字段行高乘行数推算：含 textarea 等不均匀行高字段的表单，折叠/收起时不再拦腰截断字段所在行；
  - 行边界测量沿 offsetParent 坐标链累加布局盒读数（offsetTop / offsetHeight）：栅格列祖先（如 antd Col 默认 position: relative）导致行元素与表单不共享坐标系时，行边界依然正确测量，不再出现收起态全量展开（无折叠效果、无展开按钮）；
  - 行高与自然高度读取改用布局盒属性（scrollHeight），测量读数不受祖先元素 transform 缩放影响，Modal zoom 过渡首帧即可测得正确高度；
  - ResizeObserver 同时观察表单容器与全部顶层行元素，textarea 等自适应高度字段随内容变化长高/变矮后，收起态与展开态高度均自动重测；
  - 行数不足 minExpandRows 或行边界不可测时，折叠高度取自然高度（全量展示、不显示展开按钮）/ 回退既有行高算术。

## 2.0.5

### Patch Changes

- a4734c4: 修复 `useTable` 返回的 `columns` 整体重赋值（`columns.value = [...]`）后新列不补齐 `key` 的问题：此前仅初始化、`setColumn`、`appendColumn` / `prependColumn` 会为缺失 `key` 的列补齐唯一标识，整体重赋值的新数组会保持无 `key` 状态，导致列控制（ColumnControl）看不到新列、按 `key` 的 `setColumn` / `deleteColumn` 定位失效。现在整体重赋值时会同步对新数组就地补齐缺失的 `key`，与初始化行为一致，且不改变数组与列对象的引用，直接变异列对象（如拖拽调宽 `col.width = w`）的语义不受影响。

## 2.0.4

### Patch Changes

- 修复 ProForm 在 `:form` 运行期置空（条件渲染/Tab 切换/异步加载表单实例）时抛出 `TypeError: Invalid value used as weak map key` 导致渲染中断的缺陷。未传或运行期清空 `form` prop 时，ProForm 现在回退到惰性创建的内部表单实例，子组件经注入代理的读写全部路由至该回退实例；同时 `formKey` 生成增加空值守卫双保险。外部传入的旧实例数据不受回退表单影响。

  修复 `useTable()` / `useTable(undefined)` 无参调用时抛出 `TypeError: Cannot read properties of undefined (reading 'columns')` 的缺陷，未传配置对象时回退默认配置（空列/空数据源/默认分页）。

  修复无 `path` 配置字段的渲染 key 退化为数组索引的问题：ProForm/BaseFormItem 现以字段对象本身为身份分配稳定 key（WeakMap 自增 id），字段插删/重排/隐藏过滤时组件实例按对象身份复用，不再随数组位置漂移错位（此前无 path 的分组/布局字段插删后，后续字段的组件状态会复用到错误实例上）。element-plus 的表格列渲染器（无 key/prop 列）同步修复。

  修复 `setColumn(key, { children: [...] })` merge 模式下新增子列不补齐 `key` 的问题：此前 merge 合并新增的分组子列没有 key，后续按 key 定位该子列（setColumn / deleteColumn / 列显隐控制）会静默失效；现在子列 key 与初始化列配置保持同一补齐规则（优先 dataIndex/prop，回退实例级自增标识）。

  修复 ProTable 查询的 loading 竞态悬挂缺陷：此前若 `search` 回调按条件返回非 Promise（如本地数据同步返回），先发起一次异步查询再触发同步查询时，异步请求结束后 loading 永远保持为 true 不复位。现在同步查询不推进竞态序号，在途异步请求结束后 loading 正常复位。同时，开发环境下对「同时配置 `:search` prop 与 `@search` 监听」（后者不会执行）及「search 未返回 Promise」两种配置误用输出一次性告警。

  优化字段实例访问器的挂载方式：`field.getFormItemRef()` / `field.getComponentRef()` 等实例访问器改用不可枚举属性定义，不再出现在 `Object.keys` / 展开运算中（此前作为可枚举属性会随字段配置对象遍历泄漏）；字段配置对象不可写时（如被 `Object.freeze`）渲染不再受影响，改为输出一次性告警并跳过访问器挂载。

  修复分组字段（配置 `fields` 嵌套）的栅格属性被静默丢弃的问题：此前分组字段的栅格容器只保留 `span`（默认 24），显式配置的 `offset`/`xs`/`sm`/`md`/`lg`/`xl` 等栅格属性被丢弃。现在分组字段与普通字段走同一栅格属性透传规则，仅 `span` 保持"未显式配置时默认整行（24）"的分组语义。

  修复 ProForm 动态插槽（Slot Teleporting）在运行期增删后不生效的问题：此前父组件运行期新增或移除以字段 path 命名的插槽时，字段渲染不会随之前后切换（下游取到的是挂载期的插槽快照）。现在插槽集合以响应式引用注入并在 ProForm 每次更新后同步通知，父组件运行期增删具名插槽可被字段即时感知。

  优化配置双参 `valueFormatter`（set 转换函数声明第二参 oldVal）字段的输入性能：此前每次输入都会对旧值执行一次深拷贝（大字符串/大对象逐字符输入时明显卡顿）。现在旧值为原始类型（字符串/数字等不可变值）时直接引用传递零拷贝；旧值为对象类型时仍保持深拷贝快照隔离语义（formatter 内变异不会污染表单现值）。

  优化 ProTable 列显隐控制的变更开销：此前在列控制下拉中勾选/取消任意一列（或全选）会对全部可控列逐一执行列变更（每列触发一次全表列遍历，50 列表格一次操作为 O(n²) 次遍历）。现在仅对 hidden 状态真实发生翻转的列执行变更，未变化列零写入，全选/反选大列数表格不再卡顿。

  内部稳定性优化：vant-pro 的语言检测改从 vant 主入口导入（此前依赖 `vant/es/locale` 深路径）；element-plus-pro 移除非标准的 `src/` 自引用路径改为相对路径（构建器变化即断的隐患）；antdv-next-pro 对包内两个同名不同源的 `useConfig` 完成消歧重命名，避免维护者错拿。

  修复 vant-pro 四项字段组件缺陷：
  1. **Signature 弹层确认丢值**：vant Signature 组件无 v-model，签名图经 `submit` 事件载荷传出——此前弹层确认后写回的永远是打开时的初值，签名静默丢失。现在确认时从 submit 载荷的 `image` 字段取值写入表单。
  2. **内联选择器字段校验失效**：内联（非弹层）的 date-picker/picker/cascader/area 字段未向外层 Field 组件传值，required 等规则校验取值恒为空、必填校验永远失败。现在内联字段向外层 Field 绑定 `model-value`（vant Field 的取值链路），校验可取到真实值。
  3. **事件双触发**：字段配置的 `onXxx` 事件此前同时绑定内层组件与外层 Field（冒泡类事件一次点击执行两次）。现在事件仅绑内层组件。
  4. **实例访问器缺失**：字段对象上的 `getComponentRef` / `getComponentComputedProps` 访问器此前未挂接、实例登记也未按字段原始对象（toRaw）落键，`getComponentRef` 调用永远取不到实例。现在与其他三包对齐：访问器可正常调用，且传入初始化时的原始字段对象即可命中。

  修复 element-plus-pro 两项：
  1. **搜索表单回车无反馈**：查询按钮为 submit 类型，但表单 submit 事件此前被拦截且未接入查询——在输入框内按回车没有任何响应。现在回车与点击查询按钮统一经表单 submit 路径触发查询（每次提交独立触发，快速连续回车/点击不丢事件）。
  2. **数据源优先级链清理**：移除对不存在属性的读取（恒为 undefined 的死代码分支），`:data` / `@data` / `:table` 的数据源解析路径更清晰。

- 修复 npm 安装后 IDE「转到定义」链路断裂：五包 tsconfig 改为自包含（随包发布，不再 extends 仓库相对路径），UI 包组件间导入由 index.ts 桶改为 .vue 源文件直连。外部项目经 declarationMap 落入包内 src 后可沿 import 链持续跳转，无 API 变更。

## 2.0.3

### Patch Changes

- 206e205: docs(source-comments): 全包源码注释完善——面向 sourceMap 进源码阅读场景

  面向「使用方经 declarationMap / sourceMap 进入包源码阅读」的场景补齐与修正注释，运行时行为零变化：
  - **core**：补齐关键逻辑段注释——`useForm` 的入参分派 / root 注入回退链 / `createFormProxy` 各 trap（实时取实例 + methodCache 引用记忆化）、`useFormData` 的注入复用与批量覆盖「先删后合」语义、`useFields` 的路径缓存回验自愈 / BFS 建索引 / 两段式降序 splice、`useTable` 的分页白名单 / 快照恢复 / DFS 匹配 key→dataIndex 顺序 / 列 key 兜底链、`path.ts` 的断裂语义与中间层建层规则、`useSearchFormExpand` 的测量驱动源与 RO 生命周期、locale 繁体判定顺序；
  - **UI 四包**：补齐 `ProForm` 的 `:key="formKey"` 子树重挂载契约注释（三包同构）、antdv-next 的 attrs.disabled 归一下发、element-plus 的 `@submit.prevent` 与 `onSizeChange` 重置回第 1 页、vant 的共享弹层容器 / popup 提交语义 / formPopup 附加策略；
  - **JSDoc 偏差修正**：三桌面包 `useTable` 的 `resetQueryParams` 由「重置分页到第一页」更正为「恢复到初始化快照」；三包 `SearchForm` 文档的 IntersectionObserver 职责描述与实现对齐；
  - **注释规范落地**：超过 1 行的注释统一为 `/* */` 块注释（AGENTS.md §2.2 新规），`// prettier-ignore` / `// eslint-disable-next-line` 工具指令对保留。

  纯注释变更，公开 API 与运行时行为零变化（五包 build / 454 测试 / vue-tsc / prettier 全绿）。

- 206e205: fix(path): 告警去重集合 `warnedPaths` 增加容量上界 (R-23)

  `pathCache` 有 5000 上限 + FIFO 批驱逐，但 `warnedPaths` 只增不减：长时运行进程中动态拼接的海量互异非法路径（如把用户输入直接当 path）会使该集合缓慢无界增长。
  - `warnedPaths` 套用与 `pathCache` 相同的策略：5000 上限，超限 FIFO 分批驱逐最旧的 10%；
  - 驱逐逻辑抽为共用 `evictOldestBatch`，两处存储复用同一实现；
  - 行为影响：被驱逐的早期路径再次出现时会重复输出一次告警（仅 dev 提示噪音，无功能影响）；稳态内存占用有界（约 5000 条路径字符串）；
  - 新增判别测试：灌满 5001 条互异非法路径后，最近路径不重复告警、最早路径（已被驱逐）可再次告警。

- 206e205: fix(use-search-form-expand): 初始展开状态与配置对齐，未测量前不施加高度约束 (R-12)
  - `expandStatus` 初值由写死的 `true` 改为与 `expand` 配置对齐（默认折叠、`expandStatus: true` 配置初始展开），消除「测量前按展开渲染、测量完成后收缩」的状态偏差；无溢出场景下状态不再泄漏为初始 `true`；
  - `currentHeight` 在首次测量完成前（`proFormHeight` 仍为 `'unset'`）返回 `'unset'`，不施加高度约束——避免初值折叠化后测量前渲染出 `0px` 空白帧，与未开启 `expand` 的渲染行为一致；
  - 已知边界：搜索字段晚于首帧就绪（接口下发配置）、SSR 水合、容器初始隐藏等「测量晚于首帧」场景，折叠高度的落定仍伴随一次布局调整——折叠高度在测量前物理上不可知，此为 DOM 度量的固有限制，本修复消除的是语义偏差与 0px 帧隐患；
  - 新增判别测试 SE-01~SE-04（初始状态对齐、未测量守卫、折叠落定、展开配置保持）。

- 206e205: 修复 useSearchFormExpand 高度测量链路的反馈振荡与展开按钮闪烁：
  - ResizeObserver 触发的测量改为 requestAnimationFrame 合帧，同一帧内的多次尺寸变化只测量一次，卸载时取消未执行的测量帧；
  - 测量写入增加 2px 死区：自然高度与单行高度与上次写入值差异小于 2px 时不更新状态，分数像素布局（缩放、flex 均分）下不再出现 ±1px 振荡；
  - 更换表单元素（`:form` 运行期替换）时按元素身份重建测量基线，新元素的首次测量始终写入。

  边界：±1px 内的真实尺寸变化不再触发高度状态更新，属有意取舍。

- 206e205: fix(ssr): 消除模块级自增种子与随机 id 在 SSR 下的 hydration 隐患 (R-06)
  - **core `useTable`**：无 key 列的自动标识（`__col_N`）改由实例级种子生成，每次 `useTable` 调用独立从 1 计数，SSR 下服务端与客户端按相同列配置得到一致 key 序列；`normalizeColumn` / `normalizeColumns` 新增可选 `allocateKey` 参数供调用方注入生成函数，独立调用（未传参）时回退模块级兜底种子，行为向后兼容；
  - **vant-pro `useFormPopup`**：弹层容器 id（Teleport 目标 `#pro-form-popup-content-*` 会渲染进 DOM）由 `Math.random()` 改为 Vue 3.5 `useId()` 派生，SSR 下服务端/客户端 id 一致，消除 hydration mismatch 与 Teleport 目标失配；无组件上下文的命令式独立弹层（不参与 hydration）回退 `standalone-N` 兜底计数器，多实例仍互不冲突；
  - **vant-pro `BaseField`**：弹层字段归属标识 `fieldUid` 由模块级自增计数器改为直接复用组件实例 uid（`getCurrentInstance().uid`，同页面唯一）；该值仅参与运行期比对、不落入 DOM，SSR 不受影响，开发期 HMR 与多实例行为不变；
  - 附带评估：四包 ProForm 的 `formInstanceCounter`（`:key="formKey"` 重挂载契约）key 不落 DOM、语义绑定 form 实例身份，无需调整；
  - 新增判别测试：core TT-22~TT-24（实例级种子序列、动态增列延续、显式 `allocateKey` 递归）、vant VP-V12~VP-V14（跨挂载 id 可复现、同应用多实例唯一、归属标识与实例 uid 恒等）。

## 2.0.2

### Patch Changes

- - **core**:
    - 修复 `setFormData` 类型定义，补齐顶级已知字段泛型重载与 `ExtendWithAny` 批量覆盖兼容性；
    - 恢复 `getFormData` 2 层与 3 层嵌套路径的强类型推导重载；
    - 优化 `setFormData`、`getFormData` 与 `getField` 的 JSDoc 结构，消除 TypeScript 方法重载在 IDE Hover 时产生的首行文字无格式拼接问题。
  - **UI 适配层 (antd-vue-pro / antdv-next-pro / element-plus-pro / vant-pro)**:
    - 完善 `useForm` JSDoc 中 `setFormData` 四种调用形态说明并对齐最新 core 类型定义。

## 2.0.1

### Patch Changes

- 评审修复与架构治理批次：

  **缺陷修复与体验增强**
  - 修复序号列不分页偏移：第 n 页首行序号为 `(n-1)*pageSize+1`（R1，三桌面包统一对齐）
  - 修复 `{ all: true }` 批量插入在多个位点共享同一对象引用导致的隐式联动（R2，core；表格列各位点独立补齐自动 key）
  - 修复注入级 `formItemContainer` 配置不生效并泄漏为 DOM 属性（R6/C4）
  - antdv-next-pro：恢复搜索区"全部字段隐藏时不渲染"的判定（R7/C2）；恢复 disabledKeys 的 deep watch 并合并初始化逻辑（M5/C5/S5）
  - 修复 ProTable setup 期插槽快照：条件渲染的工具栏等插槽可动态响应（R5）
  - 修复请求竞态下 loading 被先结束的旧请求熄灭；新增 `ProTable.search()` 实例方法（M1）
  - componentMap 改为响应式无条件注入：运行期首次赋值/整体替换即时生效（M2/C8）
  - element-plus-pro：`column.render` 返回字符串等原始值按文本渲染，不再被解析为组件名（R4）
  - element-plus-pro：`ColumnControl` 增加 VNode/函数列标题类型守卫并支持 `columnControl.labels` 自定义别名映射（R-A1）
  - vant-pro：弹层 open 未携带初值时清空上一次残留值（M7）
  - 三桌面 BaseField：清理 `mergedProps` 中恒空的 `{ class: initProps.componentClass, style: initProps.componentStyle }` entry（S-A1）

  **架构收敛与性能优化**
  - useSearchFormExpand 核心测量与自适应逻辑统一下沉至 core 纯逻辑层，三桌面包统一复用（S4）
  - createFormProxy 引入方法引用按 key 缓存记忆化，确保方法引用恒等（5.8）
  - useGroupFieldAttrs 属性键查表改模块级 Set（P1）
  - 四包 ProForm 属性合并提升为 computed 记忆化，避免破坏底层 Form 组件 props 浅比较（P2）
  - pathCache 满额改 FIFO 分批驱逐，消除周期性全量 miss（5.2）
  - 未知组件名告警按名称模块级 Set 去重，四包统一全生命周期仅告警一次（M4）
  - cloneDeep JSON 降级路径输出一次性类型变形告警，JSDoc 列明精确变换表（T18）
  - 统一组件库双向绑定语法至 Vue 3.5+ `defineModel`（S6）

  **工程化与规范**
  - CI 接入 `pnpm -r test` 自动化测试；根 package.json 补齐 `packageManager` 锁定
  - 产物构建采用 `output.intro` 自动内联样式加载，业务方无需手动导入 CSS
  - 沉淀最高架构协作契约 `AGENTS.md` 与评审治理档案 `CODE_REVIEW.md`

## 2.0.0

### Major Changes

- e8c97d0: - feat!: 彻底移除 `lodash-es` 运行时依赖，发布产物体积由 60.26 kB 降至 22.34 kB（-63%）
  - feat!: **移除公共导出 `omit`**（破坏性变更）——内部及受支持用法均已改为解构/显式剔除实现，业务若直接 `import { omit } from '@qin-ui/pro-components-core'` 需改用对象解构
  - feat!: **移除已废弃的公共导出 `InjectionPathKey`**（破坏性变更，此前已标 `@deprecated`、全仓零使用）——2.0 起不再提供该兼容 key
  - feat: `get`、`set`、`toPath` 底层替换为高性能收窄语法实现（API 名保持不变）；覆盖点分路径与数字索引等主流用法，行为差异与告警机制见 `shared/path.ts` 模块文档——**引号括号段（如 `'a["b.c"]'`）不再被解包**，将返回 undefined 并输出 dev 告警，此类 key 请改用变量下标访问
  - feat: 新增 `normalizePathKey` 字段路径归一化工具（非字符串/数组/数字输入安全返回空串）
  - refactor: `pick`、`isPlainObject` 改为零外部依赖自研实现
  - refactor: `cloneDeep` 改为 `structuredClone` 原生实现 + JSON 序列化降级方案——类实例将丢失原型方法、函数属性与 symbol key 会被丢弃（JSON 型表单/分页数据无感知）

### Minor Changes

- ac4f1f7: - fix(useFields): 优化 BFS 遍历为游标索引并采用快照式倒序批量删除与插入，解决同父级多匹配错删与插入位置错位问题
  - fix(useFields): 优化 \_map 路径缓存为 keep-first 写入策略，保证同 path 重复字段与首匹配语义一致
  - fix(useTable): addColumns 重构为快照机制，彻底解决函数谓词批量追加时的死循环
  - fix(useForm): 修复单参数传入数据对象时被误判为 root 标志导致数据静默丢弃的问题
  - fix(useFormData): 修复以 falsy 初始值（如空字符串、0、null）调用时误走 inject 注入分支的问题
  - docs(useFields): 对齐 JSDoc 注释（明确函数路径默认 all=true、字段按自身 path 寻址）
- 7008a80: - perf(shared): 内部实现高性能路径解析与读写模块，替代内部热路径对 lodash get/set/toPath 的依赖，大幅提升字段路径解析与深层数据读写吞吐率

### Patch Changes

- ebfc333: - fix(useFormData): 原始值初始数据安全归一化为 `{}`，防止退化导致 setFormData 抛错；为 inject 增加组件上下文守卫
  - fix(useForm): 为 useForm(false) 的 inject 增加组件上下文守卫，消除 setup 外调用警告
- 20070df: - refactor(locale): localePacks 类型定义强化，以 zh-CN 为基准强制各语言包 key 严格对齐（ProLocaleKey/ProLocale）
- fb089aa: - fix(useFormData): provide 增加组件上下文守卫，消除 setup 外调用时的开发告警
- 436d5e9: - fix(locale): resolveLocaleName 扩展港澳及繁体语言名识别（zh-HK/zh-MO/zh-Hant 等映射至 zh-TW）
- fbd14ad: - fix(useForm): useForm(false) 注入失败时输出告警提示

## 1.1.3

### Patch Changes

- perf: 表单渲染链路深度扁平化重构与性能优化
  - **链路扁平化（8 层 -> 6 层）**：彻底移除 `PathProvider` 组件实例，精简组件树层级
  - **Hook 纯函数化**：将 `GroupedFieldAttrs` 改造为 `useGroupFieldAttrs` 纯计算 Hook，100% 消除作用域插槽闭包转发开销
  - **实例开销降低**：单字段 Vue 内部组件实例减少 2 个（Antd 系 8->6，Vant 4->2），内存与首次挂载速度显著优化

## 1.1.2

### Patch Changes

- fix: 修复 Paths 类型定义，补充 (string & {})[] 宽数组逃生通道，解决包含 Date 或嵌套对象时表格 Ref 类型兼容性报错

## 1.1.1

### Patch Changes

- fix: 修复 ProTable 列配置响应式引用断开、多级表头递归与表单插槽注入时序等问题

## 1.1.0

### Minor Changes

- 新增多语言国际化（i18n）机制及 ProTable 列控制增强配置：
  - 支持内置语言包（zh-CN / zh-TW / en-US），能够跟随宿主 UI 库全局语言自动切换。
  - ProComponentProvider 新增 `locale` 属性，支持覆盖任意内置文案。
  - ProTable 列控制 `control.columnControl` 支持传入配置对象（支持自定义 `labels` 别名映射、`excludedKeys` 排除列、`disabledKeys` 锁定展示列、`disableCheckAll` 禁用全选）。

## 1.0.4

### Patch Changes

- 修复 `setField` 在 merge 模式下无法覆盖 `computed`/`ref`（只读 ref）属性的问题。旧实现使用 `Object.assign`，会触发 Vue reactive 对只读 ref 的 set 拦截而静默失败，导致该属性仍指向原 `ComputedRef`。改为对「旧值是 ref、新值非 ref」的属性先 `delete` 再赋值，使其被原始值真正替换。

## 1.0.3

### Patch Changes

- @types/lodash-es 从 devDependencies 归类至 dependencies。

## 1.0.2

### Patch Changes

- fix(core): 修复 useTable 重置查询参数时未恢复初始分页参数的问题

## 1.0.1

### Patch Changes

- 修复 sideEffects 导致消费方 CSS 被删除，并完善发布字段与构建配置
  - 修复 antd-vue-pro / element-plus-pro 的 `sideEffects: false` 导致消费方 tree-shaking 时 CSS 自动引入被删除的 bug
  - 各包完善 exports、prepublishOnly、engines、browserslist 等发布字段
  - vue-component-type-helpers 从 dependencies 移至 devDependencies
  - 简化为单入口构建，消除产物 hash 后缀
  - 清理 tsconfig 死配置，显式 `vue-tsc --noEmit`
  - core devDeps 对齐根版本，统一 vue peer 为 ^3.5.0
