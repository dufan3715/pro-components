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
