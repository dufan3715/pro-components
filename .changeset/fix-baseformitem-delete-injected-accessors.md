---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/element-plus-pro': patch
---

fix(base-form-item): 字段卸载时同步删除字段对象上的注入访问器 (R-21)

`BaseFormItem` 卸载（或字段被移除）触发 ref 回调收到 `null` 时，此前仅清理 WeakMap 条目，`getFormItemRef` / `getFormItemComputedProps` / `getComponentRef` / `getComponentComputedProps` 闭包仍残留在用户字段对象上——业务对字段做 `{ ...field }` 浅拷贝或序列化会携带这些内部函数。

- 以 antdv-next-pro 现行为为准对齐：`null` 分支在 WeakMap 删除之外同步 `delete` 字段对象上的四个注入访问器；
- 运行期挂载行为不变（访问器仍在册、实例读取链路不变）；
- 新增判别测试 BI-A4（三包同构）：断言卸载后访问器**属性本身**被删除（既有 BI-A3 仅断言返回值 undefined，无法判别残留闭包）。
