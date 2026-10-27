# @qin-ui/antdv-next-pro

## 1.5.1

### Patch Changes

- 修复 1.5.0 中 ProForm 网格默认值与 Provider grid 语义回归：`grid` 默认关闭；Provider 的 `pro-form.grid` 仅作为启用网格时的参数配置，不再单独开启网格；显式 `grid: true` 时使用内置默认 gutter。

## 1.5.0

### Minor Changes

- 088cb2c: 修复 antdv-next 适配层的表格序号偏移、emit 型 attrs 入口、告警去重与若干类型/文档问题（CR-074～CR-081）：
  - **`ProTable` 序号列偏移错误（CR-077①）**：`getIndex` 原先读取 `table.pageParam` 的 `pageSize`，而 `computedPagination` 允许 `attrs` / Provider 的 `pageSize` 优先 —— 当分页配置来自 attrs/Provider 时序号偏移错误。现统一取**有效分页**（`computedPagination`），分页关闭时退化为 `index + 1`。
  - **支持宿主表格的 emit 型 attrs（CR-077④）**：宿主 `_TableProps` 不含 `onChange` / `onScroll` / `onUpdate:expandedRowKeys`（属 emits 面），导致 `@scroll`、`v-model:expanded-row-keys` 无入口。现本包 `TableProps`（= 宿主 `_TableProps` 与由宿主根导出 `TableEmits` 推导的同族 `on*` 键，与宿主的 `TableEmitsProps` 同式，不手写签名）同时用于 `ProTable` 的 Props 与 `component-provider/types`，并显式转发。
  - **`onTableChange` 类型退化修复（CR-077②）**：`any` → `TableProps['onChange']`。
  - **搜索配置告警按原因分键（CR-077③）**：原先共用单个去重标志，两类语义不同的告警互相静音；且未配置 `search` 时也会误报「未返回 Promise」。现按原因分别去重，且仅在确实配置了 `search` 时校验。
  - **静态 `props` 快照兜底（CR-080）**：`tableProperties` 依赖宿主 `Table` 的静态 `props` 快照，若快照为空会导致表格 attrs 静默全丢。现快照为空时输出一次开发期告警，并改为不做键名限定的全量透传（由宿主的 props 校验兜底）。
  - **`table/useTable.ts` 路径对齐 `table/hooks/useTable.ts`（CR-076）**：与 `antd-vue-pro` 保持一致并新增 `hooks` 桶；`PageParam` 由 table 模块作为类型导出，hook 模块不重复导出，与包根文档口径一致。
  - **`shared/ui` 的 `useConfig` 更名为 `useHostConfig`（CR-075）**：该导出读取宿主组件上下文（`componentDisabled` / `componentSize`），与本包 locale 深层导入的 `useConfig`（宿主配置读取）语义不同，同名易被误「统一」后静默退化。`shared/ui` 非公开入口，对使用方无影响。
  - **删除两处死通道（CR-079）**：`formItemProps[k] = slots[k]`（`getSlotPropFn` 中 slot 恒胜）与 `component === 'date-picker' ? '' : picker` 三元（`PLACEHOLDER_KEYS` 无点分键）；两处均以用例证明行为不变。
  - **文档与注释（CR-074 / CR-078）**：`ComponentVars` 补 `@public` 与 JSDoc（API 文档此前缺该条目）；`ProForm` 补齐 `@param {...FormProps} ...attrs` 与 `@example`；`BaseFormItem` 的 `@param {Fields<D>}` 修正；`useGroupFieldAttrs` 注释改为行为陈述。
  - **测试补齐（CR-081）**：新增 `PT-A23`～`PT-A29`、`BI-A18`、`BI-A19`、`BF-A15`、`HK-04`、`SX-02` 等 12 条（序号偏移、`v-model:size`、筛选插槽守卫、falsy 字段项、静态 props 兜底、导出面与宿主上下文等）。

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

