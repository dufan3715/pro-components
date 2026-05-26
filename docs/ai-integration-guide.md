# AI 编码助手接入指南

> 本文档帮助业务项目开发者配置 AI 编码工具，使其能够充分理解 `@qin-ui/xxx` 相关依赖包。

## 核心原理

本项目已为所有 npm 发布的包提供了：

| 能力                    | 实现方式                                                  | 适用 AI 工具               |
| ----------------------- | --------------------------------------------------------- | -------------------------- |
| **TypeScript 类型声明** | 包内包含完整的 `.d.ts` 文件（含 JSDoc）                   | 所有 AI 工具原生支持       |
| **JSDoc 文档注释**      | 所有公开 API 都有 `@param`、`@returns`、`@example` 等标签 | 所有 AI 工具读取源码时解析 |
| **AI 上下文文档**       | 包目录下的 `AI-CONTEXT.md` 文件                           | 可手动提供给 AI 作上下文   |
| **结构化 API JSON**     | 通过脚本生成的 `api.json`（可选）                         | 可提供给 AI 作索引         |

## 无需额外配置的方式

安装依赖包后，AI 工具会自动读取 `node_modules` 中的类型声明文件（`.d.ts`），其中包含了完整的 JSDoc 注释。

```json
// package.json
{
  "dependencies": {
    "@qin-ui/antd-vue-pro": "^2.0.0"
  }
}
```

AI 工具会自动获得以下能力：

- ✅ `useForm<User>()` 中 `User` 类型的路径自动补全
- ✅ `Field` 配置中 `component` 属性可选值（'input' | 'select' | ...）
- ✅ `form.getField()`、`form.setField()` 等方法的参数类型
- ✅ ProForm、ProTable 组件的 props 类型

## 提升 AI 理解深度的可选方案

### 方案一：在对话中引用 AI-CONTEXT.md（推荐）

在向 AI 提问时，将对应包的 `AI-CONTEXT.md` 文件内容作为上下文提供：

**Cursor：**
在 Composer 或 Chat 中引用文件：

```
@AI-CONTEXT.md 请帮我实现一个 ProForm 表单
```

**GitHub Copilot：**
在 `.github/copilot-instructions.md` 中添加引用链接，或在对话中粘贴文档片段。

**Cline：**
在 `CLINE.md` 或 `.clinerules` 中添加项目上下文描述。

**其他通用方式：**
直接复制文档内容到对话窗口开头：

```
以下是我项目中 @qin-ui/antd-vue-pro 的 API 参考文档：
[粘贴 AI-CONTEXT.md 内容]
```

### 方案二：引用包内置已生成的结构化 API JSON（极力推荐）

为了省去开发者手动提取的繁琐，`@qin-ui/xxx` 已经在构建发布时**自动生成并内置了高纯度的 `api.json` 元数据文件**。它存放于各包的根目录下（例如 `node_modules/@qin-ui/antd-vue-pro/api.json`）。

你可以直接在 AI 对话中把这些内置的结构化 API 字典文件引为上下文，这将帮助 AI 以高水准的语义精度完美识别所有核心的组件属性、入参与 JSDoc 使用示例！

**Cursor 引用示例：**
在 Chat 或 Composer 中输入 `@` 符号，选择 `Files` 并搜索引用对应包的 `api.json` 即可：

```
@node_modules/@qin-ui/antd-vue-pro/api.json 请帮我使用 ProForm 实现一个带复杂校验的表单
```

### 方案三：在项目根目录添加 AI 上下文说明

在项目根目录创建 `.github/copilot-instructions.md`（GitHub Copilot）或直接在 `.cursorrules`（Cursor）中描述依赖库的使用方式：

```markdown
## 项目依赖库说明

本项目使用 @qin-ui/antd-vue-pro 作为 UI 组件库。

### 表单（ProForm）

- 使用 `useForm<DataType>()` 创建表单实例
- 字段配置通过 `fields` 数组，每个字段包含 `path`、`label`、`component` 等
- 支持字段联动、嵌套字段、自定义组件

### 表格（ProTable）

- 使用 `useTable<SearchType, DataType>()` 创建表格实例
- 列配置通过 `columns` 数组，推荐使用 `dataIndex` 字段
- 包含搜索表单、分页、列操作等能力
```

## AI 理解程度对照表

| 场景                       | 无 JSDoc         | 有 JSDoc + 类型             | 有 JSDoc + 类型 + AI-CONTEXT.md |
| -------------------------- | ---------------- | --------------------------- | ------------------------------- |
| `useForm` 返回类型         | `any` 或部分类型 | 完整类型推导 + 参数说明     | 同上 + 最佳实践示例             |
| `Field` 配置建议           | 无法智能补全     | 支持补全 path、component 等 | 同上 + 知道典型用法             |
| `form.getField()` 参数类型 | 可能建议错误类型 | 正确推导路径字符串          | 同上                            |
| 组件 props 提示            | 基本属性         | 完整属性 + 类型说明         | 同上 + 知道典型用法             |
| 错误诊断                   | 可能误判         | 准确识别类型错误            | 同上 + 知道最佳实践             |

## 最佳实践总结

1. **安装依赖后即可获得基础能力** - TypeScript 类型声明足以让大多数 AI 工具理解 API
2. **引用 AI-CONTEXT.md 可大幅提升质量** - 在对话开始时提供此文件作为上下文
3. **自定义项目 AI 说明可获得最佳效果** - 在项目根目录描述依赖库的使用方式
4. **配合项目中已有的代码示例** - AI 会从项目现有代码中学习使用模式
