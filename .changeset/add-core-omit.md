---
'@qin-ui/pro-components-core': minor
---

新增 `omit(object, keys)`：返回新对象并剔除指定顶层键，与 lodash `omit` 语义对齐。

- 拷贝自有与继承的可枚举属性（含 Symbol 键；数组入参不拷贝 Symbol 键，对齐 lodash）；
- `null` / `undefined` 入参返回空对象；不修改源对象，返回新对象；
- 危险键（`__proto__` / `constructor` / `prototype`）不参与拷贝；
- 仅处理顶层键，不解析 `a.b` 深层路径。
