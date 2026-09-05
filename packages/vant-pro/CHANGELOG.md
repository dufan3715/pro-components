# @qin-ui/vant-pro

## 1.3.4

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

## 1.3.3

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

- 206e205: fix(ssr): 消除模块级自增种子与随机 id 在 SSR 下的 hydration 隐患 (R-06)
  - **core `useTable`**：无 key 列的自动标识（`__col_N`）改由实例级种子生成，每次 `useTable` 调用独立从 1 计数，SSR 下服务端与客户端按相同列配置得到一致 key 序列；`normalizeColumn` / `normalizeColumns` 新增可选 `allocateKey` 参数供调用方注入生成函数，独立调用（未传参）时回退模块级兜底种子，行为向后兼容；
  - **vant-pro `useFormPopup`**：弹层容器 id（Teleport 目标 `#pro-form-popup-content-*` 会渲染进 DOM）由 `Math.random()` 改为 Vue 3.5 `useId()` 派生，SSR 下服务端/客户端 id 一致，消除 hydration mismatch 与 Teleport 目标失配；无组件上下文的命令式独立弹层（不参与 hydration）回退 `standalone-N` 兜底计数器，多实例仍互不冲突；
  - **vant-pro `BaseField`**：弹层字段归属标识 `fieldUid` 由模块级自增计数器改为直接复用组件实例 uid（`getCurrentInstance().uid`，同页面唯一）；该值仅参与运行期比对、不落入 DOM，SSR 不受影响，开发期 HMR 与多实例行为不变；
  - 附带评估：四包 ProForm 的 `formInstanceCounter`（`:key="formKey"` 重挂载契约）key 不落 DOM、语义绑定 form 实例身份，无需调整；
  - 新增判别测试：core TT-22~TT-24（实例级种子序列、动态增列延续、显式 `allocateKey` 递归）、vant VP-V12~VP-V14（跨挂载 id 可复现、同应用多实例唯一、归属标识与实例 uid 恒等）。

- 206e205: `getInjectConfig` 对未知组件 key 命中即写入动态缓存（与 `ensureInjectConfig` 及其余三包语义对齐）：
  - 同一自定义组件 key 多次寻址返回同一注入配置，此前每次生成一次性 Symbol，`inject` 恒取默认值；
  - `ProComponentProvider` 注册的自定义 `componentVars` key 现在可被字段侧 `getInjectConfig` 命中；
  - 非字符串 component 共享同一 anonymous 注入配置，行为不变（恒取默认值）。

- 206e205: fix(base-field): popup 型字段可被 vant Form 按 name 寻址校验 (R-05)
  - popup 分支的展示 `VanField` 此前未绑定 `name`，在 vant 表单注册表中为匿名字段：`formRef.validate(path)` / `validate([path])` 按 name 匹配不到，以裸 `Promise.reject()`（reason 为 `undefined`）落空，`resetValidation(path)` 静默无操作；
  - 现补 `:name="props.path"` 与非 popup 分支对齐：按名校验命中并以 `{ name, message }` 拒绝、校验错误信息回显在该字段下方、按名重置可清除；
  - 整表 `validate()`（无参）行为不变（本就覆盖全部注册子字段）；popup 交互主链路（点击 → 弹层 → confirm 回填 formData）不受影响；
  - 新增判别测试 VP-B6。

- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
- Updated dependencies [206e205]
  - @qin-ui/pro-components-core@2.0.3

## 1.3.2

### Patch Changes

- - **core**:
    - 修复 `setFormData` 类型定义，补齐顶级已知字段泛型重载与 `ExtendWithAny` 批量覆盖兼容性；
    - 恢复 `getFormData` 2 层与 3 层嵌套路径的强类型推导重载；
    - 优化 `setFormData`、`getFormData` 与 `getField` 的 JSDoc 结构，消除 TypeScript 方法重载在 IDE Hover 时产生的首行文字无格式拼接问题。
  - **UI 适配层 (antd-vue-pro / antdv-next-pro / element-plus-pro / vant-pro)**:
    - 完善 `useForm` JSDoc 中 `setFormData` 四种调用形态说明并对齐最新 core 类型定义。
