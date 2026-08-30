# @qin-ui/element-plus-pro

## 1.3.4

### Patch Changes

- 206e205: BaseField 补充注入配置 key 的行为边界 JSDoc 声明：组件名与 `picker`（element-plus 为 `type`）仅取 setup 期初始值，运行期变更不会切换 Provider 的默认值预设（`date-picker.month` 等子类型预设需在初始渲染前确定）。纯文档说明，无行为变化。
- 206e205: docs(source-comments): 全包源码注释完善——面向 sourceMap 进源码阅读场景

  面向「使用方经 declarationMap / sourceMap 进入包源码阅读」的场景补齐与修正注释，运行时行为零变化：
  - **core**：补齐关键逻辑段注释——`useForm` 的入参分派 / root 注入回退链 / `createFormProxy` 各 trap（实时取实例 + methodCache 引用记忆化）、`useFormData` 的注入复用与批量覆盖「先删后合」语义、`useFields` 的路径缓存回验自愈 / BFS 建索引 / 两段式降序 splice、`useTable` 的分页白名单 / 快照恢复 / DFS 匹配 key→dataIndex 顺序 / 列 key 兜底链、`path.ts` 的断裂语义与中间层建层规则、`useSearchFormExpand` 的测量驱动源与 RO 生命周期、locale 繁体判定顺序；
  - **UI 四包**：补齐 `ProForm` 的 `:key="formKey"` 子树重挂载契约注释（三包同构）、antdv-next 的 attrs.disabled 归一下发、element-plus 的 `@submit.prevent` 与 `onSizeChange` 重置回第 1 页、vant 的共享弹层容器 / popup 提交语义 / formPopup 附加策略；
  - **JSDoc 偏差修正**：三桌面包 `useTable` 的 `resetQueryParams` 由「重置分页到第一页」更正为「恢复到初始化快照」；三包 `SearchForm` 文档的 IntersectionObserver 职责描述与实现对齐；
  - **注释规范落地**：超过 1 行的注释统一为 `/* */` 块注释（AGENTS.md §2.2 新规），`// prettier-ignore` / `// eslint-disable-next-line` 工具指令对保留。

  纯注释变更，公开 API 与运行时行为零变化（五包 build / 454 测试 / vue-tsc / prettier 全绿）。

- 206e205: fix(base-field): 字段级 `onUpdate:*` 监听器不再被静默丢弃 (R-04)
  - 此前字段配置或 attrs 上传入的 `onUpdate:value`（element-plus/vant 为 `onUpdate:modelValue`）会在 BaseField 属性解构时被剥离丢弃，监听器永不触发；
  - 现改为与内部写值组合：先写入 formData（含 valueFormatter 转换），随后以组件**原始 emit 值**回放该监听器；`mergeProps` 合并为数组的多个监听器按序全部回放；
  - vant-pro 的 popup 型字段同样生效：监听器在 confirm 提交时触发，滚动选择过程的中间值不会误触；
  - 四包同构同步修复，新增判别测试 BF-B5 / VP-B5。

- 206e205: fix(base-form-item): 字段卸载时同步删除字段对象上的注入访问器 (R-21)

  `BaseFormItem` 卸载（或字段被移除）触发 ref 回调收到 `null` 时，此前仅清理 WeakMap 条目，`getFormItemRef` / `getFormItemComputedProps` / `getComponentRef` / `getComponentComputedProps` 闭包仍残留在用户字段对象上——业务对字段做 `{ ...field }` 浅拷贝或序列化会携带这些内部函数。
  - 以 antdv-next-pro 现行为为准对齐：`null` 分支在 WeakMap 删除之外同步 `delete` 字段对象上的四个注入访问器；
  - 运行期挂载行为不变（访问器仍在册、实例读取链路不变）；
  - 新增判别测试 BI-A4（三包同构）：断言卸载后访问器**属性本身**被删除（既有 BI-A3 仅断言返回值 undefined，无法判别残留闭包）。

- 206e205: fix(column-control): 无 key/prop 列不再出现在列控面板 (R-17)

  `ColumnControl` 此前为无 key/prop 列合成序号 key（`__col_${index}`）使其进入面板，但该合成 key 与真实列无关联——`setColumn(合成key, ...)` 在 core 中无法寻址而静默 no-op，勾选状态与实际列显隐脱节；列序变化时合成 key 也会漂移。现与 antd-vue-pro / antdv-next-pro 对齐：
  - 无 key、无 prop 或 key 为空串的列直接不进入列控面板（列控仅针对可寻址的有效列）；
  - 面板项移除对 `table.columnFallback` 文案兜底的依赖（key 必然非空）；
  - 经 core `useTable` 的列会被自动补齐 key，不受影响；直接传 `columns` prop 的原始列配置中被过滤的列仍正常渲染，仅不提供列控开关；
  - 新增判别测试 CC-A2（三包同构：无 key/空串 key 列被过滤，合成 key 不再出现）。

