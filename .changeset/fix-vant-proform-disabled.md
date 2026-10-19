---
'@qin-ui/vant-pro': patch
---

修复 `<ProForm disabled>` 与 Provider 注入的 `componentVars['pro-form'].disabled` 对字段无效：表单级禁用归一后下发给字段控件。

- **行为变更**：表单级禁用此前只透传到宿主 `van-form`，字段控件自身收到的是显式 `false`，遮蔽了 `van-form` 的禁用上下文 —— 实测 `van-field` 无 `van-field--disabled`、`input` 无 `disabled`、`stepper` 加减号仍可交互。现在 `ProForm` 取**实际下发给宿主 Form 的合并值**（Provider 注入与显式属性的合并结果）作为单一来源，按宿主 Boolean prop 的转换规则判定后下发字段：`disabled` 裸属性编译出的 `''` 与同名属性 `disabled="disabled"` 为 true，其余取真值（`disabled="false"`、`disabled="0"` 等字符串与宿主一致地视为真）。字段控件（含 `stepper` 这类非 `van-field` 控件）随之进入与宿主一致的禁用态。
  ⚠️ **升级影响**：此前写了 `<ProForm disabled>` 或经 `componentVars['pro-form'].disabled` 全局配置禁用、但字段仍可交互的项目，升级后字段会真正禁用；需要按字段放行的场景保持字段级 `disabled: false`（字段级优先于表单级，本次未变）。
- 优先序：显式 `disabled` > Provider 注入值（二者经 `mergeProps` 合成为同一来源）；字段级 `disabled` > 表单级 > 字段自身 Provider 注入值。表单级未提供时不下发，字段层回退到既有取值路径。
- 回归：新增 `VP-F21`（判别 `van-field--disabled` / `input[disabled]` / `van-stepper__minus--disabled` 随表单级 `disabled` 的裸属性、同名属性与显式翻转，且字段级 `disabled: false` 仍然优先）、`VP-F22`（Provider 注入路径与显式覆盖：改回只读显式 attrs 时转红）与 `VP-F23`（9 种属性形态逐一对齐宿主解析真值：改回按形态白名单判定时 `disabled="false"` / `disabled="0"` 两行转红）。