- Updated dependencies []:
  - @qin-ui/pro-components-core@2.0.2

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
  - **FormPopup 管理与 open 签名增强**：
    - `useFormPopup` 的 `open` 方法签名更新为 `open(path: string, initialValue?: any, customProps?: Partial<PopupProps>, fieldId?: number | string)`；
    - 自动隔离各字段实例并支持在 `open` 时重置 `props` 为全局默认值 `DEFAULT_POPUP_PROPS`，杜绝跨字段属性污染；
    - 为支持多实例 Teleport 容器隔离，新增 `contentId` 与 `teleportTo` 唯一选择器。
  - **ValueFormatter 旧值传递机制与只读快照契约**：
    - **按需注入旧值**：底层基于格式化函数的形参个数（`fn.length > 1`）决定是否读取旧值上下文。若转换逻辑需要使用旧值，请显式声明两个形参 `(val, oldVal) => ...`；
    - **只读快照副本**：传入的 `oldVal` 为只读快照副本，不得依赖原地修改写回；仅当 formatter 声明双形参时才克隆旧值，单参转换零开销。

  ### 🐞 缺陷修复与优化 (Bug Fixes & Improvements)
  - **useForm (VP6)**：
    - 修复 `useForm(root: false)` 镜像 core 的 root 判定；
    - 移除显式 `disabled` prop，表单属性透传至底层 `VanForm`；
    - 支持未传 `form` 时的自动初始化与运行时 `:form` 替换动态代理（Proxy 三 trap + formKey）；
  - **useFormPopup (V7, V8, V10, V11, V18)**：
    - 修复 `onFieldClick` 取值源为原始底层数据（`form.getFormData(path)`），避免 getter 展示格式化字符串导致 DatePicker / Picker 选择器初始选中错位；
    - 增加 `DEFAULT_POPUP_PROPS` 与 `resetProps()`，打开弹层自动重置并合并当前字段属性；
    - 引入 `activeFieldId` / `fieldUid` 实例匹配，彻底杜绝相同 path 字段在 Teleport 容器中的双渲染冲突；
    - 修复确认回调清空表单项的能力，移除 `if (popupVal !== undefined)` 守卫；
    - 移除 `as never` 类型断言；
  - **BaseField (VP3, V9, A14, B4)**：
    - `getInitProps` 纯函数化，setup 顶层注入；
    - 修复 `signature` 组件取消事件映射为 `onClear`；
    - 未识别组件类型时输出明确警告并降级为原生元素渲染；
    - 落地 B4 旧值按需克隆契约；
  - **ProComponentProvider (V2, VP5)**：
    - `componentVars` 与 `componentMap` 均改为 `computed` 响应式 provide，支持动态切换自定义组件映射。

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

## 1.2.3

### Patch Changes

- perf: 表单渲染链路深度扁平化重构与性能优化
  - **链路扁平化（8 层 -> 6 层）**：彻底移除 `PathProvider` 组件实例，精简组件树层级
  - **Hook 纯函数化**：将 `GroupedFieldAttrs` 改造为 `useGroupFieldAttrs` 纯计算 Hook，100% 消除作用域插槽闭包转发开销
  - **实例开销降低**：单字段 Vue 内部组件实例减少 2 个（Antd 系 8->6，Vant 4->2），内存与首次挂载速度显著优化

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.1.3

## 1.2.2

### Patch Changes

- fix: 修复 ProTable 列配置响应式引用断开、多级表头递归与表单插槽注入时序等问题

- Updated dependencies []:
  - @qin-ui/pro-components-core@1.1.1

## 1.2.1

### Patch Changes

- fix(form): 修复 slots 类型合并逻辑，避免 FormItem 插槽与底层组件插槽产生交集类型

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
