---
'@qin-ui/pro-components-core': minor
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

新增 `mergeComponentVars` 工具（组件配置表按组件键逐属性浅合并），并修复 `ProComponentProvider` 嵌套时配置继承不完整的问题：

- 全量 `componentVars` 通道按组件键逐属性合并：同一组件键下内层只覆盖其声明属性，外层兄弟属性（如 `input.placeholder` 与内层 `input.allowClear`）继续继承；
- `componentMap` / `locale` 全局通道按「祖先 → 本层」浅合并，内层同名键仍覆盖外层；
- 内层空 Provider 完整继承外层配置。
