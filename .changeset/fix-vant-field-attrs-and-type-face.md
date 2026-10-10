---
'@qin-ui/vant-pro': patch
---

修复 vant 适配层的字段属性下发与类型面一致性：

- **原生元素回退路径不再剔除 DOM 属性**：`component` 为字符串且内层元素无 props 声明面时，`placeholder` / `disabled` 等按 DOM 属性名放行（此前被剔除，相对 2.0.x 属回归）；`label` / `rules` 等字段层专有键仍不下发。
- **数组式 `props` 声明的控件不再被误判为空集**：`Array.isArray(props) ? props : Object.keys(props)`，控件自己声明的键不再丢失。
- **不再向控件透出 `type` 硬编码例外**：`type` 不再泄漏到 picker 等容器的 DOM 上；`component: 'field'` 分支本无需例外（宿主 `VanField` 自声明全部字段键）。
- **类型面与运行期一致**：`Field.hidden` 放宽为 `MaybeRefOrGetter<boolean>`（运行期本就按 `toValue` 取值）、`Field.disabled` 放宽为 `MaybeRef<boolean>`（纯 getter 形态运行期不生效，故不做声明）；随之移除 `BaseFormItem` 处的 `as any`。
- 文档一致性：`README.md` 中 `initialValue` / `open` / `updateProps` 的描述与实现及 `docs/vant-pro` 对齐；`install()` 的组件名兜底与其余三包一致。
