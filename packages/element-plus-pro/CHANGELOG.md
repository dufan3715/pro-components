# @qin-ui/element-plus-pro

## 1.4.2

### Patch Changes

- 325b356: 内部重构：字段禁用取值的三级优先（字段显式 > 外层上下文 > componentVars 默认值）收敛为共享工具 `resolveEffectiveDisabled` 单一实现，两包调用点对齐，无行为变化。
- 325b356: 统一 `disabled` 取值优先级为「字段 > 表单 > componentVars 默认值」：
  - antdv-next-pro：修复 `componentVars` 中组件级 `disabled` 默认值在表单未声明 `disabled` 时始终失效的问题；
  - element-plus-pro：修复表单显式 `disabled={false}` 无法覆盖组件级 `disabled` 默认值的问题。

  显式字段级 `disabled={false}` 仍可解禁；`disabled` 的 `''` / `'disabled'` 字符串形态与宿主 Boolean 解析保持一致。

- 2b718c0: 修复 ProTable 在 pageSize 变更触发页码钳制时重复发起查询的问题：pageSize 变更窗口内忽略宿主级联的 `current-change`，查询仅执行一次，页码稳定回到第 1 页。
- 325b356: 补齐 `date-picker` 季度族占位符兜底：`quarter` / `quarters` 未显式配置时回落 `date-picker.placeholder`，`quarterrange` 回落开始/结束日期文案，与 `date` / `month` / `year` 族保持一致。
- 2b718c0: 补充显式 `:columns` 的 key 约定说明：显式列按原样透传给宿主，ProTable 不补齐 `key`，需调用方提供 `key` / `dataIndex` / `prop`；显式模式下 `setColumn` 与列控入口均不生效。
- Updated dependencies [1573e89]
- Updated dependencies [1573e89]
  - @qin-ui/pro-components-core@2.1.1

## 1.4.1

### Patch Changes

- 修正 `element-plus` peer 下限为 `^2.14.5`，与 `TableEmits` 的宿主导出及文档、开发依赖一致。
- 修复 1.4.0 中 ProForm 网格默认值与 Provider grid 语义回归：`grid` 默认关闭；Provider 的 `pro-form.grid` 仅作为启用网格时的参数配置，不再单独开启网格；显式 `grid: true` 时使用内置默认 gutter。

## 1.4.0

### Minor Changes

- 47101e2: 修复 element 表格的 `default` 插槽误报与空 `key` 列复用问题，并同步文档口径：
  - **`default` 插槽改为保留语义（破坏性变更）**：改造前 `default` 插槽会透传给 `ElTable`，可用于 `<ProTable><el-table-column/></ProTable>` 声明原生列；现 `default` 保留给列渲染器，传入内容不再渲染，确有内容时提示一次；列请通过 `columns` / `table.columns` 声明。**迁移**：将默认插槽中的 `el-table-column` 改为 `columns` 配置（或 `<template #table>` 自行渲染）。提示判定按插槽实际产出（仅注释节点 / 空白文本不计），包装组件透传空插槽不误报；求值由一次性 `effect` 执行并立即 `stop`，插槽内的响应式读取不进入 `ProTable` 的渲染依赖。
  - **peerDependency 下限**：`element-plus` 的 peer 下限由 `^2.13.6` 调整为 `^2.14.5`；`TableEmits` 自 2.14.5 从宿主包根导出，`TableProps` / `ProTable` 的类型面依赖该入口。
  - **空字符串 `key` 的列不再共用渲染 key（§3 遗留 5 附注）**：`key: ''` 此前被视为有效标识，与 `getColumnProps` 的 `columnKey` 取值不一致，多个空 `key` 列会产出相同 vnode key。现空串按「未提供」处理，回退 `prop`，再回退列对象身份。
  - **文档同步（§3 遗留 7）**：docs 的 `ProTable` 表补 `addIndexColumn` / `control` 内置默认值 `true` 与 `default` 插槽行、修正列插槽透传说明；`ProForm` 字段表补 `prop` 优先于 `path`、`name` 透传语义与 `disabled` 继承说明；README 与 AI-CONTEXT 补 `useFormData()` 的取值边界（与 `antd-vue-pro` 同句）——`<ProForm :form="form">` 场景下 `useFormData()` 承接的是 ProForm 内部兜底实例的数据 store，与传入实例**非同源**，需同源请用 `useForm(false)` 或直接使用传入实例。
  - **注释与死代码**：删除 `useGroupFieldAttrs` 中恒不可达的 `Array.isArray` 分支（`resolveFieldIdentity` 返回 `string`）与 `ProTable` 中 `filter(...)?.length` 的死可选链；列渲染 key 的注释改为行为陈述并纳入 `DOC-01` 守卫。

  无公开 API 签名变更（`default` 插槽行为变更见上）。

  破坏性变更：有 —— `default` 插槽由「透传宿主表格」改为「保留给列渲染器、不参与渲染」（迁移方式见上）；空 `key` 列此前共用同一渲染 key，修正后列复用正确，属缺陷修复。

### Patch Changes

