# pro-components 2026-08 重构与测试工程完整档案

> 本文档是 2026-08-21 ~ 2026-08-26 全仓重构的**唯一存档**，自包含全部终局信息：
> 问题清单与根因、修复方案、测试工程设计、决策记录、遗留事项。
> 过程性细节（多轮复核记录、任务卡实施步骤）已舍弃；发版说明以 `.changeset/` 为准；
> 各项问题的判别性用例编号可在对应包 `__tests__/` 中全文检索定位。

---

## 一、总览

### 1.1 背景与时间线

| 阶段          | 时间          | 内容                                                                |
| ------------- | ------------- | ------------------------------------------------------------------- |
| 第一轮审查    | 08-21         | core 全量审查，确认 4 个高危 Bug 与中低危问题；建立 Vitest 测试体系 |
| core 修复闭环 | 08-21 ~ 08-24 | T0-T10 优化、N1-N3 修复、M1-M4 移除 lodash，15 个 commit            |
| 第二轮审查    | 08-24         | antd-vue-pro / antdv-next-pro 审查与全量修复                        |
| 第三轮审查    | 08-25         | element-plus-pro / vant-pro 审查与全量修复                          |
| 收尾治理      | 08-26         | 文档归档整合、注释风格统一、示例修正                                |

### 1.2 涉及包与成果

| 包                            | 版本动作           | 核心变更                                                                                                 |
| ----------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `@qin-ui/pro-components-core` | **major（2.0.0）** | 4 个高危 Bug 修复；移除 lodash 与公共导出 omit；get/set/toPath 同名换芯为高性能收窄语法实现；locale 增强 |
| `@qin-ui/antd-vue-pro`        | minor              | A/B 系列全量修复 + 组件测试基建（60 用例）                                                               |
| `@qin-ui/antdv-next-pro`      | minor              | 同构移植 + 测试基建（60 用例）                                                                           |
| `@qin-ui/element-plus-pro`    | minor              | A/B 移植 + E/F 特有系列 + 测试基建（60 用例）                                                            |
| `@qin-ui/vant-pro`            | minor              | A/B 移植 + V 弹层系列 + 测试基建（34 用例）                                                              |

### 1.3 验证数据（2026-08-26 复测）

- 测试 **376 用例全绿**：core 162 / antd-vue-pro 60 / antdv-next-pro 60 / element-plus-pro 60 / vant-pro 34；
- 全仓 `pnpm build`（vue-tsc --noEmit + vite build）0 error，类型检查覆盖各包 `__tests__`；
- core 发布体积 60.26 kB → **22.34 kB（gzip 14.74 → 约 6 kB，-63%）**；
- 生产依赖树零 lodash（`lodash-es`/`@types/lodash-es` 仅存 devDependencies 作测试 oracle）。

---

## 二、core 包档案

### 2.1 高危 Bug（4 项，均已修复并有红转绿判别测试）

| #   | 问题                                                                             | 根因                                                       | 修复方案                                                  | 判别测试                |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | ----------------------- |
| 1   | `useFields.deleteField(fn, { all: true })` 同父级多匹配时删除错字段              | BFS 队列快照固化索引，首个 splice 后后续索引整体漂移       | 匹配先收集快照，按父级数组引用分组、组内索引降序删除      | FF-27（旧代码实测错删） |
| 2   | `useTable.appendColumn/prependColumn(fn, col, { all: true })` 同步死循环卡死页面 | 插入使数组变长而游标继续前进，新插入列再次命中谓词无限插入 | `addColumns` 改快照机制（只对遍历开始时的元素匹配）       | TT-17（旧代码 5s 超时） |
| 3   | `appendField/prependField` 批量插入位置错误                                      | 与 #1 同源的索引漂移                                       | `addFields` 快照分组 + 组内降序插入（高位变更不影响低位） | FF-32 / FF-35           |
| 4   | `useForm(数据对象)` 单参被误判为 root 标志，数据静默丢弃                         | 运行时按 `args.length` 分派而非参数类型                    | 按 `typeof` 分派 + `?? {}`                                | UF 系列                 |

配套收敛：BFS 游标遍历替代 `queue.shift()`、`_map` 缓存 keep-first 写入（DM-05 判别锁定）、`useFormData` 注入分支改 `=== undefined` 判定、批量增删逻辑统一抽取为 `shared/internals.ts` 的 `applyByGroupDesc`。

