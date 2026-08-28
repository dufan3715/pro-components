# 贡献指南 (Contributing Guide)

感谢你对 `@qin-ui/pro-components` 的关注与贡献！本文档旨在帮助开发者快速熟悉 Monorepo 的工程结构、本地开发流程、测试规范与发版标准。

---

## 一、Monorepo 项目结构

本项目基于 **Pnpm Workspace** 构建，包含以下子包：

| 包路径                      | npm 包名                      | 职责                                                               |
| :-------------------------- | :---------------------------- | :----------------------------------------------------------------- |
| `packages/core`             | `@qin-ui/pro-components-core` | 纯逻辑核心层（无 UI 库依赖，表单与表格状态机、路径解析、通用工具） |
| `packages/antd-vue-pro`     | `@qin-ui/antd-vue-pro`        | Ant Design Vue 4.x 适配层                                          |
| `packages/antdv-next-pro`   | `@qin-ui/antdv-next-pro`      | Ant Design Vue Next 适配层                                         |
| `packages/element-plus-pro` | `@qin-ui/element-plus-pro`    | Element Plus 2.x 适配层                                            |
| `packages/vant-pro`         | `@qin-ui/vant-pro`            | Vant 4.x 移动端适配层                                              |
| `examples`                  | —                             | 本地开发与组件冒烟示例项目（基于 Vite）                            |
| `docs`                      | —                             | 文档网站项目                                                       |

---

## 二、本地开发环境准备

### 2.1 环境要求

- **Node.js**: `>= 18.0.0`
- **Pnpm**: `>= 9.0.0`

### 2.2 安装与启动

```bash
# 1. 克隆仓库
git clone https://github.com/dufan3715/pro-components.git
cd pro-components

# 2. 安装全部依赖
pnpm install

# 3. 构建 Core 包（UI 包与示例工程依赖 Core 的产物）
pnpm --filter "@qin-ui/pro-components-core" build

# 4. 启动 examples 调试工程
pnpm run dev
```

---

## 三、代码规范与架构约束

在提交代码前，请务必阅读并遵守 [AGENTS.md](./AGENTS.md) 中定义的架构契约：

1. **分层原则**：通用状态机与算法下沉至 `packages/core`，UI 包内部统一从 `src/shared/core` 引入 Core 导出；
2. **注释规范**：
   - 注释只描述当前逻辑的职责、工作方式与设计取舍（“是什么/怎么工作/为何这样设计”）；
   - **严禁在注释中书写改动日志**（如“从 X 改为 Y”、“修复 Z 缺陷”属于 Git Commit 和 Changeset 职责）；
   - 导出函数与公共 Hook 必须提供结构完整的 JSDoc 注释（首行摘要 + `@description` + `@param` / `@returns`）；
3. **多包同构**：同构功能变更必须同步覆盖 4 个 UI 适配包，防止跨包行为漂移。

---

## 四、质量门禁与测试规范

每次变更必须通过以下所有质量门禁：

### 4.1 单元测试 (Vitest)

```bash
# 运行五包全量单元测试
pnpm -r test

# 运行指定包的单测
pnpm --filter "@qin-ui/antd-vue-pro" test
pnpm --filter "@qin-ui/element-plus-pro" test
```

### 4.2 类型检查 (vue-tsc)

```bash
# 执行全包类型检查（覆盖 src 与 __tests__）
pnpm --filter "./packages/*" exec vue-tsc --noEmit
```

### 4.3 代码风格检查 (Prettier)

```bash
# 检查格式
npx prettier --check "packages/**/*.{ts,vue,json}" "*.md"

# 自动格式化
npx prettier --write "packages/**/*.{ts,vue,json}" "*.md"
```

---

## 五、提交与发布流程

### 5.1 Git Commit 规范

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。提交格式如下：

```
<type>(<scope>): <subject>
```

- **Type**: `feat`（新特性）、`fix`（缺陷修复）、`perf`（性能优化）、`refactor`（重构）、`docs`（文档）、`test`（测试）、`chore`（构建/工具维护）；
- **Scope**: `core`、`antd`、`antdv-next`、`element-plus`、`vant`、`examples` 等；
- **Subject**: 简洁陈述本次变更，动词开头。

### 5.2 Changeset 发版管理

本项目使用 `@changesets/cli` 管理多包版本与发布日志：

```bash
# 1. 产生变更集
pnpm changeset

# 2. 根据命令行交互选择受影响的包、版本升级类型（patch/minor/major）并填写变更说明；
# 3. 提交生成的 .changeset/*.md 文件。
```