- e73293a: 随包 AI 上下文（AI-CONTEXT.md）新增「项目级覆盖层」规则：AI 在生成任何 Field/Column 代码前，将先全局搜索并读取项目 `ProComponentProvider` 的实际 `componentVars` / `componentMap` / `locale` 配置（属性优先级：Field 属性 > 项目 Provider > 内置默认）。规则不含配置值快照，项目修改配置后无需重新执行 `init-ai`，AI 每次会话都读取最新源码。
- 077f293: 收敛适配层导出面并对齐字段/列状态契约文案：
  - **`normalizeColumn` / `normalizeColumns` / `localePacks` 的导入面**（CR-025）：core 已公开导出这三个 API；四包 `shared/core` 按统一导入契约再导出，仅供 `@qin-ui/*-pro` 包内源码使用，包根不公开，业务侧请从 `@qin-ui/pro-components-core` 导入。
  - **`install()` 的非空断言**（CR-025）：`ProComponentProvider.name!` 改为 `name ?? 'ProComponentProvider'` 兜底，去掉断言且不产生 `undefined` 注册名。
  - **状态契约文案收敛**（CR-030）：四包字段类型的 `hidden` 明确「支持布尔 / `Ref` / getter，渲染期按 `toValue` 取值」、`disabled` 明确「字段级优先，未显式指定时继承上层禁用上下文」，并说明嵌套字段 `path` 为各自独立的完整路径（不与父级拼接）；三包列类型的 `hidden` 类型标注为布尔，渲染期按 `toValue` 取值（`Ref` / getter 形式在运行期生效）。
  - **注入类型消费端收敛**（CR-028）：四包 `BaseField` 原先以 `as { value: … }` 手工断言注入形态，现直接使用类型已收敛的 `InjectionFormSlotsKey`，去掉断言。
  - **组件 JSDoc 绑定修正**（CR-024）：四包 `src/index.ts` 原先把三段组件说明写在同一个 JSDoc 块中，只有最后一段绑定到导出语句（ProForm / ProTable 的文档在 IDE 中丢失）。现拆为三段，各自紧贴对应 `export { … }`。

  破坏性变更：无（包根导出面不变；`install()` 注册名行为不变）。

- 0f61b82: 修复插槽组件对象渲染与 `SearchForm` 的必填 `form` 契约（CR-086～CR-089）：
  - **插槽渲染组件对象（CR-086）**：`SlotComponent` 的分支判定此前只识别 VNode 与函数，而 `SlotComponentType` 允许直接传组件对象 —— 传入组件对象时会落入文本插值，DOM 中渲染出组件对象的 JSON 文本（自引用对象还可能抛循环引用错误）。现改为**非原始值（非 `string`/`number`/`boolean`/`null`/`undefined`）一律交给 `<component :is>` 渲染**，原始值仍按文本插值。影响 `antd-vue-pro` 与 `antdv-next-pro`（`element-plus-pro` 既有实现已符合该语义）。
  - **`SearchForm` 的 `form` 属性默认值移除（CR-087）**：`form` 声明为必填却带 `default: undefined`，运行时 props 选项与类型面不一致（`vue/no-required-prop-with-default` 告警）。现删除该默认值，`form` 保持必填。
    ⚠️ **使用方注意**：若你此前省略 `form`（依赖默认值走「孤立表单」路径，搜索条件与表格脱钩），现在需要在开发期得到明确缺失提示前显式传入 `form`（通常传 `table.searchForm`）；正常用法不受影响。涉及 `antd-vue-pro`、`antdv-next-pro`、`element-plus-pro`。
  - **字段 `span` 的栅格语义文档化（CR-088）**：**行为不变** —— 字段显式指定 `span` 时**整体接管栅格**，不再叠加 Provider 注入的响应式断点（`xs`/`sm`/`md`/`lg`/`xl`/`xxl`）；未指定 `span` 时使用注入的断点配置。此前 `useGroupFieldAttrs` 的注释与类型契约表述相反，现已统一为上述行为陈述，并在三包 `pro-form` 文档中同句声明。
  - **类型导入收敛（CR-089）**：包内纯类型绑定统一改为 `import type`（不再引入不存在的运行期依赖），并在仓库 ESLint 配置中开启 `@typescript-eslint/consistent-type-imports` 防止回归。该改动为纯类型层，无运行时影响。

- bdbd58d: 修复 `data-*` / `aria-*` 属性名被驼峰化破坏的问题：
  - **现象**：`camelizeProperties` 对全部 key 调用 `camelize`，`data-testid` 变成 `dataTestid`、`aria-label` 变成 `ariaLabel`，属性名在 DOM 上被破坏 —— 可访问性属性（`aria-*`）、测试选择器（`data-testid`）、第三方埋点属性全部失效。四个包的 `ProForm` 都是 `mergeProps(injectAttrs.value, camelizeProperties(attrs))` 且无白名单，直接下发宿主 `<Form>`，均受影响。
  - **修复**：`camelizeProperties` 对 `data-*` 与 `aria-*` 前缀的 key（大小写不敏感，如 `ARIA-live`）按原样保留，其余 key 仍转换为 camelCase。
  - **行为边界**：仅前缀为 `data-` / `aria-` 的属性名保名；`kebab-case` 属性（`user-name`、`row-key`、`on-row-click`）转换语义不变。
  - **回归**：`SU-04`（core 单元：转换语义 + 保名 + 驼峰变体不存在）、`PF-D1`（四包：带 `data-testid` / `aria-label` 的 `ProForm` 渲染后宿主 `<form>` 上属性名原样存在）。

  破坏性变更：无。

