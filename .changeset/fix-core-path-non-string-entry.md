---
'@qin-ui/pro-components-core': patch
---

`get` / `set` 的路径入口统一归一，修复裸数字 / 布尔路径的错误读写：

- **变更前**（TS 签名已排除、JS 或无类型调用可达）：`get({ a: 1 }, 0)` 返回**整个对象**（`path.length` 为 `undefined`，遍历整体跳过）；`set({}, 0, 'v')` 写入键名 `"undefined"`（`{"undefined":"v"}`）。
- **变更后**：`get` / `set` 对非字符串路径统一经 `toPath` 归一——数字 / 布尔标量按单段键读取或写入（`get({ 0: 'v' }, 0)` → `'v'`、`set({}, 0, 'v')` → `{ 0: 'v' }`，与 lodash 一致）；段数组逐段 `String` 归一；空段数组、`null` / `undefined`、对象与 symbol 路径不产生读取与写入（`get` 返回 `undefined`，`set` 原样返回目标对象）。字符串路径行为完全不变。
- `normalizePathKey` 的括号分支改为复用模块级解析缓存（同路径仅解析一次）。

验证：判别用例 `PT-05` 与 lodash `get` / `set` 逐例对拍（回退即失败）。

破坏性变更：无（此前为错误行为；若曾有代码依赖 `set(obj, 0, v)` 写入 `obj.undefined`，需改为显式字符串路径）。
