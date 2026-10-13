---
'@qin-ui/pro-components-core': patch
---

core 的文档口径与安全边界修正：

- **JSDoc 归位**：`camelizeProperties` 的 JSDoc 此前被模块内 `const verbatimAttrRE` 隔断而挂到该私有常量上，公开 API 在产物 d.ts 中零文档；现归位到函数本身。
- **`@internal` 口径校正**：`isDangerousKey` 的说明与相关 Changeset 文案统一为「包内工具、未纳入包根导出面」（`exports` 未声明子路径，包外不可达）。
- **`format`（locale）** 的占位符解析改用自有属性判定：`format('{toString}', {})` 不再把原型链上的成员当作参数替换（此前会输出原生函数源码）。
- **`pick`** 跳过危险键（`__proto__` / `constructor` / `prototype`）：以 JSON 数据为源时不再替换结果对象的原型（复用包内 `isDangerousKey`）。

新增判别用例 `LC-08` / `SU-08`。

说明：`useSearchFormExpand` 为 qin-ui 各包内部使用的 Hook（经各包 `shared/core` 内部 barrel 引入，不在四个包的公共入口链上），其返回类型 `UseSearchFormExpandReturn` 维持包内可见范围，不纳入 core 包根导出面。