- 14985ab: 字段类名与样式复用宿主 Vue 的 `ClassValue` / `StyleValue`，四包口径统一：
  - **三个桌面包（antd / antdv-next / element）**：`Field.formItemClass` / `Field.componentClass` 由 `string` 放宽为宿主 `ClassValue`，`Field.formItemStyle` / `Field.componentStyle` 由 `CSSProperties` 放宽为宿主 `StyleValue`。运行期这些属性本就经 `mergeProps` 落到宿主 `:class` / `:style` 绑定，数组与字符串形态一直可用，此前只被类型面挡住。
  - **vant**：`Field.componentClass` / `Field.fieldClass` 由 `any` 收敛为宿主 `ClassValue`（`any` 使类型面失去校验），`Field.componentStyle` / `Field.fieldStyle` 由 `CSSProperties` 放宽为宿主 `StyleValue`。
    ⚠️ **升级影响**：vant 的类型面不再接受任意值（如 `number`、`() => string`）；原先依赖 `any` 静默通过的写法请改为字符串、类名对象或数组。三个桌面包为纯放宽，既有写法不受影响。
  - **文档修正**：四包 `README.md` 字段表的类型列同步为 `ClassValue` / `StyleValue`；`docs/vant-pro` 字段表同步；`@qin-ui/vant-pro` 的 `src/index.ts` 入口示例由 `component: 'input'`（未注册组件名，运行时会告警并降级为原生元素）改为 `component: 'field'`。
  - **回归**：antd / antdv-next 新增 `SX-07`、element 新增 `BI-A19`、vant 新增 `BI-A22`（数组 / 对象类名与字符串 / 数组样式的绑定结果 + `@ts-expect-error` 锁定类型面）；antdv-next 新增 `DOC-06` 锁定四包类型面与 README 同句，vant 新增 `DOC-05` 锁定本包文档面。

- 41daa4d: 修复表格分组列（多级表头）永不渲染的问题：
  - **现象**：列配置中带 `children` 的分组列（如 `{ label: '一级分组', children: [{ prop: 'c1', label: '子列1' }] }`）下，所有子列静默消失——父列表头为空，子列的标题与单元格数据均不出现在表格中，且无任何告警。
  - **原因**：`TableColumnRenderer` 原实现把列树递归封装为状态组件；element-plus 仅在父列默认插槽中收集子列，且只接受 `ElTableColumn` 直系 vnode、函数式组件（`shapeFlag & 2`）与 Fragment，状态组件 vnode 被收集逻辑直接丢弃。
  - **修复**：`TableColumnRenderer` 改为渲染函数组件，递归生成 `el-table-column` 树，子列以同层 vnode 数组进入父列默认插槽，任意分组层数均成立；自定义 `render` 列改由 scoped slot 函数承载，稳定 key、`hidden` 响应式解包与点分路径取值语义保持不变。
  - **回归**：新增 `PT-A17 [判别]` 用例（一级分组 + 三层分组 + 普通列，断言多级表头标题与三列单元格数据），该用例在修复前失败、修复后通过。

  破坏性变更：无。

- f87d529: 修复语言判定结果取决于「是否包了一层 `el-config-provider`」的问题：
  - **现象**：只包 `<el-config-provider>` 而未传 `locale` 时，`useLocale().lang` 被判为 `en-US`（文案切英文）；不包 provider 时为 `zh-CN`。语言结果由「是否包 provider」而非实际语言决定。
  - **原因**：`ElConfigProvider` 会无条件 provide `localeContextKey`（值为 `computed(() => context.locale)`，可能为 `undefined`），而判定用的是注入对象本身的真值 —— 该对象恒为真，于是走进 element-plus 的 `useLocale().lang`（locale 为空时回退 English）。
  - **修复**：改为按注入值的**本体**判定 —— `toValue(elLocaleContext) == null` 时回退 `zh-CN`，与「不包 provider」的行为一致；显式传入语言（如英文 `locale`）时仍按宿主语言判定。
  - **回归**：`LC-04` —— 仅包 provider 未传 `locale` → `zh-CN`；不包 provider → 同值；显式传英文 `locale` → `en-US`。

  破坏性变更：无。

