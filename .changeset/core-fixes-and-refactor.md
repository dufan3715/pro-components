---
'@qin-ui/pro-components-core': minor
---

- fix(useFields): 优化 BFS 遍历为游标索引并采用快照式倒序批量删除与插入，解决同父级多匹配错删与插入位置错位问题
- fix(useFields): 优化 \_map 路径缓存为 keep-first 写入策略，保证同 path 重复字段与首匹配语义一致
- fix(useTable): addColumns 重构为快照机制，彻底解决函数谓词批量追加时的死循环
- fix(useForm): 修复单参数传入数据对象时被误判为 root 标志导致数据静默丢弃的问题
- fix(useFormData): 修复以 falsy 初始值（如空字符串、0、null）调用时误走 inject 注入分支的问题
- docs(useFields): 对齐 JSDoc 注释（明确函数路径默认 all=true、字段按自身 path 寻址）
