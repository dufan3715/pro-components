# 交接说明：core 复核问题处理（供新会话接手）

> 本文写给**没有任何上下文的新会话**。读完本文 + [`00-summary.md`](./00-summary.md) 即可开工。

## 0. 最高优先规则（务必遵守）

- **未经 owner 确认，不得提交（`git commit`）任何改动**；也不得 `git add` 后随手提交。
- 改动**只留工作区**，流程为：改 → 自测（门禁 + 突变证据）→ 给 owner diff 摘要与验证结果 → **等 owner 说"可以提交"** → 再提交。
- **禁止 `git push`**；禁止改写已提交历史（`reset --hard`/`rebase`/`filter-branch`）；不得使用 `git checkout/restore/stash` 覆盖他人改动。
- owner 之前的两次明确要求：①「复核期间所有修改必须经过我的确认才能提交」；②「先不提交」。

## 1. 仓库与当前状态

- 仓库：`/Users/dufan/Desktop/Code/My_project/pro-components`（pnpm workspace：core + 4 个 UI 适配包 + examples）。
- 当前 HEAD：`95cbd10`（提交前请用 `git log --oneline -1` 复核）。
- **工作区有未提交改动**（`95cbd10` 基线的 8 项既有成果 + 本批 A→D 处置，均待 owner 确认；**不要丢弃、不要擅自提交**）：

