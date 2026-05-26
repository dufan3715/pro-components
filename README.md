# 🛡️ Qin UI Pro Components

> 基于主流 UI 框架二次封装的高级组件库（Pro Components）集合，提供高度可配置、Schema 驱动的 `ProForm` 和 `ProTable`，助力开发者极速构建企业级中后台系统与移动端应用。

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.x-brightgreen.svg" alt="Vue 3.x" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/pnpm-Workspaces-orange.svg" alt="pnpm Workspaces" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT" />
</p>

## 📝 [使用示例和文档详细内容](https://dufan3715.github.io/pro-components/)

---

## 📦 组件库家族矩阵

本项目采用 Monorepo 架构进行管理。目前已提供以下四个子包，覆盖移动端与桌面端主流 UI 生态：

| 包名                           | 底层 UI 框架         | 目标平台    | 核心特性                                                                      | 说明文档                                             |
| :----------------------------- | :------------------- | :---------- | :---------------------------------------------------------------------------- | :--------------------------------------------------- |
| **`@qin-ui/antd-vue-pro`**     | Ant Design Vue (v4+) | 桌面端 (PC) | 基于 antdv 经典 API 封装，提供功能强大的 `ProForm` 与 `ProTable`              | [📖 查看文档](./packages/antd-vue-pro/README.md)     |
| **`@qin-ui/antdv-next-pro`**   | antdv-next           | 桌面端 (PC) | 全新架构的 Schema 驱动，提供极致的类型推导与组件库插槽扩展能力                | [📖 查看文档](./packages/antdv-next-pro/README.md)   |
| **`@qin-ui/element-plus-pro`** | Element Plus         | 桌面端 (PC) | 深度融合 Element Plus 风格协议，极轻量化的配置式表单与表格组件                | [📖 查看文档](./packages/element-plus-pro/README.md) |
| **`@qin-ui/vant-pro`**         | Vant (v4+)           | 移动端 (H5) | 移动端优先，内置 Popup 弹窗型选择器（DatePicker、Area、Picker），支持嵌套分组 | [📖 查看文档](./packages/vant-pro/README.md)         |

---

## 🛠️ 项目目录结构

```text
pro-components/
├── packages/
│   ├── core/                  # 公共核心逻辑/工具方法
│   ├── antd-vue-pro/          # 基于 Ant Design Vue 的 Pro 组件
│   ├── antdv-next-pro/        # 基于 antdv-next 的 Pro 组件
│   ├── element-plus-pro/      # 基于 Element Plus 的 Pro 组件
│   └── vant-pro/              # 基于 Vant 的移动端 Pro 组件
├── examples/                  # 组件开发与演示示例项目
├── scripts/                   # 辅助构建与 API 生成脚本
└── package.json               # 根项目配置文件
```

---

## 🚀 统一开发与维护指引

本项目使用 `pnpm` 作为包管理工具，支持全包的工作空间（Workspace）联调。

### 1. 安装项目所有依赖

```bash
pnpm install
```

### 2. 启动本地开发示例演示

```bash
pnpm dev
```

### 3. 代码规范校验

```bash
# 执行 ESLint、Stylelint 和 Prettier 统一校验
pnpm lint
```

### 4. 生成统一 API 接口元数据

```bash
pnpm generate:api
```

---

## 🤝 参与贡献

如果您在使用过程中发现任何问题或有更好的想法，欢迎提交 [Issues](https://github.com/dufan3715/pro-components/issues) 或 Pull Request。

## 📄 许可证

本项目基于 [MIT](LICENSE) 开源许可证发布。
