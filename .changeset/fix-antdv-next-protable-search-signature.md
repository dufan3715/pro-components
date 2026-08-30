---
'@qin-ui/antdv-next-pro': patch
---

fix(pro-table): `search` prop 类型签名与运行时调用对齐 (R-20)

`ProTable` 的 `_search` 始终以无参形式调用 `search`，但类型签名声明为 `(params?: any) => Promise<any> | any`，承诺了永远收不到的 `params`。现收紧为 `() => Promise<unknown>`，与 antd-vue-pro / element-plus-pro 三包统一：

- 若业务此前按旧签名声明了 `params` 形参，需删除该形参——它此前恒为 `undefined`，不影响任何实际逻辑；
- 运行时行为不变（本就以无参调用）；
- 测试挂载辅助 `mountProTable` 的 `search` 选项签名同步对齐，并新增判别测试 PT-A13 锁定「无参调用」契约。
