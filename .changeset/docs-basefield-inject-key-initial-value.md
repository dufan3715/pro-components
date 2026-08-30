---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

BaseField 补充注入配置 key 的行为边界 JSDoc 声明：组件名与 `picker`（element-plus 为 `type`）仅取 setup 期初始值，运行期变更不会切换 Provider 的默认值预设（`date-picker.month` 等子类型预设需在初始渲染前确定）。纯文档说明，无行为变化。