### 2.2 优化任务清单（T/N/M 系列）

| 编号  | 内容                                                                                                                                                                                                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1    | `provide()` 增加组件上下文守卫，消除 setup 外调用告警                                                                                                                                                                                         |
| T2    | `useForm(false)` 注入失败输出告警（不再静默建空表单）                                                                                                                                                                                         |
| T3    | `deleteColumn` 快照化，与 deleteField 共用 `applyByGroupDesc`                                                                                                                                                                                 |
| T4    | 新建 `shared/path.ts` 高性能路径模块（见 2.3），替换 lodash get/set/toPath 热路径                                                                                                                                                             |
| T5    | useTable 返回值类型收紧，移除 `as any`                                                                                                                                                                                                        |
| T6    | localePacks 类型强制各语言包 key 与 zh-CN 对齐（LC-05 锁定）                                                                                                                                                                                  |
| T7    | `resolveLocaleName` 识别港澳/繁体地区语言名（LC-01/02）                                                                                                                                                                                       |
| T8    | `format` 无占位符短路返回（LC-06）                                                                                                                                                                                                            |
| T9    | getFormData/setPageParam/引用共享等 JSDoc 行为契约补齐                                                                                                                                                                                        |
| T10   | 测试目录纳入 vue-tsc 类型检查（tsconfig include `__tests__` + typeRoots）                                                                                                                                                                     |
| N1-N3 | 原始值 init 归一化为对象；inject 组件上下文守卫；path 合法语料差分锁定                                                                                                                                                                        |
| M1-M4 | 自研 `isPlainObject`/`pick`（语义等价，差分锁定）；`cloneDeep` 改 structuredClone + JSON 降级；**get/set/toPath 同名换芯**——底层替换为收窄语法高性能实现，API 名保持不变，移除公共导出 `omit`；新增 `normalizePathKey`；生产依赖树移除 lodash |

### 2.3 path 模块设计要点（`core/src/shared/path.ts`）

- **收窄语法**：支持点分（`a.b`）、数字段（`list.0`）、简单括号（`a[0]`）；不为 lodash 全量边界兼容付费。
- **非法路径 dev 告警**（相同路径去重）+ 确定性兜底；合法语料与 lodash 差分对拍全绿。
- **与 lodash 的三条有意分歧**（测试锁定）：未闭合括号按段解析并告警；引号括号段保留引号并告警；非字符串输入安全返回空串。
- **Vue 友好**：SameValueZero 同值跳过不触发响应式；set 自动建中间层且保持响应式代理；原型污染属性忽略。
- **公共 API 口径**：本模块即对外导出的 `get` / `set` / `toPath`（API 名与 lodash 相同但为收窄语法语义）；引号括号 key（`'a["b.c"]'`）不再解包，返回 undefined 并输出 dev 告警。
- `toPath` 返回段数组形式，供 antd 系 FormItem `name` 嵌套绑定使用（H1 回归修复的关键导出）。

---

## 三、UI 包通用修复档案（A/B 系列，四包同源）

> 「位置」为组件/文件级定位；「判别测试」在修复前代码上必失败。antd 系两包与 element-plus/vant 的实现细节按各自 UI 库 API 适配，方案同构。

