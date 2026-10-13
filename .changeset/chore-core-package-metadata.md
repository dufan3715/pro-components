---
'@qin-ui/pro-components-core': patch
---

补齐 core 的发布元数据（与四个 UI 包口径一致，无运行时代码变更）：

- `package.json` 新增 `repository` / `homepage` / `keywords`，npm 页面可回溯源码仓库；
- `exports` 新增 `"./package.json"` 子路径，`import '@qin-ui/pro-components-core/package.json'` 不再报 `ERR_PACKAGE_PATH_NOT_EXPORTED`（工具链读取包版本/元信息可用）。
