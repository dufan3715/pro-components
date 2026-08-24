---
'@qin-ui/pro-components-core': minor
---

- perf(shared): 内部实现高性能路径解析与读写模块，替代内部热路径对 lodash get/set/toPath 的依赖，大幅提升字段路径解析与深层数据读写吞吐率
