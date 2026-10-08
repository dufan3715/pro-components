---
'@qin-ui/vant-pro': minor
---

修复 vant 弹层字段的取值语义、回调派发与弹层状态管理（CR-055～CR-061）：

- **弹层与内联分支取值语义统一（行为变更，CR-055）**：原先点击弹层字段时传入的是表单**原始数据**（`getFormData(path)`），而内联分支渲染的是**控件侧取值**（已应用字段 `valueFormatter.get`）—— 两者不一致导致数组模型控件（如 `tags`、`picker`）在弹层内状态错乱。现统一为控件侧取值，与 confirm 时经 `valueFormatter.set` 写回形成对称往返。
  ⚠️ **升级影响**：若你的弹层字段配置了 `valueFormatter.get`，弹层内控件此前收到的是未变换的原始值、现在收到变换后的控件侧取值（与内联形态一致）；未配置 `valueFormatter` 的字段行为不变。
- **同名 `on*` 回调被合并为数组时不再抛错（CR-056）**：Provider `componentVars` 与字段配置同时声明同一监听器时，`mergeProps` 会合并为数组，此前 confirm/cancel 直接调用会抛 `confirmEvent is not a function` 且**两侧回调都被静默丢弃**（弹层已关闭、值已写入）。现统一经 `dispatchListeners` 派发（函数直调、数组按序调用），`onUpdateValue` 同步复用。
- **字段隐藏/删除时关闭其弹层（CR-057）**：字段在弹层打开期间被 `setField(path, { hidden: true })` 隐藏或被删除时，此前弹层与遮罩残留为空白浮层；现在组件卸载时若弹层归属该字段则一并关闭。
- **Field 层属性不再泄漏到内层控件 DOM（CR-058）**：`label` / `rules` 等 Field 专有键此前会作为 DOM 属性落到内层控件（`rules` 还会被序列化成 `[object Object]`）。现在仅保留「内层控件同样声明为 props」的键（如 stepper 的 `placeholder` / `max`），其余从控件绑定中剔除；外层 `van-field` 的 `label` / `rules` 行为不变。
- **`updateProps` 设置的弹层属性不再被下一次 `open()` 重置（CR-059）**：拆分为「持久基础属性」与「单次打开覆盖」—— `updateProps(props)` 写入持久基础属性并对其后每次打开生效；`open(path, value, customProps)` 的 `customProps` 仅对本次打开生效；`resetProps()` 恢复默认并清空单次覆盖。
- **文档修正（CR-060）**：README 的 `date-picker` 弹层示例原先使用字符串初值（`date: ''`）与 `(val: string)` 注解，实测内联与弹层两分支均抛 `values.map is not a function`；已改为数组模型示例（`date: []`）。

无破坏性 API 变更（`FormPopup` 的方法签名与返回结构不变）。