- e140615: 修复 `ProForm` 遮蔽宿主禁用状态的问题：
  - **现象**：`ProForm` 未显式指定 `disabled` 时，会向下发恒为 `false` 的禁用上下文，导致宿主 `<ConfigProvider :component-disabled="true">` 以及外层 `<a-form :disabled>` 的禁用状态被静默解除（表单可编辑）。
  - **原因**：`useDisabledContextProvider` 收到的是归一化后的显式 boolean（未指定时为 `false`），而 antdv-next 的 `DisabledContext` 采用「最近 Provider 全量覆盖」语义，恒下发的 `false` 覆盖了上层上下文。
  - **修复**：移除 `ProForm` 这一层的禁用上下文 Provider，禁用上下文交由宿主 `AForm` 自身承载 —— 显式 `disabled` 经 `v-bind` 到 `AForm` 后由其自身 prop 优先消费（裸 `disabled`、`:disabled="true"` 保持禁用；`:disabled="false"` 显式解除，包括覆盖宿主的 `true`），未显式指定时 `AForm` 回退到上层上下文（宿主 `ConfigProvider` / 外层 `Form`），与移除前该层转发的来源同源。
  - **回归**：`PF-D2` —— 宿主 `componentDisabled: true` + 未指定 → 输入框禁用；`:disabled="false"` → 覆盖宿主；裸 `disabled` → 仍禁用（重新加回恒发 `false` 的 Provider 时该用例转红）。

  破坏性变更：无（此前未指定 `disabled` 时无法继承宿主禁用属于缺陷；显式指定的语义完全不变）。

- 88cc87a: 表格来源单一性、注入面收紧与尺寸控件高亮修复（CR-094 / CR-098 跨包对齐）：
  - **`searchFormConfig` 不再整体下发 `SearchForm`**：`container` / `hidden` 由 `ProTable` 自身消费（容器用于包裹、显隐由 `searchFormVisible` 承担）。此前 `container` 沿 `SearchForm` → `ProForm` → 宿主 `Form` 的 attrs 落到原生 `<form>`，DOM 出现非法属性 `container="[object Object]"`（实测修复前命中）；`hidden` 亦不再进入 DOM 属性通路（`PT-A36` 锁定两键不落 DOM，`hidden: true` 仍隐藏搜索区；与 `antd-vue-pro` / `element-plus-pro` 同构）。
  - **Provider 注入面收紧**：`componentVars['pro-table']` 类型面排除 `columns` / `dataSource` / `loading`（此前为「可配但不生效」的误导性配置面），三键由注入层统一静默剔除（见 `@qin-ui/antd-vue-pro` / `antdv-next-pro` / `element-plus-pro` / `vant-pro` 共同的注入面说明）。表格列与数据源来源收敛为 **显式绑定 > `:table` 实例**（`PT-A37` 锁定注入值既不渲染、也不落为宿主表格元素属性）。
  - **表格尺寸单一来源与控件高亮**：`size` 取值收敛为 `effectiveSize`（显式绑定 > 尺寸控件回写 > Provider 注入），`SizeControl` 新增 `effectiveSize` 并以它高亮。此前 Provider 注入 `size: 'small'` 时表格实际为紧凑尺寸、尺寸菜单却高亮「默认」（实测修复前 `ATable.size = 'small'` 而 `currentSize = 'large'`）；`table` 插槽作用域的 `size` 此前下发本地 model（未绑定时为 `undefined`），现下发表格有效尺寸（`PT-A38` / `SC-A15` 锁定高亮项、回写优先级与插槽取值）。
  - **文档同步**：`README` / `AI-CONTEXT.md` / `docs/antdv-next-pro` 补记 Provider 注入面边界与 `searchFormConfig` 的下发边界；新增 `DOC-04` 契约用例锁定文案不回流。

  **注意（契约收紧）**：`componentVars['pro-table'].columns` / `.dataSource` 由「可配置但被运行时忽略」改为「编译期不可配置」；如项目配置中存在这两项，请删除。若确需覆盖列/数据，请改传 `:table` 实例（`useTable`）或对 `ProTable` 显式绑定 `:columns` / `:data-source`。

  破坏性变更：无（均为缺陷修复与类型面收紧）。

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