- 083c6b7: 修复 `ProTable` 传入 `default` 插槽导致整表失去全部列的问题：
  - **现象**：`<ProTable>` 上写 `#default` 时，该插槽被透传给宿主 `ElTable`，动态 `default` 覆盖了模板中承载列渲染器的静态 `default`，表格静默失去全部列（`createSlots` 语义：动态同名插槽覆盖静态插槽）。
  - **修复**：槽位转发时**保留 `default`** 给列渲染器（不再透传同名用户插槽），并对传入 `default` 的用户给出一**次性**提示，指引使用 `search-form` / `button-bar` / `toolbar` / `table` 具名插槽 —— 与 antd / antdv-next 在类型层排除 `default` 的口径对齐。
  - **回归**：`PT-A20` —— 传入 `default` 插槽后表头仍为 1 列且列名正确、表体数据正常、用户内容不透传宿主表格、提示出现一次。

  行为变更：有 —— `default` 插槽内容不再透传宿主表格；具名插槽行为不变。

- c4b47db: element 表格单来源化、DOM 属性泄漏修复与告警去重（CR-094、CR-098～CR-103）：
  - **`container` 不再泄漏到原生 `<form>`（CR-098）**：`searchFormConfig.container`（组件对象或 `false`）此前沿 `SearchForm` → `ProForm` → `ElForm` 的 attrs 落到原生 `<form>` 上，DOM 中出现非法属性 `container="[object Object]"`。现于 ProTable 向下传参前剔除 `container`（`hidden` 一并剔除，二者均由 ProTable 自身消费），未改变 `SearchForm` 的 attrs 透传行为。
  - **两类搜索配置告警不再互相静音（CR-099）**：原先共用单个去重标志，只打印先触发的一条，冲突配置提示会被永久静音；且未配置 `search` 时也会误报「未返回 Promise」。现按告警原因分键去重，并仅在确实配置了 `search` 时校验（与 `antd-vue-pro` / `antdv-next-pro` 口径一致）。
  - **表格属性单一来源与死代码清理（CR-094）**：`pagination` / `size` / `data` / `columns` / `tableContainer` 一律从对应 prop（或 Provider 注入）派生 —— 此前代码中"从 attrs 取这些键"的分支**恒不可达**（它们均为已声明 prop，永不进入 `attrs`；且 `ElTable` 的 props 不含 `pagination`），一并删除；手写的 Provider 键清单改为由 `Object.keys(props)` **推导**（复用优先，不再维护自造清单），相关的 4 条 `delete` 与排除键集合中的 6 个死键同步移除。**无行为变更**（被删路径实测不可达）。
  - **`defineEmits<TableEmits>()` 与运行时不一致（CR-100）**：实测运行时 emits 仅 `update:size` / `update:loading`（来自 `defineModel`），表格事件（`row-click` 等 19 个）当前经 attrs 到达宿主表格；一旦外部类型变为可解析，宿主事件名会进入 emits 并把 attrs 监听剔除、导致事件**静默失效**。因**删除该声明会使产物 d.ts 中的事件处理器键消失（公开类型面回归）**，本次保留声明并补充行为说明与守卫用例，**不引入行为变更**；彻底移除需另立「显式事件转发 + 类型面迁移」的破坏性变更提案。
  - **死过滤清理（CR-101）**：`useGroupFieldAttrs` 中 `k !== 'disabled'` 的过滤为死代码（`ElFormItem` 的 props 共 12 键、不含 `disabled`），已删除；分组 `disabled` 传播经用例与突变确认**依然有效**（无 CR-003 回归）。四个 `disabled` 上下文 helper 经逐一核实**均有可达路径或属对外别名**，全部保留。
  - **JSDoc 结构对齐（CR-102）**：`ProForm` / `ComponentProvider` / `useGroupFieldAttrs` / `BaseFormItem` 的注释结构与另三包对齐（`@public` 位置、`@param {...FormProps} ...attrs`、完整 `@example`、`@slot` 与 props 级说明），删除实现手段类表述。

- 3a99eb0: 修复字段实例访问器未进入公开类型面的问题（消费方此前只能 `as any`）：
  - **现象**：字段渲染挂载后，运行时会在字段配置对象上注入实例访问器，但四包的公开字段类型（`Field` / `Base`）均未声明，TypeScript 消费方访问 `field.getComponentRef?.()` 只能靠 `as any` 或 `@ts-ignore`。
  - **修复**：复用 core 既有的规范类型 `AdditionalMethods<FormItemInstance>`（**未新增重复类型**），在公开 `Field` / `Base` 上交叉该类型：
    - `antd-vue-pro` / `antdv-next-pro` / `element-plus-pro`：`AdditionalMethods<FormItemInstance>`（宿主 FormItem 实例类型）；
    - `vant-pro`：按其运行时实际挂载范围取 `Pick<AdditionalMethods<any>, 'getComponentRef' | 'getComponentComputedProps'>`（vant 不挂载表单项级访问器）；
    - 各包 `shared/core` 按统一导入契约（§1.3）再导出 `type AdditionalMethods`。
    - 交叉位置在公开类型映射（`WithRef`）**之外**：字段配置属性会被映射为 `MaybeRefOrComputedRef`，若声明在 `BaseCommon` 内，访问器会变成 `Ref | (() => T)` 而不可调用。
  - **回归**：四包新增 `BI-A16` —— `const field: Field = form.fields.value[0]` 后直接访问并调用访问器（无任何类型断言）；element 既有用例中的 `as any` 一并移除。

  破坏性变更：无（仅类型面补充，运行时行为不变）。

