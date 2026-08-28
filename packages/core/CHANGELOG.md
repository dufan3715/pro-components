# @qin-ui/pro-components-core

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
