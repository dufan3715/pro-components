---
'@qin-ui/pro-components-core': patch
---

修复 core 的 falsy key 守卫、表单代理 `delete` 与注入类型：

- **`0` / `''` 作为合法 key 不可用**（CR-020）：`useFields` / `useFormData` / `useTable` 中的 `if (!path)` 守卫把 `0` 与 `''` 当作「未传参」直接返回，数组下标场景（`setColumn(0, …)`、`getFormData(0)`、`setField(0, …)`）与空字符串字段名静默失效。现改为仅 `undefined` / `null` 早退；`useFormData` 的读写路径对数字/布尔 key 统一经 `normalizePathKey` 归一，`useTable` 的列匹配在遍历外一次性归一后进行字符串比对（不进入热路径）。
- **`createFormProxy` 的 `delete` 被静默吞掉**（CR-018）：代理缺少 `deleteProperty` trap，`delete proxy.key` 返回 `true` 但实例属性仍在。现转发到当前实例（实例缺失时仍静默返回 `true`）。
- **`useSearchFormExpand` 的 `columnGap` 为死配置**（CR-027）：折叠高度计算只读取 `rowGap`，`columnGap` 从未参与，已从 hook 的 props 类型中移除（列间距由栅格布局自身消费，不经该 hook）。
- **`InjectionFormSlotsKey` 类型与实际注入形态不符**（CR-028）：声明为 `InjectionKey<Record<string, any>>`，实际 provide 的是 `ShallowRef<Record<string, any>>`，消费端必须断言绕过类型系统。类型已改为 `InjectionKey<ShallowRef<Record<string, any>>>`。

行为变更：数字与空字符串 key 现在会命中真实键位（此前静默返回/跳过）；`columnGap` 不再出现在 `useSearchFormExpand` 的 props 类型中（运行时忽略多余键，不影响既有调用）。

破坏性变更：无（均为缺陷修复；`columnGap` 仅为类型面收敛）。
