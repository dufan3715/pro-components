---
'@qin-ui/pro-components-core': patch
---

fix(path): 告警去重集合 `warnedPaths` 增加容量上界 (R-23)

`pathCache` 有 5000 上限 + FIFO 批驱逐，但 `warnedPaths` 只增不减：长时运行进程中动态拼接的海量互异非法路径（如把用户输入直接当 path）会使该集合缓慢无界增长。

- `warnedPaths` 套用与 `pathCache` 相同的策略：5000 上限，超限 FIFO 分批驱逐最旧的 10%；
- 驱逐逻辑抽为共用 `evictOldestBatch`，两处存储复用同一实现；
- 行为影响：被驱逐的早期路径再次出现时会重复输出一次告警（仅 dev 提示噪音，无功能影响）；稳态内存占用有界（约 5000 条路径字符串）；
- 新增判别测试：灌满 5001 条互异非法路径后，最近路径不重复告警、最早路径（已被驱逐）可再次告警。
