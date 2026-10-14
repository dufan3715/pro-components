---
'@qin-ui/antd-vue-pro': patch
---

修复字段 `label` 插槽被字段 `label` 属性遮蔽，并补齐两处判别性覆盖：

- **缺陷**：宿主 `FormItemLabel` 取值为 `props.label ?? slots.label`（`ant-design-vue/es/form/FormItemLabel.js:28`），`props.label` 优先，因此在字段同时声明 `label` 与 `slots.label` 时，`slots.label` 永远不会渲染 —— 用户显式传入的插槽被静默忽略。修复为两者同时存在时剥离 `label` 属性、由插槽渲染，与 `antdv-next-pro` 同构（其 `BI-A19` 已锁定该行为）。
- **回归**：新增 `BI-A22`（两者同时存在时插槽胜出、属性标签不出现）与 `BI-A23`（仅字段 `label` 时标签照常渲染，防修复过度）；`BI-A22` 经突变验证（回退剥离逻辑 → 红）。
- **分页来源优先级补测**：源码注释声明的「显式绑定 > Provider 全局配置」此前无任何用例覆盖 —— 反转该优先级后整套用例仍全绿。新增 `PT-A31`（Provider 与显式绑定同时设置分页，显式绑定胜出、Provider 未冲突的键仍生效、宿主实际渲染为第 1 页）与 `PT-A32`（`table.pageParam` 与显式绑定的合并顺序）；`PT-A31` 经突变验证（反转优先级 → 红）。
- **断言质量**：`PT-A14` / `PT-A26` / `PT-A27` 中原先断言「测试自己刚构造的字面量」的恒真断言改为对照实际属性面（`onScroll` 不在宿主键集合内、`onChange` 在内；Provider 变量键集合对照），`BI-A21` 中不可达的死断言改为可达断言。

破坏性变更：无（`label` 插槽此前被遮蔽属缺陷；分页优先级为既有契约补测）。
