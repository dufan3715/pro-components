---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

修复字段实例访问器未进入公开类型面的问题（消费方此前只能 `as any`）：

- **现象**：字段渲染挂载后，运行时会在字段配置对象上注入实例访问器，但四包的公开字段类型（`Field` / `Base`）均未声明，TypeScript 消费方访问 `field.getComponentRef?.()` 只能靠 `as any` 或 `@ts-ignore`。
- **修复**：复用 core 既有的规范类型 `AdditionalMethods<FormItemInstance>`（**未新增重复类型**），在公开 `Field` / `Base` 上交叉该类型：
  - `antd-vue-pro` / `antdv-next-pro` / `element-plus-pro`：`AdditionalMethods<FormItemInstance>`（宿主 FormItem 实例类型）；
  - `vant-pro`：按其运行时实际挂载范围取 `Pick<AdditionalMethods<any>, 'getComponentRef' | 'getComponentComputedProps'>`（vant 不挂载表单项级访问器）；
  - 各包 `shared/core` 按统一导入契约（§1.3）再导出 `type AdditionalMethods`。
  - 交叉位置在公开类型映射（`WithRef`）**之外**：字段配置属性会被映射为 `MaybeRefOrComputedRef`，若声明在 `BaseCommon` 内，访问器会变成 `Ref | (() => T)` 而不可调用。
- **回归**：四包新增 `BI-A16` —— `const field: Field = form.fields.value[0]` 后直接访问并调用访问器（无任何类型断言）；element 既有用例中的 `as any` 一并移除。

破坏性变更：无（仅类型面补充，运行时行为不变）。
