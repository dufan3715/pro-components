---
'@qin-ui/vant-pro': patch
---

`getInjectConfig` 对未知组件 key 命中即写入动态缓存（与 `ensureInjectConfig` 及其余三包语义对齐）：

- 同一自定义组件 key 多次寻址返回同一注入配置，此前每次生成一次性 Symbol，`inject` 恒取默认值；
- `ProComponentProvider` 注册的自定义 `componentVars` key 现在可被字段侧 `getInjectConfig` 命中；
- 非字符串 component 共享同一 anonymous 注入配置，行为不变（恒取默认值）。
