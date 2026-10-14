---
'@qin-ui/antd-vue-pro': patch
---

补齐审计发现的测试基建缺口与文档边界（无运行时行为变更）：

- **测试基建**：`__tests__/setup.ts` 的清理钩子在每个用例后清空 `document.body`，挂载到真实文档树的用例（17 处 `attachTo: document.body`）在断言中途失败时不再把残留 DOM 与未卸载组件串到后续用例 —— 此前 `controls` / `cross-package` 中查全局 DOM 的断言存在「把别处残留误判为本次命中」的通道；`cross-package.spec.ts` 中与 `vitest.config.ts` 的 `restoreMocks: true` 重复的 `afterEach(() => vi.restoreAllMocks())` 一并移除。
- **公开类型面冒烟**：新增 `SX-06`，对包根 17 个类型导出（`ProFormProps` / `ProFormInstance` / `ProFormItemProps` / `ProFormItemInstance` / `ComponentMap` / `ComponentName` / `Field` / `Fields` / `Form` / `UseFields` / `ProTableProps` / `ProTableInstance` / `Column` / `Columns` / `Table` / `ComponentVars` / `ProLocale`）做可解析与关键形状校验。此前这些名字在 `__tests__/` 中引用数为 0，barrel 漏出只能靠下游消费方报 TS2305 才发现（经突变验证：移除其中一个导出 → `vue-tsc` 立即报 TS2724）。
- **新增公开行为覆盖**：
  - `LC-03`：`useLocale` 跟随宿主 `a-config-provider` 的 locale 切换（`zh-CN` / `zh-TW` / `en-US`，含 `zh-HK` 归入繁体的判定次序）。此前三个语言分支中只有 `zh-CN` 与文案插值被覆盖。
  - `LC-04`：`LOCALE_INJECT_KEY` 注入的局部覆盖优先于语言包，且随 `ref` 变化实时回落。此前该 key 仅作为 `index.spec.ts` 的导出键字符串出现。
  - `HK-05`：锁定「注入的表单代理路由到 `:form` 实例，而 `useFormData()` 承接内部兜底实例的 store」这一契约（未传 `:form` 时两者同源）。
- **文档边界**：`README.md`「返回值 (Form 实例)」与 `AI-CONTEXT.md` 补 `useFormData()` 的取值边界说明 —— `<ProForm :form="form">` 场景下 `useFormData().formData` 与 `form.formData` **不是同一对象**、写入互不相通；需同源请用 `useForm(false)` 或直接使用传入实例。与 `element-plus-pro` 的 `PF-E3` 为同一条四包同构契约，此前仅 element 有文档与用例。新增 `DOC-06` 锁定该文案不回流。

破坏性变更：无（测试基建、用例与文档）。
