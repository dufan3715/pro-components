---
'@qin-ui/pro-components-core': patch
---

补充 `useSearchFormExpand` 初值判定边界说明：`Date` / `File` / `RegExp` 等无可枚举自有键的非普通对象按“无值”处理，含可枚举键但值为 `undefined` 的空壳普通对象按“有值”处理。