- a0482f1: 分组列 `children` 纳入公开列类型面（`Column` / `Columns`）：
  - **缺陷**：宿主的 `ColumnType` 不含 `children`（分组列由宿主的 `ColumnGroupType` / `ColumnGroupProps` 承载，`children` 未落在 `ColumnType` 上），而本包 `Column` 仅在 `ColumnType` 上做 `Omit` 扩展 —— 导致 `const columns: Column[] = [{ title: '分组', children: [...] }]` **编译不通过**，必须 `as any`；而运行期分组渲染、递归 `hidden` 过滤与列控制均已支持。
  - **修复**：
    - `antd-vue-pro` / `antdv-next-pro`：`Column` 新增 `children?: Column<D>[]`（自引用，嵌套分组同样可用）；
    - `antdv-next-pro`：`Omit` 列表补 `'hidden'` —— 其宿主 `ColumnType` 继承自 `@v-c/table` 的 `ColumnSharedType`，**自带 `hidden?: boolean`**；直接交叉会与包内声明形成**交集**（`boolean & MaybeRefOrComputedRef<boolean>`），使 `hidden` 传 `Ref` 报 TS2322。宿主键须先剔除再重声明。
    - `antd-vue-pro` 的 `Omit` 维持 `'dataIndex' | 'key'` 不变：其宿主 `vc-table` 的 `ColumnSharedType` **没有** `hidden`（实测 `'hidden' extends keyof ColumnType` 为 `no`），无从剔除、也无需剔除。`'children'` 也不在其宿主的 `ColumnType` 上（antd 的 `children` 只落在 `ColumnGroupType`），故无需剔除。
    - `element-plus-pro` 无需改动：其 `Column` 早已自带 `children?: Column<D>[]`，且 `Omit` 列表中的 `'children'` 是**必需**的 —— 宿主 `TableColumnCtx` 的 `children` 为 `TableColumnCtx<T>[]`（元素含 `property` 等必填字段），与本包声明的 `Column<D>[]` 形状不兼容，不剔除会形成不可满足的交集（实测去掉即报 `Property 'hidden' does not exist on type 'TableColumnCtx<any>'`）。
  - **回归**：新增 `PT-A35`（两包同构）—— 分组列与**嵌套分组**均以 `Column[]` 字面量直接构造（无断言），并锁定嵌套子列 `hidden` 的递归过滤随外部 `ref` 翻转生效；`antd-vue-pro` / `antdv-next-pro` 的 `PT-A19` 同步去掉 `as any`。
  - **验证（突变 + 对照实验）**：
    - 移除 `Column` 的 `children` 声明 → TS2353（`'children' does not exist in type 'Column'`）；
    - `antdv-next` 的 `Omit` 去掉 `'hidden'` → TS2322（`boolean & MaybeRefOrComputedRef<boolean>` 交集拒绝 `Ref`）；
    - `element` 的 `Omit` 去掉 `'children'` → TS2339（`Property 'hidden' does not exist on type 'TableColumnCtx<any>'`），证明该键在 element 侧是**必需**的；
    - 对照实验：把 `'children'` 加进 `antd` / `antdv-next` 的 `Omit` → 编译仍通过，证明这两个包的宿主无该键、写进去是空转，故不写入。
  - **文档**：两包 `docs/.../pro-table` 的列配置表补 `children` 行。

  破坏性变更：无（纯类型面放宽；`children` 此前不可写，新增为可选键）。

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