| #   | 位置                 | 问题                                                                          | 修复方案                                                                                        | 判别测试        |
| --- | -------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- |
| A1  | component-provider   | setup 期一次快照 provide，`componentVars` 运行期变更不生效                    | 全部标准 key 预提供 computed，动态扩展 key 运行时补建通道；7 处消费方统一 `toValue` 解包        | PC-A1           |
| A2  | ProForm              | 未传 `form` 时 provide 空对象，下游静默失效                                   | 未传时 `useForm()` 自建兜底实例，`currentForm` computed 桥接                                    | PF-A2 / VP-A2   |
| A3  | BaseFormItem         | 索引数组 ref，字段 splice/重排后实例错位                                      | WeakMap 以字段原始对象（toRaw）为 key 注册实例，挂载/卸载回调维护                               | BI-A3           |
| A4  | SearchForm           | watchEffect/observer 回调无条件收起手动展开状态                               | `isManualToggle` 守卫：手动切换后自动策略不再覆盖                                               | SF-A4           |
| A5  | SearchForm           | `(expand as any).expandStatus` 布尔形态恒 undefined                           | 隐藏值检测统一读 `computedExpand.value.expandStatus`                                            | SF-A5           |
| A6  | ProTable             | setup 期一次性解构 `table \|\| {}`，运行期替换实例失效                        | 全部改为 computed 内直读 + 安全解包                                                             | PT-A6           |
| A7  | ProTable             | provider 级 `pagination: false` 被展开吞掉                                    | 分页三级优先级链：tableAttrs 显式 > provider > 默认合成                                         | PT-A7           |
| A8  | ProTable 序号列      | 不随分页递增                                                                  | **antd 系决策忽略**（业务接受）；element-plus 系已低成本修复（跨包行为有意不一致）              | —               |
| A9  | useGroupFieldAttrs   | `extraProps` 曾疑为冗余                                                       | 定性非缺陷（解构剥离即设计）；JSDoc 补「渲染层剥离不落 DOM」契约                                | —               |
| A10 | SearchForm 插槽      | slot 出口上的 `@click` 无效监听                                               | 改为作用域插槽暴露 `onReset/onSearch/expandStatus/changeExpandStatus`（**Breaking**）           | SF-A10          |
| A11 | SearchForm 样式      | 初始渲染输出 `height: unsetpx` 脏样式                                         | 未测量时不输出 height                                                                           | SF-A11          |
| A12 | BaseField            | `getInitProps` 在 computed 内调用 inject（脆弱时序耦合）                      | inject 提升至 setup 同步期解析描述符，computed 经 toValue 消费                                  | PC/BF 关联      |
| A13 | SizeControl          | 挂载即向 defineModel 回写默认 size，污染父级状态                              | 移除回写                                                                                        | SC-A13          |
| A14 | BaseField            | 未识别组件字符串静默渲染为原生元素                                            | `console.warn` 明确提示 + 降级渲染                                                              | BF-A14 / VP-A14 |
| A15 | 构建产物             | （antd 系）`es` 子路径深度导入的工程风险                                      | antdv-next 从根导出导入不适用；结论留档                                                         | —               |
| A16 | getPopupContainer    | 表单外使用返回 null 引发定位异常                                              | 回退 `document.body`                                                                            | —               |
| B1  | ProForm/BaseField    | 解构捕获实例，`:form` 替换后下游失联                                          | Proxy 稳定门面（get/set/has 转发 currentForm，方法延迟绑定）；BaseField 移除解构逐次经代理访问  | PF-B1 / VP-B1   |
| B2  | SearchForm           | 手动展开后自动联动永久失效                                                    | A4 方案的既定取舍，留档；如需细化守卫时机另行评估                                               | —               |
| B3  | BaseField            | `injectConfigKey` setup 期固定（picker 动态变化场景不更新）                   | 风险极低，注释留档限制                                                                          | —               |
| B4  | BaseField            | valueFormatter 每次 set 深拷贝旧值（高频输入性能热点）；旧值活引用可写穿数据  | 按 `fn.length > 1` 按需注入旧值；旧值为只读快照副本（**Breaking**，勿用默认/rest 参数声明双参） | BF-B4 / VP-B4   |
| H1  | BaseFormItem `:name` | 适配期曾把段数组误改为字符串，破坏嵌套路径绑定（antd getNamePath 不拆分点号） | core 公开段数组形式 `toPath`，恢复段数组语义                                                    | PF-H1 / VP-H1   |

> H1 的直接教训：该回归由「组件级测试缺口」漏网并曾进入发布物——组件测试基建因此升为 P1 前置任务，本轮已落地。

---

## 四、包特有修复档案

### 4.1 element-plus-pro（E/F 系列，33 项）

