---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

统一 `hidden` 的公开类型面口径为 `MaybeRefOrComputedRef<boolean>`（`MaybeRef<T> | ComputedRef<T>`），并调整导出子路径与样式产物命名：

- **`hidden` 四包对齐**：
  - `vant-pro` 字段 `hidden` 由 `MaybeRefOrGetter<boolean>` 收窄为 `MaybeRefOrComputedRef<boolean>`（去掉 getter 承诺）；
  - `antdv-next-pro` / `element-plus-pro` 列 `hidden` 由 `boolean` 放宽为 `MaybeRefOrComputedRef<boolean>`；
  - `antd-vue-pro` 列 `hidden` 已为该口径（此前批次完成）。运行期四包本就经 `toValue` 取值，本次仅收敛类型面与 JSDoc；
  - 三个桌面包字段 `hidden` 的 JSDoc 与 `BaseFormItem` 注释中残留的「getter」表述一并收敛为「Ref / ComputedRef」，与类型面一致（四包现已无残留）。
  - **升级影响**：`hidden` 不再接受 `() => boolean` 形态（此前该形态仅在运行期生效、类型面本就拒绝或异常）；如需动态取值请改用 `computed(() => ...)` 或 `ref`。JSDoc 统一为「支持布尔、Ref 与 ComputedRef 形式」。
- **回归**：`vant-pro` `BI-A18` 改为「Ref 生效 + getter 不入类型面」（`@ts-expect-error` 锁定）；`element-plus-pro` 新增 `PT-A34`（列 `hidden` 传 `Ref` 无需断言、外部 ref 翻转驱动列显隐、分组子列递归过滤）；`antd-vue-pro` `PT-A19` / `PT-A30` 与 `antdv-next-pro` `PT-A19` 已去掉/收敛断言。
- **`exports` 补 `"./package.json"`**：四个 UI 包新增该子路径，与 `@qin-ui/pro-components-core` 一致 —— 工具链读取包版本/元信息（unplugin 解析器、文档生成、postcss 插件等）时不再报 `ERR_PACKAGE_PATH_NOT_EXPORTED`。实测 `require.resolve('@qin-ui/antd-vue-pro/package.json')` 解析成功。
- **三个桌面包不再暴露 `./*.css` 子路径**（`antd-vue-pro` / `antdv-next-pro` / `element-plus-pro`）：样式由入口 `es/index.js` 顶部的 `import "./*.css"` 自动引入（`sideEffects` 已保证其不被 tree-shaking 删除），无需额外的手动入口。移除后这些路径解析为 `ERR_PACKAGE_PATH_NOT_EXPORTED`，与包内其它未声明的深路径一致；`vant-pro` 本就没有该子路径（源码无 `<style>` 块、无 CSS 产物），未改动。
- **三个桌面包固定样式产物文件名**：各自 `vite.config.ts` 的 `build.lib` 新增 `cssFileName: '<包名>'`。此前文件名由 `package.json` 的 `name` 推导（Vite `resolveLibCssFilename`），而构建注入的 `import "./*.css"` 是硬编码字符串 —— **改包名会让该引入指向不存在的文件且不报错**（rollup 不校验 `intro` 内容），表现为样式静默 404。实测：把包名临时改为 `@qin-ui/renamed-pkg` 后，三个包的产物名与入口引入均保持一致（固定生效）。

**升级影响（三个桌面包）**：若项目显式 `import '@qin-ui/<包名>/<包名>.css'`（`antd-vue-pro` / `antdv-next-pro` / `element-plus-pro`），升级后会报 `ERR_PACKAGE_PATH_NOT_EXPORTED` —— 请删除该导入（样式由入口自动引入，无需手动引）。常规用法（从包根导入组件）不受影响，样式照常生效。

破坏性变更：三个桌面包移除 `./<包名>.css` 导出子路径（仅影响显式导入该路径的项目）；其余为类型面口径统一（运行期行为不变）与 `exports` 增量。