- 5e02ba7: 修复表格尺寸无法经 `ProComponentProvider` 配置的问题，并收紧 `loading` 的配置面：
  - **缺陷**：`ProTable` 模板中 `:size` / `:loading` 绑定位于 `v-bind="computedTableProps"` 之后，props 合并时后写覆盖 —— 未显式绑定时 `size` 为 `undefined`、`loading` 为默认 `false`，导致 `<ProComponentProvider :componentVars="{ 'pro-table': { size: 'small' } }">` 注入的表格尺寸被静默清空。
  - **修复**：
    - `size` 改为在 `computedTableProps` 内求解优先级：本地显式绑定（`:size` / `v-model:size`）或已由 `SizeControl` 写入时使用本地值，否则保留 Provider 注入值；模板移除多余的 `:size` 显式绑定。
    - `loading` 从 `componentVars['pro-table']` 契约中移除（类型层 `Omit<TableProps, 'loading'>`，运行时 `computedTableProps` 写死 `undefined`）——表格 loading 仅由组件自身状态（含搜索竞态守卫）驱动，不再接受全局默认值注入。
    - 新增 `PT-A14 [判别]` 用例：Provider `size` 未绑定时生效、显式绑定优先、Provider `loading` 不生效，并以 `@ts-expect-error` 锁定「`loading` 不可配置」的编译期契约。
  - **注意（契约收紧）**：`componentVars['pro-table'].loading` 由「可配置但被运行时覆盖」改为「编译期不可配置」；运行时行为与原先一致（原本就不会生效），如项目配置中存在该项，请删除该键。`element-plus-pro` / `vant-pro` 不受影响（前者 `resolvedSize` 已按 本地 → attrs → Provider 取值，且其 `ElTable` 无 `loading` prop）。

  破坏性变更：无（仅类型面收紧 `loading`，`size` 为缺陷修复）。

- 修复 ProForm 未传 `grid` 且 Provider 未显式配置 `pro-form.grid` 时默认启用网格布局的回归：`grid` 恢复默认关闭，显式 `grid` 与 Provider 注入的 `grid` 仍生效。
- d20727b: ProComponentProvider 注入面收敛：不可注入键在注入层静默剔除。
  - **注入面边界由两处声明**：类型面在 `RequiredComponentVars` 内直接剔除（`Omit<TableProps, 'loading' | 'columns' | 'dataSource'>`、`Omit<ProFormProps, 'form' | 'grid'>` 等），`ComponentVars` 仍为 `Partial<RequiredComponentVars>`；运行期清单直接声明在 `INJECT_CONFIG` 各项的 `ignoreProps`（普通数组），驱动注入层剔除（剔除经 core 的 `omit` 执行，原适配层局部实现 `omitIgnoredProps` 移除）。两处由契约用例分别锁定（类型面文本 + 项内清单文本），行为用例覆盖剔除与静默。
    不可注入键：`antd-vue-pro` / `antdv-next-pro` 的 `pro-table` → `loading` / `columns` / `dataSource`；`element-plus-pro` 的 `pro-table` → `data`（类型面），运行期清单另含 `loading` / `columns`（二者非其类型面成员，此前被静默忽略，现同样剔除）；四包 `pro-form` → `form`。
  - **消费侧防御代码删除**：`antd-vue-pro` / `antdv-next-pro` 的 `ProTable` 不再自建 `TABLE_LEVEL_PROP_KEYS` 做过滤（注入层已保证不出现这些键）；`element-plus-pro` / `vant-pro` 的既有取值路径不变。
  - **静默剔除（新增行为）**：Provider 收到不可注入键时在注入层直接剔除，不输出告警——类型面已将这些键排除在 `componentVars` 之外，仅 JS / `as any` 传参可能触达，宁缺勿扰。
  - **回归**：`antdv-next` `PT-A39`、`antd` `PT-A38`、`element` `PT-A35`、`vant` `VP-PC4` 分别以注入面探针（直接 `inject` 注入配置）锁定「键已静默剔除 + 其余键照常下发 + 不产生告警」，并锁定运行期变更路径；四包 `comment-conventions` 的 Provider 边界用例改为分别锁定类型面剔除文本与项内清单文本（`DOC-04` / `DOC-05`）。

  **注意（契约收紧，element / vant）**：`componentVars['pro-table'].data`（element）与 `componentVars['pro-form'].form`（vant）由「可配置但被运行时静默忽略」改为「编译期不可配置 + 传入即静默剔除」；element 的 `columns` / `loading` 不在其类型面内，改为「传入即在注入层静默剔除」。如项目配置中存在这两项，请删除：数据源请改传 `:table` 实例（`useTable`）或显式 `:data`，表单实例请显式传 `:form`。`antd-vue-pro` / `antdv-next-pro` 的三键在上一个 changeset 中已收紧，本次仅补齐注入层剔除。

  破坏性变更：无（类型面为收紧误导性配置面；注入层剔除为静默行为，不影响运行时结果）。