- bd888e9: 统一「字段标识」契约（宿主标识键优先于 `path`）并修复 element 的两处相关问题：
  - **element：`ProLocale` 类型放宽**。此前 `ProLocale = typeof zhCN`（`as const` 字面量）使 `Partial<ProLocale>` 只接受与内置文案逐字相同的值，`:locale="{ 'table.query': '搜索' }"` 必然类型报错。现为 `Record<keyof typeof zhCN, string>`，保留本包 `date-picker.*` 等扩展键，取值放宽为任意字符串。
  - **element：字段标识改为 `prop` 优先**。`el-form-item` 的标识属性是 `prop`（对应 antd/vant 的 `name`），但此前实现照搬了 `name ?? path`：`{ path: 'a', name: 'b' }` 会绑到 `b` 且 `name` 被吞掉，`{ prop: 'a', path: 'b' }` 会被 `path` 覆盖。现统一为「宿主标识键优先于 `path`」——element 取 `prop ?? path`，`name` 不再参与标识解析，作为控件自身属性透传（`el-form-item` 无 `name` prop）。
  - **core：标识键可配置化（新增 API）**。新增 `resolveFieldIdentity(field, keys)`、`DEFAULT_FIELD_IDENTITY_KEYS = ['name', 'path']` 与 `UseFieldsOptions`；`useFields(fields, { fieldIdentityKeys })` 与 `useForm(initData, fields, root?, options?)` 支持自定义标识键序。此前 core 的字段查找 API（`getField` / `setField` / `deleteField` / `getParentField`）固定按 `name ?? path` 解析，与 element 的渲染标识不一致（`{ prop: 'a' }` 时 `getField('a')` 静默 miss），现字段读写、表单域标识与查找 API 共用同一解析结果。
  - **`antd-vue-pro` / `antdv-next-pro` / `vant-pro`**：hook 内联的 `name ?? path` 收口到 `resolveFieldIdentity(field)`（默认键序），并各补 1 条规则锁用例；`shared/core` 补再导出以符合统一导入契约。

  **行为差异披露（四个 UI 包）**：标识解析结果统一经 `normalizePathKey` 归一化，渲染到 DOM `path` 属性与 `:path` 的值随之变化 —— 方括号写法（如 `path: 'a[0]'`）由 `a[0]` 变为 `a.0`；number / boolean 标识（如 `path: 0`）由空串变为 `"0"` / `"false"`。语义等价，且此前 hook 与 core 查找对该写法本就不一致；若业务代码读取过 DOM `path` 属性或依赖 `:path` 的原样透传，请按归一化后的值适配。

  **迁移提示**：
  1. element 下若曾用 `prop` 表示「仅校验路径、值绑定用 `path`」的解耦写法，现 `prop` 即字段标识（优先于 `path`），请改用 `path` 单独声明绑定路径；
  2. element 下若曾仅用 `name` 作字段标识，请改用 `path`（该写法在 element 类型层本就不受支持：`BaseCommon` 只声明 `path`，`name` 由控件 props 合入）。

- d20727b: 统一字段 `hidden` / `disabled` 的声明口径与文档（不含 getter），四包一致：
  - **声明面回到单一真源**：字段 `hidden` / `disabled` 在四包 `BaseCommon` 中一律声明**原始值类型**（`boolean`），类型面与渲染期的响应式形态（`Ref` / `ComputedRef`）由 `WithRef` 统一派生（与 `path` / `label` / `span` 等同族属性一致）。此前 `vant-pro` 把这两个键声明为 `MaybeRefOrComputedRef<boolean>` / `MaybeRef<boolean>`，经 `WithRef` 后形成**二次包装**（`MaybeRefOrComputedRef<MaybeRefOrComputedRef<boolean>>`），类型展示冗余。字段与列的口径差异是设计使然：`Column` 不经 `WithRef`，其 `hidden` 必须显式声明 `MaybeRefOrComputedRef<boolean>`。
  - **公开类型面的有效形态不变**：布尔 / `Ref` / `ComputedRef` 均可直接传入，getter 形态仍不在契约内（四包各以 `@ts-expect-error` 锁定）。
  - **文档与注释修正**：四包 `BaseFormItem` 的过滤注释与 `docs/*/components/pro-form` 的字段表此前仍宣称支持 getter 形态，现统一为「支持布尔 / `Ref` / `ComputedRef`，渲染期按 `toValue` 取值」；`SlotComponent` 的 JSDoc 补齐「组件定义对象」这一可渲染形态；`BaseFormItem` 的 `@param {Fields<D>}` 改为 `@param {Fields}`（原写法引用了文件内未声明的泛型）；`fieldKey` 标注非对象项兜底分支的适用边界。
  - **回归**：`antdv-next` 新增 `DOC-03`（四包类型面声明 / `WithRef` 派生 / 注释 / 文档四处同句，任一包回退或重新引入二次包装即红）与 `SX-06`（17 个包根类型导出可解析，字段 / 列 `hidden` 的 `Ref` / `ComputedRef` 形态无需断言）；`antd` 新增 `BI-A24`；`element` 与 `antdv-next` 的跨包用例改为 `Ref` / `ComputedRef` 形态并去掉 `as any`。

  破坏性变更：无（声明与文档口径修正；公开类型面的有效形态不变）。