| 批次 | 项                                                                                                                                                                                                                                                                | 要点                                               |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 高   | E1(A6) E2(A7) E8(A4) E17 F1(A1) F3(A2) F4(B1) F5(A12) F14(A3)                                                                                                                                                                                                     | 与 antd 同源问题的 EP 形态；E17 数组路径列取值断裂 |
| 中   | E3 分页优先级（用户显式 currentPage 恒压过 pageParam 导致翻页冻结）→ pageParam 为主；E4 v-loading 指令按需引入未注册 → 局部注册 ElLoading；E5 序号列跨页递增（antd 系忽略、EP 已修）；E9/E10/E11/E12/E14/E16；F6(B4) F7 F13 computedControl 默认值统一 `?? false` |                                                    |
| 低   | E6 并发竞态（业务侧责任）E7/E13/E15/E18/E19 F8-F12 工程与文档项                                                                                                                                                                                                   |                                                    |

### 4.2 vant-pro（V 系列，25 项 + useFormPopup 重构）

弹层链路核心变更（含 **API Breaking**）：

| #    | 变更                                                                                                                                                  | 判别测试 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| V7   | `open(path, initialValue?, customProps?, fieldId?)` 统一签名；取值源改原始数据而非展示格式化值                                                        | VP-V7 ×2 |
| V8   | `DEFAULT_POPUP_PROPS` + `resetProps()`：打开即重置，杜绝跨字段 props 泄漏                                                                             | VP-V8 ×2 |
| V9   | signature 取消事件映射为 `onClear`                                                                                                                    | VP-V9    |
| V10  | 多实例 Teleport 隔离：ProForm 生成唯一 `contentId`/`teleportTo`                                                                                       | VP-V10   |
| V11  | `activeFieldId`/`fieldUid` 实例匹配，同 path 字段不双渲染                                                                                             | VP-V11   |
| 其他 | confirm 写回守卫移除（清空可写回 PU-01）；V18 `as never` 类型化；V2 componentMap computed 提供；VP6 useForm root 判定镜像 core、disabled 透传 VanForm | PU-01 等 |

复核更正：V5/V6 为误报（`fieldAttrs` 是 reduce 拷贝子集，label/placeholder 不丢失），BF-05 锁定行为。

---

## 五、测试工程档案

### 5.1 基建设计决策（D1-D6）

| 编号 | 决策                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| D1   | 挂载真实 UI 库组件（不 stub FormItem/Input），校验/弹出等异步用 `flushPromises + nextTick` 驱动             |
| D2   | happy-dom 环境；matchMedia / ResizeObserver / IntersectionObserver / scrollIntoView 在 `setup.ts` 统一 mock |
| D3   | 覆盖全量功能而非仅修复项；每个已修复项至少一条**判别性用例**（修复前代码必失败）                            |
| D4   | 行为断言，禁用快照断言（防 UI 库升级破坏）                                                                  |
| D5   | 编号体系：PF/BI/BF/PT/SF/SC/CC/PC/HK/LC/IT/SX 前缀 + `-A3/-B4/-VP-V7` 关联后缀                              |
| D6   | 忽略项不写用例；未修复项写「现状锁定」用例并标注                                                            |

mock 规格 M1-M6：matchMedia 标准 mock、ResizeObserver/IntersectionObserver 可控触发钩子、scrollIntoView stub、getBoundingClientRect 用例内覆写、console 按消息前缀白名单过滤。

### 5.2 各包用例构成

| 包                            | 文件数 | 用例数 | 特色系列                                                                                                               |
| ----------------------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| core                          | 9      | 162    | path 与 lodash 合法语料差分对拍 + 三条分歧锁定；FF 字段树全操作矩阵；DM 直接变异组（keep-first）；locale 三语 key 对齐 |
| antd-vue-pro / antdv-next-pro | 9+9    | 60+60  | PF/BI/BF/PT/SF/SC/CC/PC/HK/LC/IT/SX 全组件矩阵，判别用例覆盖 A1-A16/B1-B4/H1                                           |
| element-plus-pro              | 9      | 60     | EP 特有判别：分页优先级链、v-loading 局部注册、数组路径列、computedControl 默认值                                      |
| vant-pro                      | 8      | 34     | 弹层全链路（open 签名/隔离/清空写回/多实例）、移动端集成 IT                                                            |

### 5.3 回归门禁与判别性抽查流程

```bash
pnpm --filter <pkg> test        # 各包全绿
pnpm build                      # 全仓 vue-tsc + vite build 0 error
```

判别性抽查：stash 修复前 src → 抽查 3 条判别用例确认红 → 恢复 → 结果记录于提交说明。

---