- 206e205: fix(element-plus-pro): 修复 ProTable 丢弃 ElTable 原生事件监听与声明式属性透传问题 (R-01, R-26)
  - 建立 `PRO_TABLE_EXCLUDED_ATTR_KEYS` 排除机制，将未被 ProTable 自身消费的所有 `attrs`（包含所有 `onXxx` 事件监听器及扩展属性）透传至底层 `<ElTable>` (R-01)；
  - 在 `Props` 类型的 `TableProps` 扩展中补充 `/* @vue-ignore */`，使直接声明在 `<ProTable>` 上的 Element Plus 原生属性（如 `stripe`、`border`、`rowKey` 等）正常流入 `attrs` 并透传至 `<ElTable>` (R-26)；
  - 通过 `defineEmits` 类型声明（基于 element-plus `TableEmits`）为模板层 `@event` 提供事件类型提示与补全；
  - 完善 `ProComponentProvider` 全局注入配置与 attrs 的优先级合并链路。

- 206e205: refactor(use-group-field-attrs): `FORM_ITEM_SLOT_KEYS` 判定改为模块级 Set（SIMP-07）

  字段循环内的 FormItem 插槽名判定由数组 `includes`（O(n) 线性扫描 + `as any` 断言）改为模块级 `Set.has`（O(1)），与同文件 `gridItemPropKeySet` / `formItemPropKeySet` 的既有优化对齐；导出的 `FORM_ITEM_SLOT_KEYS` 常量数组及其元组类型（`GroupedField.formItemSlots` 的键类型来源）保持不变，公开 API 无影响。纯内部实现优化，行为零变化（slots 分组行为由既有 hooks-locale / BaseFormItem 测试覆盖）。

- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
  - @qin-ui/pro-components-core@2.0.3

## 1.3.3

### Patch Changes

- - **core**:
    - 修复 `setFormData` 类型定义，补齐顶级已知字段泛型重载与 `ExtendWithAny` 批量覆盖兼容性；
    - 恢复 `getFormData` 2 层与 3 层嵌套路径的强类型推导重载；
    - 优化 `setFormData`、`getFormData` 与 `getField` 的 JSDoc 结构，消除 TypeScript 方法重载在 IDE Hover 时产生的首行文字无格式拼接问题。
  - **UI 适配层 (antd-vue-pro / antdv-next-pro / element-plus-pro / vant-pro)**:
    - 完善 `useForm` JSDoc 中 `setFormData` 四种调用形态说明并对齐最新 core 类型定义。
- Updated dependencies []:
  - @qin-ui/pro-components-core@2.0.2

## 1.3.2

### Patch Changes

- - fix(table): 统一内部序号列标识为 `__INDEX__` 并在 `ColumnControl` 中默认排除，避免无效果操作
  - fix(table): 增加 `isSlotRenderable` 守卫 `bodyCell`、`headerCell` 等列依赖插槽，防御列隐藏/空列状态下访问 `column` 属性触发 `TypeError`

## 1.3.1

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

- Updated dependencies []:
  - @qin-ui/pro-components-core@2.0.1

## 1.3.0

### Minor Changes