- dc29ccc: 修复兄弟字段共用同一 `path` 时的渲染 key 冲突（四包同构）：
  - **现象**：字段列表项使用 `:key="item.path || getFieldKey(item.rawField)"`，两个兄弟字段共用同一 `path` 时 key 相同 → Vue 在列表更新时**原地错位复用**节点（节点身份与字段实例错位），并可能出现重复 key 告警与幽灵节点（vant 为此实现了 `activeFieldId` 多实例隔离）。
  - **修复**：渲染 key 一律取**字段对象身份**（`toRaw(field)` 在模块级 WeakMap 中缓存的自增编号），与 `path` 无关 —— 同 `path` 的兄弟字段仍各得其唯一 key。
  - **性能（本次修复的重点约束）**：key 从「模板渲染期计算」改为在既有 `computed`（`useGroupFieldAttrs`）中**预计算**，模板仅读取 `item.renderKey` —— **渲染期函数调用由 O(字段数) 降为 0**，WeakMap 只在字段数组变化时查表；同一份模块级 WeakMap（`utils/fieldKey.ts`），字段对象被回收即释放。
  - **行为变更**：key 不再随 `path` 变化 —— 修改某字段的 `path` 时不再强制重挂载该字段实例，而是复用实例并更新 props（避免不必要的重建；同时该字段控件的内部状态不再被重置）。
  - **回归**：四包新增 `BI-A17` —— 同 `path` 兄弟字段交换后，节点身份随 key 迁移（原 A 节点随 A 移动到新位置），文本与实例保持对应。

  破坏性变更：无（同 `path` 字段此前会 key 冲突导致错位，属缺陷；`path` 变更不再重挂载为行为变更，已在 Changeset 说明）。

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

- c7f85e7: 修复分组列的子列 `hidden` 不生效（三包同构）：
  - **现象**：列过滤只作用于顶层列 —— element `TableColumnRenderer` 的 `renderColumn` 对 `children` 直接 `map` 递归渲染、antd / antdv-next `ProTable` 的可见列过滤只过滤顶层，导致分组内的子列设置 `hidden: true`（含响应式 `ref`）后仍被渲染（表头与表体都出现）。
  - **修复**：
    - `element-plus-pro`：`renderColumn` 渲染子列前按 `isObjectItem(child) && !toValue(child.hidden)` 过滤（与顶层同口径，支持响应式形态）；
    - `antd-vue-pro` / `antdv-next-pro`：新增 `filterVisibleColumns` 递归过滤（含子列），并仅在**确实过滤掉子列**时对该列生成浅拷贝，未发生变动的列保持原对象引用 —— 递归在既有 `computed` 内执行，渲染期无新增开销。
  - **回归**：element `PT-A27`（分组 + 嵌套分组 + 布尔/响应式 `hidden`）、antd / antdv-next `PT-A19`（表头与表体均不含被过滤子列、响应式翻转生效、未变动列保持原引用、下发给宿主表格的列已剔除被过滤子列）。

  破坏性变更：无（此前子列 `hidden` 被忽略属缺陷）。

- a0482f1: 统一 `hidden` 的公开类型面口径为 `MaybeRefOrComputedRef<boolean>`（`MaybeRef<T> | ComputedRef<T>`），并调整导出子路径与样式产物命名：
  - **`hidden` 四包对齐**：
    - `vant-pro` 字段 `hidden` 由 `MaybeRefOrGetter<boolean>` 收窄为 `MaybeRefOrComputedRef<boolean>`（去掉 getter 承诺）；
    - `antdv-next-pro` / `element-plus-pro` 列 `hidden` 由 `boolean` 放宽为 `MaybeRefOrComputedRef<boolean>`；
    - `antd-vue-pro` 列 `hidden` 已为该口径（此前批次完成）。运行期四包本就经 `toValue` 取值，本次仅收敛类型面与 JSDoc；
    - 三个桌面包字段 `hidden` 的 JSDoc 与 `BaseFormItem` 注释中残留的「getter」表述一并收敛为「Ref / ComputedRef」，与类型面一致（四包现已无残留）。
    - **升级影响**：`hidden` 不再接受 `() => boolean` 形态（此前该形态仅在运行期生效、类型面本就拒绝或异常）；如需动态取值请改用 `computed(() => ...)` 或 `ref`。JSDoc 统一为「支持布尔、Ref 与 ComputedRef 形式」。
  - **回归**：`vant-pro` `BI-A18` 改为「Ref 生效 + getter 不入类型面」（`@ts-expect-error` 锁定）；`element-plus-pro` 新增 `PT-A34`（列 `hidden` 传 `Ref` 无需断言、外部 ref 翻转驱动列显隐、分组子列递归过滤）；`antd-vue-pro` `PT-A19` / `PT-A30` 与 `antdv-next-pro` `PT-A19` 已去掉/收敛断言。
  - **`exports` 补 `"./package.json"`**：四个 UI 包新增该子路径，与 `@qin-ui/pro-components-core` 一致 —— 工具链读取包版本/元信息（unplugin 解析器、文档生成、postcss 插件等）时不再报 `ERR_PACKAGE_PATH_NOT_EXPORTED`。实测 `require.resolve('@qin-ui/antd-vue-pro/package.json')` 解析成功。
  - **三个桌面包保留 `./<包名>.css` 兼容子路径**（`antd-vue-pro` / `antdv-next-pro` / `element-plus-pro`）：该子路径指向固定产物名 `es/<包名>.css`，此前按子路径手动引入样式的项目升级后不受影响。推荐从包根导入组件（样式由入口 `es/index.js` 顶部的 `import "./*.css"` 自动引入，`sideEffects` 已保证其不被 tree-shaking 删除）；`vant-pro` 源码无 `<style>` 块、无 CSS 产物，不提供该子路径。
  - **三个桌面包固定样式产物文件名**：各自 `vite.config.ts` 的 `build.lib` 新增 `cssFileName: '<包名>'`。此前文件名由 `package.json` 的 `name` 推导（Vite `resolveLibCssFilename`），而构建注入的 `import "./*.css"` 是硬编码字符串 —— **改包名会让该引入指向不存在的文件且不报错**（rollup 不校验 `intro` 内容），表现为样式静默 404。实测：把包名临时改为 `@qin-ui/renamed-pkg` 后，三个包的产物名与入口引入均保持一致（固定生效）。

  **升级影响（三个桌面包）**：显式 `import '@qin-ui/<包名>/<包名>.css'` 的项目升级后仍可解析；若包名被重命名，固定产物名与子路径保持一致，不会静默 404。常规用法（从包根导入组件）样式照常生效。

  破坏性变更：无。

