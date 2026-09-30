---
'@qin-ui/vant-pro': patch
---

修复字段配置中样式类名与内联样式不生效的问题：

- **`componentClass` / `componentStyle` 不生效并污染 DOM**：此前二者未被转换为内层组件的 `class` / `style`，而是作为普通属性透传给控件 —— 自定义组件会收到 `componentclass="[object Object]"` 之类的非法属性，文档承诺的样式静默失效。现改为在属性合并阶段折叠为内层组件的 `class` / `style`，并从透传属性中剥离原始键（与 `antd-vue-pro` / `element-plus-pro` 行为一致）。
- **`component: 'field'` 分支丢弃 `fieldClass` / `fieldStyle`**：该分支的组件即 `van-field`（外层包装与内层组件合一），但此前只绑定了透传属性，字段层样式类名与内联样式被丢弃。现补充绑定，与 `van-field` 包装分支行为一致；`componentClass` / `componentStyle` 在该分支同样生效。
- **回归**：新增 `BF-06`、`BF-07` 判别用例 —— 内层组件根节点获得 `componentClass` / `componentStyle` 且 DOM 上不再出现 `componentclass` / `componentstyle` 属性；`component: 'field'` 时 `van-field` 根节点获得 `fieldClass` / `fieldStyle`。

破坏性变更：无（仅修正既有配置项的落点；原先依赖「样式配置被忽略」的行为不存在合理用例）。