- e8c97d0: ### ⚠️ API 变更与适配说明 (Breaking Changes / API Notice)
  - **SearchForm 按钮插槽事件绑定机制调整**：
    - 移除了 `<slot name="reset-button">`、`<slot name="search-button">`、`<slot name="expand-button">` 上无效的直接 `@click` 监听；
    - 改为通过**插槽作用域 (Scoped Slots)** 规范向外暴露操作方法与状态：
      - `#reset-button="{ onReset }"`
      - `#search-button="{ onSearch }"`
      - `#expand-button="{ expandStatus, changeExpandStatus }"`
    - 自定义上述插槽内容的消费方，需通过作用域参数绑定点击事件。
  - **ValueFormatter 旧值传递机制与只读快照契约**：
    - **按需注入旧值**：底层基于格式化函数的形参个数（`fn.length > 1`）决定是否读取旧值上下文。若转换逻辑需要使用旧值，请显式声明两个形参 `(val, oldVal) => ...`（请勿使用默认参数或 `...args` 剩余参数，否则 `fn.length` 无法正确识别）；
    - **只读快照副本**：传入的 `oldVal` 为只读快照副本，不得依赖原地修改写回；仅当 formatter 声明双形参时才克隆旧值，单参转换零开销。

  ### 🐞 缺陷修复与优化 (Bug Fixes & Improvements)
  - **BaseFormItem (A3)**：重构实例 ref 收集机制为 `WeakMap` 按字段对象引用绑定，彻底杜绝字段被 `splice`、动态增删、重排等直接变异场景下的实例错位；
  - **ProComponentProvider (A1)**：全量配置项改为 `computed` 响应式提供，子组件及 hooks 全面响应式对齐；
  - **ProForm (A2, B1)**：
    - 未传 `form` 时自动调用 `useForm()` 自建实例并 provide，避免向下游注入空对象；
    - 注入层采用 `Proxy` 动态代理，支持父组件运行期动态替换 `:form` 实例；
    - 移除显式 `disabled` prop，遵循 Element Plus 原生 `useFormDisabled` / 上下文机制向下级组件注入禁用状态；
  - **ProTable (A6, A7, E3, E4, E5)**：
    - 采用响应式派生读取 `table` 内部属性，支持动态替换表格实例；
    - 规范分页三级链合并优先级，修复 `tableAttrs.pagination === false` 以及全局 `pagination: false` 的优先级逻辑；
    - 序号列跨页索引递增计算修复；
    - 统一 `computedControl` 对象形态默认值为 `?? false`，与 antd 系组件库保持一致；
  - **SearchForm (A4, A5, A10, A11)**：
    - 增加手动折叠保护机制，避免窗口缩放或重绘时无条件收起用户手动展开的状态；
    - 修复 `proFormHeight` 初始渲染时产生 `unsetpx` 脏样式的问题；
  - **BaseField (A12, A14, B4)**：
    - `inject` 提升至 setup 同步期，消除 `getInitProps` 在 computed 内部调用的时序隐患；
    - 移除 `omit` 依赖，改用对象解构分离属性绑定；
    - 未匹配到组件类型时输出明确警告并降级为原生元素渲染；
    - 落地 B4 旧值按需克隆契约。

### Patch Changes

- Updated dependencies [ebfc333]
- Updated dependencies [ac4f1f7]
- Updated dependencies [20070df]
- Updated dependencies [7008a80]
- Updated dependencies [fb089aa]
- Updated dependencies [e8c97d0]
- Updated dependencies [436d5e9]
- Updated dependencies [fbd14ad]
  - @qin-ui/pro-components-core@2.0.0

## 1.2.4

### Patch Changes

- perf: 表单渲染链路深度扁平化重构与性能优化
  - **链路扁平化（8 层 -> 6 层）**：彻底移除 `PathProvider` 组件实例，精简组件树层级
  - **Hook 纯函数化**：将 `GroupedFieldAttrs` 改造为 `useGroupFieldAttrs` 纯计算 Hook，100% 消除作用域插槽闭包转发开销
  - **实例开销降低**：单字段 Vue 内部组件实例减少 2 个（Antd 系 8->6，Vant 4->2），内存与首次挂载速度显著优化

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.1.3

## 1.2.3

### Patch Changes

- fix: 修复 ProTable 列配置响应式引用断开、多级表头递归与表单插槽注入时序等问题

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.1.1

## 1.2.2

### Patch Changes

- fix(form): 修复 slots 类型合并逻辑，避免 FormItem 插槽与底层组件插槽产生交集类型

## 1.2.1

### Patch Changes

- fix(table): 优化列控制交互与排除 \_index 列，规范 prop 类型定义

## 1.2.0

### Minor Changes

- 新增多语言国际化（i18n）机制及 ProTable 列控制增强配置：
  - 支持内置语言包（zh-CN / zh-TW / en-US），能够跟随宿主 UI 库全局语言自动切换。
  - ProComponentProvider 新增 `locale` 属性，支持覆盖任意内置文案。
  - ProTable 列控制 `control.columnControl` 支持传入配置对象（支持自定义 `labels` 别名映射、`excludedKeys` 排除列、`disabledKeys` 锁定展示列、`disableCheckAll` 禁用全选）。

### Patch Changes

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.1.0

## 1.1.4

### Patch Changes

