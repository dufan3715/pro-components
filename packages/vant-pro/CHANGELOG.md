# @qin-ui/vant-pro

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