- bc0dd02: 修复列配置中含 `null` / 原始值项时的渲染期崩溃：
  - **现象**：`columns` 中混入 `null` / 字符串等非对象项时，挂载 `ProTable` 抛 `TypeError` —— antd / antdv-next 在可见列过滤处抛 `Cannot read properties of null (reading 'hidden')`；element 在列渲染器与列控制处抛 `Cannot read properties of null (reading 'key')` / `'hidden'`。
  - **修复**：复用 core 导出的 `isObjectItem`（非 `null` 对象）谓词，在渲染侧统一过滤非对象列：
    - `antd-vue-pro` / `antdv-next-pro`：`ProTable` 的可见列过滤、`ColumnControl` 的列清单入口；
    - `element-plus-pro`：`ProTable` 的 `normalizedRawColumns` 源头过滤（单点覆盖列渲染器、索引列拼接与 `ColumnControl` 入参）、`TableColumnRenderer` 的列过滤、`ColumnControl` 的列清单入口。
  - **保持不变的契约**：不改 `normalizeColumn` 与 `columns` 数组本体 —— 原引用透传、`toRaw(table.columns.value) === 原数组`、`@resizeColumn` 式就地变异均不受影响；`hidden` 的 `Ref` / getter 响应式语义不变。
  - **行为边界**：`columns` 中的非对象项被静默忽略（与字段侧 `fields` 的处理口径一致）。
  - **回归**：`PT-A17`（antd / antdv-next）、`PT-A19`（element）：`columns: [null, 'not-a-column', { 合法列 }]` 时挂载不抛错、表头仅渲染合法列、表体数据正常。

  破坏性变更：无（合法列配置行为不变；非法项此前会导致崩溃，现被忽略）。

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

- 修复 ProForm 未传 `grid` 且 Provider 未显式配置 `pro-form.grid` 时默认启用网格布局的回归：`grid` 恢复默认关闭，显式 `grid` 与 Provider 注入的 `grid` 仍生效。
- d20727b: ProComponentProvider 注入面收敛：不可注入键在注入层静默剔除。
  - **注入面边界由两处声明**：类型面在 `RequiredComponentVars` 内直接剔除（`Omit<TableProps, 'loading' | 'columns' | 'dataSource'>`、`Omit<ProFormProps, 'form' | 'grid'>` 等），`ComponentVars` 仍为 `Partial<RequiredComponentVars>`；运行期清单直接声明在 `INJECT_CONFIG` 各项的 `ignoreProps`（普通数组），驱动注入层剔除（剔除经 core 的 `omit` 执行，原适配层局部实现 `omitIgnoredProps` 移除）。两处由契约用例分别锁定（类型面文本 + 项内清单文本），行为用例覆盖剔除与静默。
    不可注入键：`antd-vue-pro` / `antdv-next-pro` 的 `pro-table` → `loading` / `columns` / `dataSource`；`element-plus-pro` 的 `pro-table` → `data`（类型面），运行期清单另含 `loading` / `columns`（二者非其类型面成员，此前被静默忽略，现同样剔除）；四包 `pro-form` → `form`。
  - **消费侧防御代码删除**：`antd-vue-pro` / `antdv-next-pro` 的 `ProTable` 不再自建 `TABLE_LEVEL_PROP_KEYS` 做过滤（注入层已保证不出现这些键）；`element-plus-pro` / `vant-pro` 的既有取值路径不变。
  - **静默剔除（新增行为）**：Provider 收到不可注入键时在注入层直接剔除，不输出告警——类型面已将这些键排除在 `componentVars` 之外，仅 JS / `as any` 传参可能触达，宁缺勿扰。
  - **回归**：`antdv-next` `PT-A39`、`antd` `PT-A38`、`element` `PT-A35`、`vant` `VP-PC4` 分别以注入面探针（直接 `inject` 注入配置）锁定「键已静默剔除 + 其余键照常下发 + 不产生告警」，并锁定运行期变更路径；四包 `comment-conventions` 的 Provider 边界用例改为分别锁定类型面剔除文本与项内清单文本（`DOC-04` / `DOC-05`）。

  **注意（契约收紧，element / vant）**：`componentVars['pro-table'].data`（element）与 `componentVars['pro-form'].form`（vant）由「可配置但被运行时静默忽略」改为「编译期不可配置 + 传入即静默剔除」；element 的 `columns` / `loading` 不在其类型面内，改为「传入即在注入层静默剔除」。如项目配置中存在这两项，请删除：数据源请改传 `:table` 实例（`useTable`）或显式 `:data`，表单实例请显式传 `:form`。`antd-vue-pro` / `antdv-next-pro` 的三键在上一个 changeset 中已收紧，本次仅补齐注入层剔除。

  破坏性变更：无（类型面为收紧误导性配置面；注入层剔除为静默行为，不影响运行时结果）。

