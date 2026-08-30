---
'@qin-ui/pro-components-core': patch
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

docs(source-comments): 全包源码注释完善——面向 sourceMap 进源码阅读场景

面向「使用方经 declarationMap / sourceMap 进入包源码阅读」的场景补齐与修正注释，运行时行为零变化：

- **core**：补齐关键逻辑段注释——`useForm` 的入参分派 / root 注入回退链 / `createFormProxy` 各 trap（实时取实例 + methodCache 引用记忆化）、`useFormData` 的注入复用与批量覆盖「先删后合」语义、`useFields` 的路径缓存回验自愈 / BFS 建索引 / 两段式降序 splice、`useTable` 的分页白名单 / 快照恢复 / DFS 匹配 key→dataIndex 顺序 / 列 key 兜底链、`path.ts` 的断裂语义与中间层建层规则、`useSearchFormExpand` 的测量驱动源与 RO 生命周期、locale 繁体判定顺序；
- **UI 四包**：补齐 `ProForm` 的 `:key="formKey"` 子树重挂载契约注释（三包同构）、antdv-next 的 attrs.disabled 归一下发、element-plus 的 `@submit.prevent` 与 `onSizeChange` 重置回第 1 页、vant 的共享弹层容器 / popup 提交语义 / formPopup 附加策略；
- **JSDoc 偏差修正**：三桌面包 `useTable` 的 `resetQueryParams` 由「重置分页到第一页」更正为「恢复到初始化快照」；三包 `SearchForm` 文档的 IntersectionObserver 职责描述与实现对齐；
- **注释规范落地**：超过 1 行的注释统一为 `/* */` 块注释（AGENTS.md §2.2 新规），`// prettier-ignore` / `// eslint-disable-next-line` 工具指令对保留。

纯注释变更，公开 API 与运行时行为零变化（五包 build / 454 测试 / vue-tsc / prettier 全绿）。
