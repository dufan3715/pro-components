# Google Antigravity & Agent 协作协议规范：@qin-ui/pro-components

本文档作为本仓库面向 AI Agent 与核心开发者协同演进的**最高指导规范与架构契约**。所有代码贡献、功能重构、缺陷修复必须严格遵循本文档定义的原则与工程纪律。

---

## 一、项目定位与架构分层

`@qin-ui/pro-components` 是面向企业级中后台场景的配置驱动高阶组件库 Monorepo，采用 Vue 3.5+ 与 TypeScript 开发。

```
packages/
├── core                  # 纯逻辑核心层（无任何 UI 库依赖，纯 Vue 响应式状态机与工具函数）
├── antd-vue-pro          # Ant Design Vue 4.x 适配层
├── antdv-next-pro        # Ant Design Vue Next 适配层
├── element-plus-pro      # Element Plus 2.x 适配层
└── vant-pro              # Vant 4.x 移动端适配层
```

### 1.1 分层职责边界

1. **Core 纯逻辑层 (`@qin-ui/pro-components-core`)**：
   - 承载 `useForm`、`useFields`、`useFormData`、`useFormRef`、`useTable`、`useSearchFormExpand` 等纯逻辑 Hook；
   - 承载 `get`、`set`、`toPath`、`normalizePathKey`、`createFormProxy`、`cloneDeep`、`pick` 等核心算法与工具；
   - **严禁**在 core 中引入任何第三方组件库（如 antd、element-plus、vant）或 DOM 操作强耦合（除通用的 Observer/scrollHeight 跨平台抽象外）。
2. **UI 适配层 (`*-pro`)**：
   - 负责与宿主 UI 库的基础组件对接与布局编排（如 `ProForm`、`ProTable`、`BaseField`、`BaseFormItem`、`SearchForm` 等）；
   - 负责处理不同 UI 库在 Props、Slots、Events、样式层级上的语法差异。
3. **`shared/core` 统一导入契约**：
   - 各 UI 包内部**严禁**直接散列 `import { ... } from '@qin-ui/pro-components-core'`；
   - 必须由各包的 `src/shared/core/index.ts` 集中 re-export，包内源码一律从 `../../shared/core` 相对路径引用，确保未来依赖治理与版本升级收敛。

---

## 二、注释与文档规范 (Code Comment Guidelines)

### 2.1 职责与机制原则（禁止改动日志式注释）

- **只描述当前代码的职责与工作方式**（“是什么”、“怎么工作”、“为何这样设计”）；
- **严禁在源码注释中记录改动过程**：诸如“从 X 改为 Y”、“修复了 Z 缺陷”、“解决 5.8 痛点”、“随 T29 下沉”等改动历史属于 Git Commit Message 与 Changeset 的职责，严禁残留在源码注释中。

### 2.2 格式与 JSDoc 规范

1. **行内注释**：
   - 仅用于解释非显而易见的局部逻辑，使用 `//` 且尽量保持在 1 行为限，置于被说明代码上方；
   - 严禁残留调试注释、被注释的死代码、TODO/FIXME（未在 backlog 登记的临时标记）。
2. **函数 / 类 / 模块 JSDoc**：
   - 统一使用 `/** */` 块注释；
   - 结构为：“首行摘要” + “`@description` 详细行为说明” + “`@param` / `@returns` / `@template`”；
   - 存在重要设计取舍或降级机制的 API，必须在 JSDoc 中明确标明行为边界。
3. **同构组件文案一致性**：
   - 四包中同构组件与 Hook（如 `ProForm`、`SearchForm`、`BaseField`）的注释文案与结构必须保持一致；
4. **配置项命名规范**：
   - `componentVars` / `componentMap` 等配置在注释示例中统一使用驼峰形式（如 `:componentVars="..."`）。

---

## 三、核心设计决策与行为契约 (Architectural Invariants)

### 3.1 表单代理与动态路由 (`createFormProxy` / `formKey`)