- 2429b61: 复用宿主组件库导出、四包能力对齐与插槽作用域（含「复用优先」原则落地）：
  - **表格属性推导不再使用手写回退清单（复用优先）**：`antdv-next-pro` 的 `shared/ui` 原先内置 52 个手写属性键作为回退（`FALLBACK_TABLE_PROP_KEYS`）并以 3 键门槛判断快照可用性。现改为**全部由宿主导出推导**（`Table.props` 取属性键、宿主 emits 推导事件键）：推导可用时按推导键过滤透传；推导不可用时**不再替换为手写清单**，而是在开发期告警一次后**全量透传 attrs**（仅排除组件自身消费的键），由宿主表格自行忽略未知属性。
  - **`antd-vue-pro` 表格 emit 入口以宿主导出推导（CR-077④ 对齐）**：本包 `TableProps` 由宿主 `_TableProps` 扩展而来，唯一缺口 `onUpdate:expandedRowKeys` 的签名经 `ComponentProps<typeof Table>[...]` 索引取得（不手写签名、不新增键清单），`v-model:expanded-row-keys` 恢复入口。**实测 ant-design-vue 的 Table 不提供 `onScroll`**（`Table.props` 46 键不含、类型面不存在、`Table.emits` 为 `undefined`），故**不伪造 `@scroll` 入口**，该能力边界已写入类型 JSDoc 与文档事件入口注记。
  - **`antd-vue-pro` 序号列偏移修复（CR-077① 对齐）**：`getIndex` 改取 `computedPagination` 的**有效分页**（attrs / Provider 的 `pageSize` 优先），分页关闭时退化为 `index + 1`。
  - **`antd-vue-pro` 搜索配置告警按原因分键（CR-077③ 对齐）**：两类语义不同的告警不再互相静音，未配置 `search` 时也不再误报「未返回 Promise」。
  - **`ProTable` 插槽作用域对齐（CR-078④）**：`search-form` 插槽现提供 `{ form, search, reset }`、`table` 插槽提供 `{ columns, dataSource, pagination, loading, size, onChange }`（此前 `antd-vue-pro` 的这两个插槽无作用域，属纯增量能力对齐）；三包文档的 Slots 表新增「作用域参数」列。
  - **插槽渲染组件对象（CR-086，`vant-pro`）**：`SlotComponent` 的分支判定改为「非原始值即交给 `<component :is>`」，与其余三包逐字一致；此前传组件对象会落入文本插值，DOM 中出现组件对象的 JSON 文本。
  - **注释/JSDoc 四包收敛（CR-090 余项）**：`useGroupFieldAttrs` 的栅格边界注释、`不可枚举…` / `WeakMap 不参与响应式追踪` / `shallowRef 形态…` 等表述统一改为「职责与行为边界」；`ProTable` / `SearchForm` 公开 JSDoc 对齐并补齐 `@template` / `@param` / `@slot`。
  - **内部结构调整（`element-plus-pro`）**：`table/useTable.ts` 移至 `table/hooks/useTable.ts` 并新增 `hooks` 桶，与其余两包结构一致；`TableEmits` 经核实为 element-plus 自身导出的宿主类型，按复用原则保留。**无公开 API 变化。**

- aed8ae6: 修复自定义查询按钮导致查询双发的问题：当 `searchButton` 或搜索区默认插槽渲染为「原生 `<button>` 且未声明 `type`」时，点击会同时触发绑定的 `@click` 与浏览器对 `form` 的隐式提交，`search` 事件被触发两次（默认查询按钮不受影响，其只走 submit）。

  现对自定义按钮与默认按钮做**同 tick 去重**（一次用户操作只查询一次；连续两次点击仍为两次），并新增判别用例 `SF-A19`、修正 `SF-A10`（改为挂载到 `document` 后断言 `search === 1` 且隐式提交确实发生），此前该用例因 Vue Test Utils 默认脱离 document 挂载而无法捕获双发。

