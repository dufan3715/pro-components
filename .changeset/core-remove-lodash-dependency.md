---
'@qin-ui/pro-components-core': major
---

- feat!: 彻底移除 `lodash-es` 运行时依赖，发布产物体积由 60.26 kB 降至 22.34 kB（-63%）
- feat!: **移除公共导出 `omit`**（破坏性变更）——内部及受支持用法均已改为解构/显式剔除实现，业务若直接 `import { omit } from '@qin-ui/pro-components-core'` 需改用对象解构
- feat!: **移除已废弃的公共导出 `InjectionPathKey`**（破坏性变更，此前已标 `@deprecated`、全仓零使用）——2.0 起不再提供该兼容 key
- feat: `get`、`set`、`toPath` 底层替换为高性能收窄语法实现（API 名保持不变）；覆盖点分路径与数字索引等主流用法，行为差异与告警机制见 `shared/path.ts` 模块文档——**引号括号段（如 `'a["b.c"]'`）不再被解包**，将返回 undefined 并输出 dev 告警，此类 key 请改用变量下标访问
- feat: 新增 `normalizePathKey` 字段路径归一化工具（非字符串/数组/数字输入安全返回空串）
- refactor: `pick`、`isPlainObject` 改为零外部依赖自研实现
- refactor: `cloneDeep` 改为 `structuredClone` 原生实现 + JSON 序列化降级方案——类实例将丢失原型方法、函数属性与 symbol key 会被丢弃（JSON 型表单/分页数据无感知）
