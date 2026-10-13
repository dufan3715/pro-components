---
'@qin-ui/pro-components-core': patch
---

`useFormData` 不再把调用方传入的初始数据对象直接收编为表单数据本体（`useForm` / `useTable` 的 `searchParam` 同样受益）：

- **变更前**：`reactive(initFormData)` 直接把入参对象代理为表单数据，因此
  - 批量覆盖（`setFormData({...})` 的全量替换语义）会**真实 `delete` 调用方对象上的 key**；
  - 同一对象喂给两个实例（模块常量、`props.xxx`、多处共用的默认值）会互相污染；
  - `setFormData('a', 1)` 的顶层写入会同步改写调用方对象。
- **变更后**：内部持有入参的**顶层浅拷贝**，上述写入只作用于内部数据；`formData` 引用稳定性、全量替换语义与 `resetQueryParams` 的快照行为均不变。**嵌套对象仍按引用共享**（与 `useFields` / `useTable` 数组的「一次浅拷贝」口径一致）：嵌套字段的就地变异对调用方可见。
- `useTable` 的 `searchParam` 由此与 `pageParam` 的入参隔离口径一致。

验证：判别用例 `FD-01`（改写为顶层隔离契约）、`FD-26`、`TT-37`（回退即失败）。

**迁移提示**：若此前依赖「传入对象即表单数据本体」（例如创建表单后继续改写该对象期望表单同步变化，或断言 `form.formData === initFormData`），请改为通过 `form.formData` / `setFormData` 读写；仅读取表单数据的代码不受影响。