- bc7afa4: ## AI 上下文优化

  ### init-ai 脚本去重（根模板生成方案）
  - 新增 `scripts/init-ai.template.mjs`：四包共享的 init-ai.mjs 模板，差异点用 `{{PKG_NAME}}`/`{{UI_LIB_DESC}}`/`{{DOC_URL}}`/`{{SKILL_DESC}}` 占位符
  - 新增 `scripts/generate-init-ai.ts`：构建时按包配置替换占位符生成 `bin/init-ai.mjs`（仿 `generate-api-json.ts` 风格）
  - 各包 `prebuild` 钩子追加 `&& tsx ../../scripts/generate-init-ai.ts <pkg>`
  - `.gitignore` 追加 `packages/*/bin/init-ai.mjs`（与 `api.json` 一致作为构建产物）
  - 根 `package.json` 新增 `generate:init-ai` 脚本

  ### AI-CONTEXT.md 激进精简 + 校对修正（4 包）

  主载体 AGENTS.md（即 AI-CONTEXT.md）只保留规则/速查/反模式/导航，全量代码示例与详细 API 下沉到 skills 载体（README + api.json）。

  **共性修正（源码核对 core useFormData/useFields）：**
  - `setFormData` 补充函数式批量更新 `setFormData(prev => ({...prev, name:'新'}))`
  - `getField` 补充查找函数形式 `getField(f => ...)` + `{ all: true }` 返回数组
  - `setField` 补充函数式更新 `setField(path, prev => ({...}))` + `{ all: true }` 批量
  - `deleteField/appendField/prependField/getParentField` 补充 `{ all: true }`
  - `appendField/prependField` 补 `undefined` 末尾/开头 + 数组入参
  - `valueFormatter` 时机修正：实际在 computed setter 中、setFormData 写入前执行；注明函数形态仅 set 方向生效

  **antd-vue-pro / antdv-next-pro 专有修正：**
  - INJECT_CONFIG `pageSizeOptions:['10'..'100']` 伪代码 → 实际 `['10','20','30','40','50','100']`
  - `expand` 补 `expandStatus: false`
  - 确认 `labelAlign` 在 ant-design-vue v4 / antdv-next FormItem.props 中，保留在 FormItem 层

  **element-plus-pro 专有修正：**
  - INJECT_CONFIG autocomplete placeholder → '请输入'（误与 select/cascader 合并为 '请选择'）
  - pro-table expand 补 `expandStatus: false`
  - date-picker 子类型补全 `dates`/`months`/`years`/`datetimerange`
  - ProTable props 补 `columns`/`data`/`pagination`
  - Column 补 `key` 字段

  ### README.md 同步校对（4 包）

  修正与 AI-CONTEXT 一致的 INJECT_CONFIG 数据错误、API 签名描述漏项、valueFormatter 时机/方向，确保 skills 载体内容准确。

  ### skills 标准结构重构

  `.agents/skills/{pkg}.md` 扁平大文件 -> `.agents/skills/{pkg}/` 标准分层目录：
  - `SKILL.md`：skills 入口（frontmatter + 速查 + 参考导航）
  - `references/README.md`：完整使用文档
  - `references/api.md`：结构化 API 元数据

  同步修正四包 AI-CONTEXT.md / README.md / docs 中的旧路径引用。

  ### 安装方式修正

  AI-CONTEXT.md 移除不必要的 `import 'xxx.css'` 和 `app.use()` 全量注册，改为按需引入（推荐）。

  ### 代码 bug 修复（vant-pro）

  `GroupedFieldAttrs` 属性剥离名 `formItemContainer` -> `fieldContainer`，与 `Field` 类型定义一致。
  原 bug：类型定义暴露 `fieldContainer`，但运行时剥离 `formItemContainer`，导致用户传 `fieldContainer` 会泄漏到内部控件 attrs。

  ### 文档与代码一致性核对

  逐包源码核对 componentMap、INJECT_CONFIG、useForm/useTable 签名与返回成员、属性分层透传逻辑、valueFormatter 时机、Form 实例方法名等，修正 useForm 重载一签名（补 `root` 参数）。

## 1.1.3

### Patch Changes

- 文档体系 v2.1 升级：AI-CONTEXT.md 重写为完整使用规则版；README 补全 AI 辅助开发引导、属性分层透传、INJECT_CONFIG 默认预设、ProTable 数据流、Column 说明、valueFormatter、自定义组件 4 种方式、响应式联动等章节；init-ai 改造为双载体（AGENTS.md 主载体 + .agents/skills/ 参考载体，支持标记区块智能合并与幂等更新）；重新生成 api.json 修复 Hook 参数提取；修复 generate-api-json.ts 的 @param 正则。

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.0.3

## 1.1.2

### Patch Changes

- fix(core): 修复 useTable 重置查询参数时未恢复初始分页参数的问题

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.0.2

## 1.1.1

### Patch Changes

- 修复 sideEffects 导致消费方 CSS 被删除，并完善发布字段与构建配置
  - 修复 antd-vue-pro / element-plus-pro 的 `sideEffects: false` 导致消费方 tree-shaking 时 CSS 自动引入被删除的 bug
  - 各包完善 exports、prepublishOnly、engines、browserslist 等发布字段
  - vue-component-type-helpers 从 dependencies 移至 devDependencies
  - 简化为单入口构建，消除产物 hash 后缀
  - 清理 tsconfig 死配置，显式 `vue-tsc --noEmit`
  - core devDeps 对齐根版本，统一 vue peer 为 ^3.5.0

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.0.1