- aed8ae6: 修复自定义查询按钮导致查询双发的问题：当 `searchButton` 或搜索区默认插槽渲染为「原生 `<button>` 且未声明 `type`」时，点击会同时触发绑定的 `@click` 与浏览器对 `form` 的隐式提交，`search` 事件被触发两次（默认查询按钮不受影响，其只走 submit）。

  现对自定义按钮与默认按钮做**同 tick 去重**（一次用户操作只查询一次；连续两次点击仍为两次），并新增判别用例 `SF-A19`、修正 `SF-A10`（改为挂载到 `document` 后断言 `search === 1` 且隐式提交确实发生），此前该用例因 Vue Test Utils 默认脱离 document 挂载而无法捕获双发。

- cc83f0b: 修复代码评审 §2.3 Top-10 优先修复项（其余 P1 项按决策暂不纳入本轮）：
  - **表格**：列 `hidden` 统一按响应式解包（`Ref` / getter 形态不再被永久隐藏），覆盖三包 `ProTable`、`ColumnControl` 与 core 的搜索字段可见性判定；`addIndexColumn` 默认值口径统一为 `true`——README props 表原写 `false`，与 Provider 默认表、运行时实现矛盾，本次以运行时行为为准修正文档。
  - **表单**：未传 `:form` 的 `ProForm` 兜底表单实例改为 `setup` 同步期创建，消除 `provide() can only be used inside setup()` 告警，兜底实例的数据 store 注入恢复生效；element-plus / vant 的分组字段 `disabled` 向子字段传播（element 的禁用上下文 provider 改为「继承 + 未声明不改写」，vant 以 prop 显式透传）。
  - **core**：批量 `setFormData` 过滤 `__proto__` / `constructor` / `prototype` 危险键（复用包内工具 `isDangerousKey`，未纳入包根导出面），服务端下发的初始数据不再可替换表单对象原型；嵌套字段路径 JSDoc 示例更正为完整点分路径（`address.city`）。
  - **测试基建**：`core` 表格用例去掉对被 gitignore 的 `es/index.js` 产物的子进程依赖，改为进程内断言；三包 UI 测试中「`if (el.exists())` 守卫导致的零断言通过」全部改为硬断言并补齐 `searchFields` 前置（含 antd / antdv-next 的 `SizeControl` 用例改为真实交互）；「手动展开不被自动测量覆盖」判别用例改为二次测量越过死区，经突变验证可失败；element「点击查询」改为只点击 + `attachTo: document.body` 验证原生隐式提交路径；补齐 `addIndexColumn` 默认与反向用例。

  破坏性变更：无（`addIndexColumn` 仅修正文档默认值，运行时行为未变）。

- Updated dependencies [cd82522]
- Updated dependencies [1f4620e]
- Updated dependencies [bdbd58d]
- Updated dependencies [029d10b]
- Updated dependencies [c20e669]
- Updated dependencies [8f55302]
- Updated dependencies [9d2fa7b]
- Updated dependencies [9d2fa7b]
- Updated dependencies [cd0690c]
- Updated dependencies [cd0690c]
- Updated dependencies [84e2eaf]
- Updated dependencies [9cb6cdd]
- Updated dependencies [9d2fa7b]
- Updated dependencies [9d2fa7b]
- Updated dependencies [bd888e9]
- Updated dependencies
- Updated dependencies [5a8a20d]
- Updated dependencies [a113993]
- Updated dependencies [300f80b]
- Updated dependencies [cc83f0b]
  - @qin-ui/pro-components-core@2.1.0

## 1.3.5

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

- Updated dependencies []:
  - @qin-ui/pro-components-core@2.0.4

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