- e689378: 修复搜索框回车不触发查询，并对齐 README 的公开契约描述：
  - **搜索框内回车现在会触发查询（CR-050）**：`antd-vue-pro` 与 `antdv-next-pro` 的查询按钮此前是 `html-type="submit"` + `@click="onSearch"`，表单上**没有** `@submit` 监听 —— 宿主 Form 会对 submit 做 `preventDefault` 并 `emit('submit')`，但无人接听，导致**在搜索框内按回车不会查询**（`element-plus-pro` 已是「统一经表单 submit 触发」的语义，四包行为此前不一致）。现改为 `<ProForm @submit.prevent="onSearch">` 单一路径，并移除按钮的 `@click`（`type=submit` 的按钮在真实浏览器中会同时触发 click 与 submit，两者并存会造成**双触发**）。点击与回车现在都只触发一次查询。
  - **README 公开契约描述修正（CR-038）**：`search` 的类型由宽松写法对齐为真实公开契约 `() => Promise<unknown>`（实现无入参）；`antd-vue-pro` 的 `tableContainer` 说明由「默认为 false」更正为「默认包裹内容，传 `false` 关闭包裹」（`DefaultTableContainer`）。

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

## 1.4.5

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

## 1.4.4

### Patch Changes

- 206e205: BaseField 补充注入配置 key 的行为边界 JSDoc 声明：组件名与 `picker`（element-plus 为 `type`）仅取 setup 期初始值，运行期变更不会切换 Provider 的默认值预设（`date-picker.month` 等子类型预设需在初始渲染前确定）。纯文档说明，无行为变化。
- 206e205: docs(source-comments): 全包源码注释完善——面向 sourceMap 进源码阅读场景

  面向「使用方经 declarationMap / sourceMap 进入包源码阅读」的场景补齐与修正注释，运行时行为零变化：
  - **core**：补齐关键逻辑段注释——`useForm` 的入参分派 / root 注入回退链 / `createFormProxy` 各 trap（实时取实例 + methodCache 引用记忆化）、`useFormData` 的注入复用与批量覆盖「先删后合」语义、`useFields` 的路径缓存回验自愈 / BFS 建索引 / 两段式降序 splice、`useTable` 的分页白名单 / 快照恢复 / DFS 匹配 key→dataIndex 顺序 / 列 key 兜底链、`path.ts` 的断裂语义与中间层建层规则、`useSearchFormExpand` 的测量驱动源与 RO 生命周期、locale 繁体判定顺序；
  - **UI 四包**：补齐 `ProForm` 的 `:key="formKey"` 子树重挂载契约注释（三包同构）、antdv-next 的 attrs.disabled 归一下发、element-plus 的 `@submit.prevent` 与 `onSizeChange` 重置回第 1 页、vant 的共享弹层容器 / popup 提交语义 / formPopup 附加策略；
  - **JSDoc 偏差修正**：三桌面包 `useTable` 的 `resetQueryParams` 由「重置分页到第一页」更正为「恢复到初始化快照」；三包 `SearchForm` 文档的 IntersectionObserver 职责描述与实现对齐；
  - **注释规范落地**：超过 1 行的注释统一为 `/* */` 块注释（AGENTS.md §2.2 新规），`// prettier-ignore` / `// eslint-disable-next-line` 工具指令对保留。

  纯注释变更，公开 API 与运行时行为零变化（五包 build / 454 测试 / vue-tsc / prettier 全绿）。

- 206e205: fix(pro-table): `search` prop 类型签名与运行时调用对齐 (R-20)

  `ProTable` 的 `_search` 始终以无参形式调用 `search`，但类型签名声明为 `(params?: any) => Promise<any> | any`，承诺了永远收不到的 `params`。现收紧为 `() => Promise<unknown>`，与 antd-vue-pro / element-plus-pro 三包统一：
  - 若业务此前按旧签名声明了 `params` 形参，需删除该形参——它此前恒为 `undefined`，不影响任何实际逻辑；
  - 运行时行为不变（本就以无参调用）；
  - 测试挂载辅助 `mountProTable` 的 `search` 选项签名同步对齐，并新增判别测试 PT-A13 锁定「无参调用」契约。

