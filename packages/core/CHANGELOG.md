# @qin-ui/pro-components-core

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
