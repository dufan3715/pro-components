---
'@qin-ui/element-plus-pro': patch
---

fix(element-plus-pro): 修复 ProTable 丢弃 ElTable 原生事件监听与声明式属性透传问题 (R-01, R-26)

- 建立 `PRO_TABLE_EXCLUDED_ATTR_KEYS` 排除机制，将未被 ProTable 自身消费的所有 `attrs`（包含所有 `onXxx` 事件监听器及扩展属性）透传至底层 `<ElTable>` (R-01)；
- 在 `Props` 类型的 `TableProps` 扩展中补充 `/* @vue-ignore */`，使直接声明在 `<ProTable>` 上的 Element Plus 原生属性（如 `stripe`、`border`、`rowKey` 等）正常流入 `attrs` 并透传至 `<ElTable>` (R-26)；
- 通过 `defineEmits` 类型声明（基于 element-plus `TableEmits`）为模板层 `@event` 提供事件类型提示与补全；
- 完善 `ProComponentProvider` 全局注入配置与 attrs 的优先级合并链路。