## 六、决策记录汇总

| 决策        | 结论                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------ |
| C1/D1       | 函数路径默认 `all=true`：锁定现状，JSDoc 对齐                                              |
| C9/D2       | `getField('a.b')` 嵌套路径不实现父路径拼接，字段按自身 path 寻址，修文档                   |
| D3          | `useFormData` 仅 `undefined/null` 触发注入分支                                             |
| C10/C2      | `_map` 缓存 keep-first；陈旧条目不清理（位置校验自愈）；否决 deep watch 失效方案（负优化） |
| A8          | antd 系序号列分页递增：业务接受不修复。⚠️ EP 系已修——跨包行为有意不一致，消费方换包需知悉  |
| A9          | `extraProps` 解构剥离为设计而非缺陷                                                        |
| B2/B3       | isManualToggle 永久锁定、injectConfigKey setup 期固定：均属已知取舍，注释留档              |
| F11         | 嵌套字段 prop 不拼父级前缀，须写完整点分路径                                               |
| F13/V12/V24 | path/name 优先级对齐 core；vant 校验基于展示值留档；vant 扁平键差异文档化                  |
| H1 教训     | 组件级测试缺口曾造成真实回归（`:name` 字符串化进入发布物）→ 测试基建升 P1                  |

## 七、遗留事项与 Backlog

**遗留观察（低优）**：

1. element-plus 的 E3/E4/E17 有实现但无专项判别测试；E16 显式数组 key 极端场景受 core `updaterMatch` 严格相等匹配限制；
2. 性能维持项：groupedAttrs 合并链（2.3）、ProTable pick 每渲染（2.4）、并发搜索竞态由业务侧处理（2.5）；
3. 全仓存量约 581 条 `no-explicit-any` warning（门禁口径：0 errors + 无新增 warning），建议专项清理；
4. 发布物 `files` 含 `es` + `src` 双份，瘦身需先确认消费方是否依赖 src 调试。

**Backlog**：`updaterMatch` 根队列分配优化、`normalizeColumn` children 脏检查跳过、useTable 列操作路径缓存——均待真实性能数据支撑。

**下个 major 清单**：

1. ~~移除公共导出 `InjectionPathKey`~~（✅ 本轮 core 2.0 完成）；
2. ~~移除 lodash~~（✅ 本轮完成）；
3. `columnKeySeed` 改实例级计数器以支持 SSR hydration 一致；
4. 大规模表单场景重评估 `_map` 缓存失效策略。

## 八、发版索引（changeset 对照）

| changeset                                           | 包                  | 级别               | 要点                                                                                                                    |
| --------------------------------------------------- | ------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| core 系列 7 条（`core-fixes-and-refactor` 等）      | pro-components-core | **major（2.0.0）** | 高危修复 + T/M/N 系列；`core-remove-lodash-dependency` 含 get/set/toPath 同名换芯说明、omit 移除、引号 key 行为分歧提示 |
| `antd-vue-pro-fixes.md` / `antdv-next-pro-fixes.md` | 两 antd 包          | minor              | A10 插槽作用域、B4 formatter 契约两条 Breaking Notes                                                                    |
| `element-plus-pro-refactor.md`                      | element-plus-pro    | minor              | A10/B4 Breaking + E 系列                                                                                                |
| `vant-pro-refactor.md`                              | vant-pro            | minor              | FormPopup open 签名 / Popup API / B4 Breaking                                                                           |

## 九、工程约定备忘

- 注释规范：只描述当前逻辑的职责与工作方式（是什么/怎么工作/为何这样设计），不书写改动日志——"从 X 改为 Y""修复了 Z"属于 commit message 与 changeset 的职责；
- 注释风格：行内说明用 `//` 且以 1 行为限；函数/对象用 `/** */` 块注释，采用"首行摘要 + `@description` 详述"结构，导出函数补齐 `@param` / `@returns`；
- 四包同构组件的注释文案保持一致；
- `componentVars` 在模板示例中统一使用驼峰绑定（`:componentVars="..."`）。

> 2026-08-26 全量核查结论：5 包 src 共 156 文件、约 4600 行注释，改动式措辞 / TODO/FIXME / 死代码注释 / 口语化表述均为 0，JSDoc 结构合规，无需进一步调整。