- **顶层注入代理**：顶层 `ProForm` 向下游 Vue 上下文 provide 的是 `createFormProxy(() => currentForm.value)`；
- **动态路由**：外部 `:form` prop 发生运行期替换时，下游组件无需重新获取注入，所有属性读写与调用实时路由至新实例；
- **方法引用记忆化**：内部通过 `methodCache` 按键缓存方法包装，确保函数引用恒等（`formProxy.setFormData === formProxy.setFormData`），支持直接用作事件处理器或 Watcher 依赖源；
- **`:key="formKey"` 子树重挂载契约**：
  - **设计意图**：通过 `WeakMap` 为每个传入的 `form` 实例生成自增 ID 绑至底层原生 Form 组件的 `:key="formKey"`。当外部运行期传入全新 `form` 实例时，强制触发整棵表单子树**重新挂载 (Remount)**，彻底重置宿主 UI 库的原生校验状态与深层字段非受控状态，杜绝脏状态残留；
  - **行为边界与取舍**：`:form` 实例切换引发的 Remount 会导致输入焦点、容器滚动位及展开中的下拉菜单/浮层复位。业务若仅需更新表单数据或字段配置，应调用 `form.setFormData()` 或 `form.setFields()`，而非频繁切换 `:form` 实例。

### 3.2 搜索表单自适应与高度管理 (`useSearchFormExpand`)

- **自然高度测量**：使用 `scrollHeight` 测量自然展开高度，突破容器固定高度与 `overflow: hidden` 约束；
- **尺寸动态监听**：使用 `ResizeObserver` 监听容器变化，驱动高度更新；
- **交互锁定机制**：一旦用户手动点击展开/收起，置位 `isManualToggle`，防止后续自动测量覆盖用户意图；
- **初值自动展开**：使用 `IntersectionObserver` 检测隐藏区域内是否有非空搜索值，若有初值则自动展开。

### 3.3 表格与分页数据流 (`useTable`)

- **分页白名单保护**：`setPageParam` 严格使用 `pageParamProperty` 进行白名单浅拷贝赋值，防止未知字段污染；
- **重置语义**：`resetQueryParams` 会将 `pageParam` 与 `searchParam` 同时重置回初始化传入的深拷贝副本；
- **列索引与响应式**：`normalizeColumn` 确保每个列具备唯一 `key`，`setColumn` 维护列属性合并与替换。

### 3.4 高性能路径算法 (`shared/path.ts`)

- **收窄语法**：仅支持点分（`a.b`）、数字段（`list.0`）、简单括号（`a[0]`），不为 lodash 复杂边界付费；
- **告警与兜底**：非法语法在开发环境输出带去重保护的 `console.warn`；
- **响应式安全**：`set` 遇到相同值（`Object.is`）时跳过写入，避免触发无效的 Vue 依赖更新。

### 3.5 实例注册与 WeakMap (`BaseFormItem`)

- 字段实例的收集必须使用 `WeakMap<object, ComponentInternalInstance>`，以字段对象的原始引用（`toRaw(field)`）为 Key；
- **严禁**使用数字下标或数组索引管理实例，彻底杜绝字段 `splice`、动态过滤或重排导致的实例错位。

### 3.6 深拷贝与降级处理 (`cloneDeep`)

- 优先使用平台原生 `structuredClone`；
- 遇到不可结构化克隆的数据时降级为 JSON 序列化/反序列化，并在 dev 环境输出规范说明告警。

---

## 四、多包同构防漂移纪律 (Anti-drift Protocols)

在向 Monorepo 引入变更时，必须遵循以下防漂移规则：

1. **同构特性四包对齐**：
   - 修复桌面端缺陷时，必须同步评估 `antd-vue-pro`、`antdv-next-pro`、`element-plus-pro`；
   - 修复移动端通用表单缺陷时，必须同步覆盖 `vant-pro`。
2. **测试基建同步维护**：
   - 新增特性或修复缺陷必须在 `__tests__/` 下补充对应的单元测试；
   - 判别性测试命名遵循已有体系（如 `PF-` / `BI-` / `BF-` / `PT-` / `SF-` / `SC-` / `CC-` / `PC-` / `IT-` 等编号）。
3. **质量验证门禁**：
   ```bash
   pnpm --filter "@qin-ui/pro-components-core" build  # 产物构建
   pnpm -r test                                      # 五包测试全绿
   pnpm --filter "./packages/*" exec vue-tsc --noEmit # 类型检查 0 错误
   npx prettier --check "packages/**/*.{ts,vue,json}" # 代码风格 100% 通过
   ```
4. **发版规范**：
   - 变更记录必须由 Changeset 驱动，在 `.changeset/` 目录下编写清晰的用户侧影响与 Breaking Notes 说明。
