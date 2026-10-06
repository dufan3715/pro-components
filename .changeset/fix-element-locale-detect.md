---
'@qin-ui/element-plus-pro': patch
---

修复语言判定结果取决于「是否包了一层 `el-config-provider`」的问题：

- **现象**：只包 `<el-config-provider>` 而未传 `locale` 时，`useLocale().lang` 被判为 `en-US`（文案切英文）；不包 provider 时为 `zh-CN`。语言结果由「是否包 provider」而非实际语言决定。
- **原因**：`ElConfigProvider` 会无条件 provide `localeContextKey`（值为 `computed(() => context.locale)`，可能为 `undefined`），而判定用的是注入对象本身的真值 —— 该对象恒为真，于是走进 element-plus 的 `useLocale().lang`（locale 为空时回退 English）。
- **修复**：改为按注入值的**本体**判定 —— `toValue(elLocaleContext) == null` 时回退 `zh-CN`，与「不包 provider」的行为一致；显式传入语言（如英文 `locale`）时仍按宿主语言判定。
- **回归**：`LC-04` —— 仅包 provider 未传 `locale` → `zh-CN`；不包 provider → 同值；显式传英文 `locale` → `en-US`。

破坏性变更：无。
