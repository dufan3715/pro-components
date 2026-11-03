---
'@qin-ui/pro-components-core': minor
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
---

新增 `callListeners` 工具：函数或函数数组形态的监听器按序调用，非函数项跳过，返回各监听器返回值。

修复 ProTable 在 `@change` / `@search` 以数组形态到达（如二次封装写成 `v-bind="$attrs"` 并叠加同名监听）时抛 `TypeError`、分页参数已回写但查询未发出的问题：数组内监听器逐个回放，查询的 loading 竞态守卫在全部监听器返回的 Promise 结束后复位，任一监听器失败时抛出首个错误；`change` 回放中业务监听器抛错时查询链路仍继续发起。