| 文件                                                       | 内容                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/core/src/shared/path.ts`                         | `isDangerousKey` 的 `@internal` 表述纠正；`get`/`set` 入口归一、`isIndexKey` 对齐 lodash、括号分支缓存 |
| `packages/core/src/shared/utils/index.ts`                  | `camelizeProperties` JSDoc 归位与保名收窄；`pick` 复用 `isDangerousKey`；`cloneDeep` 告警归因          |
| `packages/core/src/locale/index.ts`                        | `format` 改自有属性判定（不再走原型链）                                                                |
| `packages/core/__tests__/locale.spec.ts` / `utils.spec.ts` | 新增判别用例 `LC-07/08`、`SU-04~06/08/11`                                                              |
| `.changeset/fix-core-public-type-face.md`（新）            | core `patch`：JSDoc 归位 + `@internal` 口径 + `format`/`pick` 安全边界                                 |
| `.changeset/review-top10-fixes.md`                         | 删除"导出 `isDangerousKey`"失真表述                                                                    |
| `review/core-audit/**`（新）                               | 本目录：四份审计报告 + 总结 + 本文                                                                     |

- **`packages/core/src/table/index.ts` 已回到 HEAD**：曾试补的 `UseSearchFormExpandReturn` 再导出**已按 owner 决策回退**（该 Hook 属 qin-ui 包内部 API，不对外），处置说明见 [`01`](./01-release-and-packaging.md) 顶部批注。
- 另有 `CODE-REVIEW-REPORT.md`（评审报告正文）与 `review/*.md`：`review/` 下的文件已提交，`CODE-REVIEW-REPORT.md` 未纳入 git（保持现状即可）。

## 2. 要做的事

> **本批已完成（A→D 全部落地，见 [`00-summary.md`](./00-summary.md) §二/§四）**：12 条必修项均修复并补判别性用例、门禁全绿（core 233 / 全仓 741 用例）；两条 owner 决策已实现（`camelizeProperties` 保名收窄、`isIndexKey` 对齐 lodash）；**D4「`console.warn` 补 dev 门控」经 owner 决策不实施**（告警在生产环境照常输出，勿再加 `isDevEnvironment`）；core changeset 定级**统一 `patch`**（原 D6 的 `minor` 建议不采纳）；01 报告 ❌-1 按内部 API 处理、不纳入（勿再补 `UseSearchFormExpandReturn` 导出）。下表为原始计划，仅作背景。

按 [`00-summary.md`](./00-summary.md) §二 的 **12 条必修项**，建议顺序 **A → B → C → D**：

| 批次  | 主题                                                    | 关键点                                                                                                                                                                                                             |
| ----- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A** | `useSearchFormExpand`（四包 SearchForm 共用，用户可见） | 初值自动展开被重测打回；每次测量重建 IO 导致旧回调 disconnect 新 IO；不可测行被过滤丢弃与注释不符                                                                                                                  |
| **B** | core 健壮性                                             | `useFields` 空/非数组入参；`appendColumn` 重复 key；环状 `children` 爆栈与 `preventExtensions`；`useFormData` 别名 + `useTable` 未克隆 `searchParam`；`cleanupObservers` 失明；`cloneDeep` 告警误报                |
| **C** | 安全边界                                                | 裸数字/布尔路径（`get({a:1},0)` 返回整对象）→ 入口 `toPath` 归一（对齐 lodash，需 Changeset）                                                                                                                      |
| **D** | 发布要素与测试                                          | `isObjectItem` P0 补测（`SU-05`）；语言包文案值（`LC-07`）与告警"仅一次"（`SU-06`）；失信断言；core `package.json` 缺 `repository`/`homepage`/`keywords`/`"./package.json"`；`normalizePathKey` 括号分支缓存（P1） |

**owner 决策（均已有结论，勿再问）**：`data-*`/`aria-*` 保名 → **收窄豁免**（DOM 属性值形态保名，prop 形态转驼峰）；`isIndexKey` → **对齐 lodash**（仅有效数组下标建数组）；`data-source` 归属 → 并入保名收窄决议（数字取值仍按 DOM 属性）。

## 3. 每条改动的完成标准

1. **判别性用例**：能捕获该缺陷（把修复回退 → 用例必须变红；即"突变验证"，需在回报中给出改前红/改后绿的实测输出）。
2. **门禁全绿**（在仓库根执行）：
   ```bash
   pnpm -r test                                    # 五包用例（core 当前 217）
   pnpm --filter "./packages/*" exec vue-tsc --noEmit   # 0 错误（vitest 不做类型检查，必须单独跑）
   npx prettier --check "packages/**/*.{ts,vue,json}"
   npx eslint "packages/**/*.{ts,vue}"             # 0 error（warning 允许）
   node scripts/check-test-ids.mjs                  # 用例编号同包内唯一
   pnpm --filter "@qin-ui/pro-components-core" build
   ```
3. **注释规范**（`AGENTS.md` §2）：只写"做什么/边界"，不写实现细节与动机；**核心方法的架构/设计说明要保留**（owner 明确要求：项目启用 sourceMap，注释是消费方资产）；只清理"改动过程史"。
4. **复用优先**：能从宿主导出/既有类型推导的，不要手写常量清单（例：表格属性面用宿主 `Table.props`/`TableEmits` 推导）。
5. **Changeset**：用户可见的 API/行为变化必须写 `.changeset/*.md`（`patch`/`minor` 按影响定），文案写"用户侧影响"。
6. **提交**（仅在 owner 确认后）：主题**以中文开头**（commitlint 拒绝以拉丁字母大写词开头的 subject），类型前缀 `fix|docs|refactor|test|chore`，作用域用包名；提交信息写清"改了什么 / 为什么 / 验证方式"。

## 4. 环境注意事项

- 会话末期出现**子代理中途失败（无结论）**的现象：如需并行审计，建议**小粒度切分 + 要求"边读边落盘、做不完先回报"**；关键结论务必自己用命令复验，不采信代理自述。
- 测试环境为 `happy-dom` + Vue Test Utils：**默认脱离 document 挂载**会导致"假绿"（例如隐式表单提交不触发）——涉及浏览器行为时请 `attachTo: document.body`（仓库既有 `attachToBody` helper）。
- `packages/core/es/`、`api.json`、`bin/init-ai.mjs` 等为构建产物（gitignore），跑 build 会刷新，属正常。

## 5. 相关文件

- 复核总结（先读）：[`00-summary.md`](./00-summary.md)
- 四份审计报告：[`01`](./01-release-and-packaging.md) 发布/类型/打包 ｜ [`02`](./02-tests-and-coverage.md) 测试与覆盖 ｜ [`03`](./03-shared-correctness.md) `shared` 正确性 ｜ [`04`](./04-form-table-correctness.md) `form`+`table` 正确性
- 二次复核材料（已提交）：[`../README.md`](../README.md) 及 `01-core.md` … `08-disposition.md`
- 变更清单（已提交）：仓库根 `CHANGE-MANIFEST-734e3c0.md`
- 评审报告正文（未纳入 git）：仓库根 `CODE-REVIEW-REPORT.md`
