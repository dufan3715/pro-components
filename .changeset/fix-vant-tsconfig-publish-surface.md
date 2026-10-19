---
'@qin-ui/vant-pro': patch
---

`tsconfig.json` 发布面收敛：移除 `"types": ["node"]`。

该文件随 `files` 发布，而 `@types/node` 仅为开发依赖 —— 消费方 `extends` 该配置时会因缺少 `@types/node` 解析失败，并失去 TypeScript 默认自动纳入的其它 `@types/*`。移除后按默认规则自动纳入，包内类型检查（含使用 `node:fs` / `node:path` 的用例）不受影响。
