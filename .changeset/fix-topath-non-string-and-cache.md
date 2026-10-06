---
'@qin-ui/pro-components-core': patch
---

修复 `toPath` 的非字符串入参行为，并让共享解析缓存不可被就地修改：

- **现象**：`toPath(123)` / `toPath(true)` / `toPath({})` 抛 `TypeError: p.indexOf is not a function`、`toPath(['a', 'b'])` 抛 `TypeError: p.split is not a function`；同时 `toPath` 返回的是模块级解析缓存中的**同一数组实例**，写方一旦就地修改即污染后续所有同路径解析。
- **修复**（以 lodash `toPath` 为对标基线，与 `normalizePathKey` 口径一致）：
  - 入参放宽为 `unknown`：数组 → 逐段 `String`；`number` / `boolean` → 单段 `String(v)`；`null` / `undefined` / 对象 / symbol → `[]`；字符串路径行为完全不变。
  - 与 `normalizePathKey` 建立并锁定不变量：`toPath(v).join('.') === normalizePathKey(v)`。
  - 解析结果写入缓存时 `Object.freeze`（仅创建时一次性，不做逐次 `slice()` 拷贝）—— 只读方零影响，写入方立即抛 `TypeError`，不再可能静默污染缓存。
- **与 lodash 的有意分歧（用例显式锁定）**：
  - 对象与 symbol → `[]`（lodash 产出 `['object Object']` 与原样 symbol 段，均不可用作路径 key）；
  - 小数 → `['1.5']`（lodash 先把数字 `toString` 再按点分拆为 `['1','5']`）。
- **对齐 lodash 的部分**：数组、整数、布尔逐项对拍一致；`null` / `undefined` / 空字符串同样返回 `[]`。
- **只读契约说明**：返回值仍为缓存中的同一实例（保持零分配），已冻结；antd 的 `NamePath` 类型要求可变数组，故未改用 `readonly string[]` 类型。

破坏性变更：无（字符串路径行为与返回值内容不变；非字符串入参此前会抛错，现按上述规则返回确定性结果）。
