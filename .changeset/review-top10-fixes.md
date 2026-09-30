---
'@qin-ui/pro-components-core': patch
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

修复代码评审 §2.3 Top-10 优先修复项（其余 P1 项按决策暂不纳入本轮）：

- **表格**：列 `hidden` 统一按响应式解包（`Ref` / getter 形态不再被永久隐藏），覆盖三包 `ProTable`、`ColumnControl` 与 core 的搜索字段可见性判定；`addIndexColumn` 默认值口径统一为 `true`——README props 表原写 `false`，与 Provider 默认表、运行时实现矛盾，本次以运行时行为为准修正文档。
- **表单**：未传 `:form` 的 `ProForm` 兜底表单实例改为 `setup` 同步期创建，消除 `provide() can only be used inside setup()` 告警，兜底实例的数据 store 注入恢复生效；element-plus / vant 的分组字段 `disabled` 向子字段传播（element 的禁用上下文 provider 改为「继承 + 未声明不改写」，vant 以 prop 显式透传）。
- **core**：批量 `setFormData` 过滤 `__proto__` / `constructor` / `prototype` 危险键（复用并导出 `isDangerousKey`），服务端下发的初始数据不再可替换表单对象原型；嵌套字段路径 JSDoc 示例更正为完整点分路径（`address.city`）。
- **测试基建**：`core` 表格用例去掉对被 gitignore 的 `es/index.js` 产物的子进程依赖，改为进程内断言；三包 UI 测试中「`if (el.exists())` 守卫导致的零断言通过」全部改为硬断言并补齐 `searchFields` 前置（含 antd / antdv-next 的 `SizeControl` 用例改为真实交互）；「手动展开不被自动测量覆盖」判别用例改为二次测量越过死区，经突变验证可失败；element「点击查询」改为只点击 + `attachTo: document.body` 验证原生隐式提交路径；补齐 `addIndexColumn` 默认与反向用例。

破坏性变更：无（`addIndexColumn` 仅修正文档默认值，运行时行为未变）。
