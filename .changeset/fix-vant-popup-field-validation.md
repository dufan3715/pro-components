---
'@qin-ui/vant-pro': patch
---

fix(base-field): popup 型字段可被 vant Form 按 name 寻址校验 (R-05)

- popup 分支的展示 `VanField` 此前未绑定 `name`，在 vant 表单注册表中为匿名字段：`formRef.validate(path)` / `validate([path])` 按 name 匹配不到，以裸 `Promise.reject()`（reason 为 `undefined`）落空，`resetValidation(path)` 静默无操作；
- 现补 `:name="props.path"` 与非 popup 分支对齐：按名校验命中并以 `{ name, message }` 拒绝、校验错误信息回显在该字段下方、按名重置可清除；
- 整表 `validate()`（无参）行为不变（本就覆盖全部注册子字段）；popup 交互主链路（点击 → 弹层 → confirm 回填 formData）不受影响；
- 新增判别测试 VP-B6。