- 206e205: fix(base-field): 字段级 `onUpdate:*` 监听器不再被静默丢弃 (R-04)
  - 此前字段配置或 attrs 上传入的 `onUpdate:value`（element-plus/vant 为 `onUpdate:modelValue`）会在 BaseField 属性解构时被剥离丢弃，监听器永不触发；
  - 现改为与内部写值组合：先写入 formData（含 valueFormatter 转换），随后以组件**原始 emit 值**回放该监听器；`mergeProps` 合并为数组的多个监听器按序全部回放；
  - vant-pro 的 popup 型字段同样生效：监听器在 confirm 提交时触发，滚动选择过程的中间值不会误触；
  - 四包同构同步修复，新增判别测试 BF-B5 / VP-B5。

- 206e205: fix(pro-table): 修复 ProTable 丢弃 Provider 级 onChange 配置的问题 (R-02)
  - `onTableChange` 现按「模板监听器优先，未绑定时回退 Provider 全局配置」回放 onChange（与其余属性覆盖语义一致），修复 `componentVars['pro-table'].onChange` 因 `computedTableProps` 显式置空 onChange 而永不被调用的问题；
  - `@qin-ui/antd-vue-pro` 与 `@qin-ui/antdv-next-pro` 同构同步修复；
  - `@qin-ui/antdv-next-pro` 补齐 Provider 配置类型的事件成员：新增 `TableComponentProps` 类型（基于组件 SetupFn props 提取，含 `onChange`/`onExpand` 等强类型处理器；此前导出的 `TableProps` 类型不含事件成员），`componentVars['pro-table']` 现支持 `onChange` 等事件的类型提示；
  - 新增判别测试 PT-A11（仅 Provider 配置时回放生效）/ PT-A12（与模板 @change 并存时模板优先）。

- 206e205: refactor(use-group-field-attrs): `FORM_ITEM_SLOT_KEYS` 判定改为模块级 Set（SIMP-07）

  字段循环内的 FormItem 插槽名判定由数组 `includes`（O(n) 线性扫描 + `as any` 断言）改为模块级 `Set.has`（O(1)），与同文件 `gridItemPropKeySet` / `formItemPropKeySet` 的既有优化对齐；导出的 `FORM_ITEM_SLOT_KEYS` 常量数组及其元组类型（`GroupedField.formItemSlots` 的键类型来源）保持不变，公开 API 无影响。纯内部实现优化，行为零变化（slots 分组行为由既有 hooks-locale / BaseFormItem 测试覆盖）。

- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
  - @qin-ui/pro-components-core@2.0.3

## 1.4.3

### Patch Changes

- - **core**:
    - 修复 `setFormData` 类型定义，补齐顶级已知字段泛型重载与 `ExtendWithAny` 批量覆盖兼容性；
    - 恢复 `getFormData` 2 层与 3 层嵌套路径的强类型推导重载；
    - 优化 `setFormData`、`getFormData` 与 `getField` 的 JSDoc 结构，消除 TypeScript 方法重载在 IDE Hover 时产生的首行文字无格式拼接问题。
  - **UI 适配层 (antd-vue-pro / antdv-next-pro / element-plus-pro / vant-pro)**:
    - 完善 `useForm` JSDoc 中 `setFormData` 四种调用形态说明并对齐最新 core 类型定义。
- Updated dependencies []:
  - @qin-ui/pro-components-core@2.0.2

## 1.4.2

### Patch Changes

- - fix(table): 统一内部序号列标识为 `__INDEX__` 并在 `ColumnControl` 中默认排除，避免无效果操作
  - fix(table): 增加 `isSlotRenderable` 守卫 `bodyCell`、`headerCell` 等列依赖插槽，防御列隐藏/空列状态下访问 `column` 属性触发 `TypeError`

## 1.4.1

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

