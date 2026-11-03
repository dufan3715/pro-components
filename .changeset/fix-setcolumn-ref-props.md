---
'@qin-ui/pro-components-core': patch
---

修复 `setColumn` 写入列上以只读 ref（如 `computed`）声明的属性时触发 Vue 只读告警且写入失效的问题：只读 ref 键先移除再写入普通值，可写 ref 仍按 `ref.value` 写入并保持外部绑定。列控面板切换 `hidden` 为只读 ref 的列现在真实生效。
