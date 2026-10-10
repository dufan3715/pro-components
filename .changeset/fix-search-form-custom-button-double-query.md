---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

修复自定义查询按钮导致查询双发的问题：当 `searchButton` 或搜索区默认插槽渲染为「原生 `<button>` 且未声明 `type`」时，点击会同时触发绑定的 `@click` 与浏览器对 `form` 的隐式提交，`search` 事件被触发两次（默认查询按钮不受影响，其只走 submit）。

现对自定义按钮与默认按钮做**同 tick 去重**（一次用户操作只查询一次；连续两次点击仍为两次），并新增判别用例 `SF-A19`、修正 `SF-A10`（改为挂载到 `document` 后断言 `search === 1` 且隐式提交确实发生），此前该用例因 Vue Test Utils 默认脱离 document 挂载而无法捕获双发。
