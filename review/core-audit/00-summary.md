# core 复核总结（发版就绪评估）

> ⚠️ 本文件与相关改动**尚未提交**（按 owner 要求：复核期间的修改须经确认后方可提交）。
> 明细见本目录四份审计报告；本文只给结论、必修清单与建议批次。

## 一、结论

| 项       | 结果                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 审计方式 | 4 条主线只读逐行核查 + 最小复现探针（探针写在 `/tmp`、已删除；审计期间仓库零写入）                                                         |
| 合计发现 | **❌ 17 条 / ⚠️ 76 条 / ✅ 62 项**                                                                                                         |
| 门禁现状 | core **233 用例全绿**（本批新增判别用例后）、仓库级 `vue-tsc` **0 错误**、prettier 通过、eslint 0 error、core build 成功（均为工作区实测） |
| 发版判定 | 必修项已在本批全部落地（含 2 条 owner 决策）；owner 已决定 core 本批定级统一 `patch`                                                       |
| 已修     | ❌ **4 条已修**（见 §三；第 5 条 `UseSearchFormExpandReturn` 经 owner 决策**回退**——该 Hook 属内部 API），**12 条必修项已全部落地**        |

## 二、必修清单（12 条，已在本批全部落地；下表为原始清单）

> 处置结果：12 条均修复并补判别性用例（逐条突变验证「改前红 / 改后绿」）；新增编号 `SE-12~SE-15`、`FF-47/48`、`TT-35~TT-37`、`FD-26`、`PT-05~PT-07`、`SU-05/06/09/11`，并改造 7 条失信断言。
> 差异两处：**D4（4 处 `console.warn` 补 dev 门控）经 owner 决策不实施**（告警在生产环境照常输出）；core changeset 定级**统一 `patch`**（原 D6 建议的 `minor` 不采纳）。

### A. 发版必修：`useSearchFormExpand`（四包 SearchForm 共用，用户可见）

| #   | 位置                                       | 问题                                                                                                                                             |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | `useSearchFormExpand.ts:300-305`           | 初值自动展开后，任意 ≥2px 重测（resize / 字段增减）把状态**无条件写回配置初值** → 打回折叠（实测 `afterInitExpand:true → afterRemeasure:false`） |
| A2  | `useSearchFormExpand.ts:312-337`           | 每次测量 `new IntersectionObserver`，**旧 IO 的排队回调 disconnect 掉新 IO** → 自动展开丢失（实测 `io2DisconnectedByStaleCb:true`、`ioCount:2`） |
| A3  | `useSearchFormExpand.ts:140` vs `:149-161` | 注释称「任一坐标链不可测即返回 null」，实现是**过滤丢弃后继续** → 折叠态多显示行（5 行含 1 行不可测时 `collapseHeight=112`，应为 `72`）          |

### B. core 健壮性与一致性

| #   | 位置                  | 问题                                                                                                             |
| --- | --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| B1  | `useFields.ts:382`    | `initFields` 含一个 `null` → `getField`/`setField`/`deleteField`/`getParentField` **全抛 `TypeError`**           |
| B2  | `useFields.ts:311`    | 非数组入参 → `TypeError`，或字符串被**静默拆成多个字段**                                                         |
| B3  | `useTable.ts:614-627` | 多站点 `appendColumn` 产生**重复 key**（实测 `["a","x","b","x"]`），与注释「独立生成 key」不符                   |
| B4  | `normalizeColumn`     | 环状 `children` **爆栈 `RangeError`**；`preventExtensions` 对象抛 `TypeError`                                    |
| B5  | `useFormData`         | 入参**别名**：批量写会 `delete` 调用方对象的 key；`useTable` 克隆了 `pageParam` 却**未克隆 `searchParam`**       |
| B6  | `cleanupObservers()`  | 调用后 `ResizeObserver` **永久失明**（无法重新观测）                                                             |
| B7  | `cloneDeep` 兜底分支  | 告警**误报**：`{fn, big:10n}` 或抛错 getter 时文案谎称「循环引用且环境不支持 structuredClone」，并静默返回原引用 |

### C. 安全与边界

| #   | 位置                          | 问题                                                                                                                                            | 状态                                       |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| C1  | `path.ts:149/154-162/191-210` | 裸数字/布尔路径：`get({a:1},0)` **返回整个对象**、`set({},0,'v')` → `{undefined:'v'}`（lodash 为 `undefined` / `{0:'v'}`）；TS 已排除但 JS 可达 | 待修（入口 `toPath` 归一 + Changeset）     |
| C2  | `locale/index.ts:82-84`       | `format` 用 `key in params` 走原型链 → `format('{toString}', {})` 输出原生函数源码                                                              | **已修**（`LC-08`）                        |
| C3  | `utils/index.ts:84`           | `pick` 无危险键防护 → 结果对象**原型被 JSON 数据替换**                                                                                          | **已修**（`SU-08`，复用 `isDangerousKey`） |

