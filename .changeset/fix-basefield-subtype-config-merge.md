---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

修复 BaseField 的 Provider 配置解析：注入键不再只按「组件名 + picker/type」拼接，改为基础键与子类型键两层叠加。层叠顺序为「库内置默认（基础键 → 子类型键）→ Provider 配置（基础键 → 子类型键）→ 字段属性」，项目级 `componentVars` 始终覆盖库内置默认值。

- 带 picker/type 的字段重新读到基础组件的 Provider 默认值，基础组件携带无意义修饰段时不再丢失 `allowClear` / `getPopupContainer` / 占位符文案等配置；
- `date-picker` 未显式指定 picker/type 时按 `date` 子类型读取配置；
- 自定义组件携带 picker/type 时其 `componentVars` 配置重新生效。
