---
'@qin-ui/antd-vue-pro': patch
'@qin-ui/antdv-next-pro': patch
'@qin-ui/element-plus-pro': patch
'@qin-ui/vant-pro': patch
---

字段类名与样式复用宿主 Vue 的 `ClassValue` / `StyleValue`，四包口径统一：

- **三个桌面包（antd / antdv-next / element）**：`Field.formItemClass` / `Field.componentClass` 由 `string` 放宽为宿主 `ClassValue`，`Field.formItemStyle` / `Field.componentStyle` 由 `CSSProperties` 放宽为宿主 `StyleValue`。运行期这些属性本就经 `mergeProps` 落到宿主 `:class` / `:style` 绑定，数组与字符串形态一直可用，此前只被类型面挡住。
- **vant**：`Field.componentClass` / `Field.fieldClass` 由 `any` 收敛为宿主 `ClassValue`（`any` 使类型面失去校验），`Field.componentStyle` / `Field.fieldStyle` 由 `CSSProperties` 放宽为宿主 `StyleValue`。
  ⚠️ **升级影响**：vant 的类型面不再接受任意值（如 `number`、`() => string`）；原先依赖 `any` 静默通过的写法请改为字符串、类名对象或数组。三个桌面包为纯放宽，既有写法不受影响。
- **文档修正**：四包 `README.md` 字段表的类型列同步为 `ClassValue` / `StyleValue`；`docs/vant-pro` 字段表同步；`@qin-ui/vant-pro` 的 `src/index.ts` 入口示例由 `component: 'input'`（未注册组件名，运行时会告警并降级为原生元素）改为 `component: 'field'`。
- **回归**：antd / antdv-next 新增 `SX-07`、element 新增 `BI-A19`、vant 新增 `BI-A22`（数组 / 对象类名与字符串 / 数组样式的绑定结果 + `@ts-expect-error` 锁定类型面）；antdv-next 新增 `DOC-06` 锁定四包类型面与 README 同句，vant 新增 `DOC-05` 锁定本包文档面。