## 1.4.0

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

  ### 🐞 缺陷修复 (Bug Fixes)
  - **BaseFormItem (A3)**：重构实例 ref 收集机制为 `WeakMap` 按字段对象引用绑定，彻底杜绝字段被 `splice`、动态增删、重排等直接变异场景下的实例错位；
  - **ProComponentProvider (A1)**：`componentVars` 改为 `computed` 响应式提供，子组件及 hooks（`ProForm`、`useGroupFieldAttrs`、`ProTable`）全面响应式对齐；
  - **ProForm (A2, B1)**：
    - 未传 `form` 时自动调用 `useForm()` 自建实例并 provide，避免向下游注入空对象；
    - 注入层采用 `Proxy` 动态代理（包含 `set` trap 转发），支持父组件运行期动态替换 `:form` 实例；
  - **ProTable (A6, A7)**：
    - 采用响应式派生直读 `table` 属性并对 `columns` 与 `dataSource` 做安全解包，支持动态替换表格实例；
    - 规范分页配置合并优先级，修复全局 `pagination: false` 被忽略的缺陷；
  - **SearchForm (A4, A5, A11)**：
    - 增加手动折叠保护机制，避免窗口缩放或重绘时无条件收起用户手动展开的状态；
    - 修复布尔值形态下隐藏字段检测的一致性；
    - 修复 `proFormHeight` 初始渲染时产生 `unsetpx` 脏样式的问题；
  - **BaseField (A12, A14, 2.2)**：
    - `inject` 提升至 setup 同步期，消除 `getInitProps` 在 computed 内部调用的时序隐患；
    - 未匹配到组件类型时输出明确警告；
    - `valueFormatter` 优化为按需提取旧值，单参转换场景 0 开销；
  - **SizeControl (A13)**：避免 setup 挂载期向 `defineModel` 强制回写默认值造成的父级状态污染；
  - **getPopupContainer (A16)**：在表单外使用时增加 `document.body` 兜底。

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

## 1.3.3

### Patch Changes

- perf: 表单渲染链路深度扁平化重构与性能优化
  - **链路扁平化（8 层 -> 6 层）**：彻底移除 `PathProvider` 组件实例，精简组件树层级
  - **Hook 纯函数化**：将 `GroupedFieldAttrs` 改造为 `useGroupFieldAttrs` 纯计算 Hook，100% 消除作用域插槽闭包转发开销
  - **实例开销降低**：单字段 Vue 内部组件实例减少 2 个（Antd 系 8->6，Vant 4->2），内存与首次挂载速度显著优化

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.1.3

## 1.3.2

### Patch Changes

- fix: 修复 ProTable 列配置响应式引用断开、多级表头递归与表单插槽注入时序等问题

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.1.1

## 1.3.1

### Patch Changes

- fix(form): 修复 slots 类型合并逻辑，避免 FormItem 插槽与底层组件插槽产生交集类型

## 1.3.0

### Minor Changes

- 新增多语言国际化（i18n）机制及 ProTable 列控制增强配置：
  - 支持内置语言包（zh-CN / zh-TW / en-US），能够跟随宿主 UI 库全局语言自动切换。
  - ProComponentProvider 新增 `locale` 属性，支持覆盖任意内置文案。
  - ProTable 列控制 `control.columnControl` 支持传入配置对象（支持自定义 `labels` 别名映射、`excludedKeys` 排除列、`disabledKeys` 锁定展示列、`disableCheckAll` 禁用全选）。

### Patch Changes

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.1.0

## 1.2.4

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

## 1.2.3

### Patch Changes

- 文档体系 v2.1 升级：AI-CONTEXT.md 重写为完整使用规则版；README 补全 AI 辅助开发引导、属性分层透传、INJECT_CONFIG 默认预设、ProTable 数据流、Column 说明、valueFormatter、自定义组件 4 种方式、响应式联动等章节；init-ai 改造为双载体（AGENTS.md 主载体 + .agents/skills/ 参考载体，支持标记区块智能合并与幂等更新）；重新生成 api.json 修复 Hook 参数提取；修复 generate-api-json.ts 的 @param 正则。

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.0.3

## 1.2.2

### Patch Changes

- fix(core): 修复 useTable 重置查询参数时未恢复初始分页参数的问题

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.0.2

## 1.2.1

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
