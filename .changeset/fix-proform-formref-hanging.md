---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

修复运行期替换 ProForm 的 `:form` 实例后，旧实例 `formRef` 悬挂在已卸载表单组件上的问题：ref 回调改为在渲染期捕获所属表单实例，卸载通知写回该实例。旧实例 `formRef` 在切换后立即清空，整棵表单卸载后当前实例引用同样清空。