### D. 发布要素与测试

| #   | 内容                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **`isObjectItem` 是唯一零行为覆盖的运行期导出**（P0，建议 `SU-05` 真值矩阵）                                                                              |
| D2  | 三语言包**文案值**未被锁定（`LC-07`）；`cloneDeep` 降级告警「仅一次」未被锁定（`SU-06`）                                                                  |
| D3  | 8 条**失信断言**（最重：`path.spec.ts:350` 恒真、`utils.spec.ts:222` 的"一次性"不成立、`CR-027` 零信息、`LC-04` `typeof` 恒真、`Math.random()` 不可复现） |
| D4  | 4 处 `console.warn` 缺 **dev 门控**（AGENTS §3.4/§3.6 承诺"dev 环境"）                                                                                    |
| D5  | core `package.json` 缺 `repository`/`homepage`/`keywords`，`exports` 缺 `"./package.json"` 子路径（四包均有）                                             |
| D6  | `fix-field-identity-contract.md` 的 core bump 应 `patch → minor`（正文自认新增公开 API）                                                                  |
| D7  | **性能**：`normalizePathKey` 括号分支不走缓存（20 万次 49ms vs `toPath` 2ms）                                                                             |

## 三、上一轮已修（4 条 ❌，均未提交）

| 原问题                                                           | 修法                                           | 验证                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| ~~`UseSearchFormExpandReturn` 未导出 → 消费方 TS2742~~           | **已回退**：该 Hook 属 qin-ui 包内部 API       | 按 owner 决策不纳入本轮，处置说明见 [`01`](./01-release-and-packaging.md) 批注 |
| `isDangerousKey` 的 `@internal` 表述与两条 changeset 矛盾        | 统一为「包内使用、不进包根导出面，包外不可达」 | 文档一致性核对                                                                 |
| `camelizeProperties` 的 JSDoc 被 `const` 隔断 → 产物 d.ts 零文档 | JSDoc 归位（`const` 上移）                     | 产物 d.ts 核对                                                                 |
| `format` 走原型链                                                | 改自有属性判定                                 | `LC-08`（回退即红）                                                            |
| `pick` 无危险键防护                                              | 复用 `isDangerousKey` 跳过                     | `SU-08`（回退即红）                                                            |

> 第 1 条回退的原因与证据（仓内消费方均为本地解构、无 `defineExpose`；四包公共入口链不含该 Hook；TS2742 仅在包装型消费方再导出其返回值时触发）见 [`01-release-and-packaging.md`](./01-release-and-packaging.md) 顶部批注。

## 四、执行顺序与执行结果

**A → B → C → D**（A 优先：四包用户可见）。每批完成后提交前提供：diff 摘要 + 关键项突变证据（改前红 / 改后绿）+ 门禁实测。

> **本批已执行完毕**：A→D 全部落地并复跑门禁（`pnpm -r test` 741 用例全绿、`vue-tsc` 0 错误、prettier、eslint 0 error、`check-test-ids`、core build），改动只留工作区待 owner 确认提交；其中 D4 与 01 报告 ❌-1 经 owner 决策不实施/不纳入，core changeset 定级统一 `patch`。

## 五、需 owner 决策（原 3 条，均已决议）

1. ~~`data-*` / `aria-*` 保名策略导致 kebab 写法的 `data-source` / `data-index` 永不转成 `dataSource` / `dataIndex`~~ → **已决：收窄豁免**（取值为 DOM 属性值形态：字符串 / 数字 / 布尔时保名；对象 / 数组 / 函数等 prop 形态转驼峰），用例 `SU-11`；
2. ~~`isIndexKey` 对 `-1` / `1.5` / `NaN` 建数组并挂隐藏属性（lodash 建对象）~~ → **已决：对齐 lodash**（仅有效数组下标 `0 ~ 2^32-2` 建数组），用例 `PT-07`；
3. ~~`data-source` 一类属性应视为 DOM 属性还是组件 prop~~ → 与第 1 条合并决议：按取值形态区分，`data-index` 等数字取值仍按 DOM 属性保名。

## 六、附：四份审计报告

[`01-release-and-packaging.md`](./01-release-and-packaging.md)｜[`02-tests-and-coverage.md`](./02-tests-and-coverage.md)｜[`03-shared-correctness.md`](./03-shared-correctness.md)｜[`04-form-table-correctness.md`](./04-form-table-correctness.md)
