---
'@qin-ui/antdv-next-pro': minor
---

### ⚠️ API 变更与适配说明 (Breaking Changes / API Notice)

- **SearchForm 按钮插槽事件绑定机制调整**：
  - 移除了 `<slot name="reset-button">`、`<slot name="search-button">`、`<slot name="expand-button">` 上无效的直接 `@click` 监听；
  - 改为通过**插槽作用域 (Scoped Slots)** 规范向外暴露操作方法与状态：
    - `#reset-button="{ onReset }"`
    - `#search-button="{ onSearch }"`
    - `#expand-button="{ expandStatus, changeExpandStatus }"`
  - 自定义上述插槽内容的消费方，需通过作用域参数绑定点击事件。
- **ValueFormatter 旧值传递机制与只读快照契约**：
  - **按需注入旧值**：底层基于格式化函数的形参个数（`fn.length > 1`）决定是否读取旧值上下文。若转换逻辑需要使用旧值，请显式声明两个形参 `(val, oldVal) => ...`（请勿使用默认参数或 `...args` 剩余参数，否则 `fn.length` 无法正确识别）；
  - **只读快照副本**：传入的 `oldVal` 为只读快照副本，不得依赖原地修改写回；仅当 formatter 声明双形参时才克隆旧值，单参转换零开销。

### 🐞 缺陷修复 (Bug Fixes)

- **BaseFormItem (A3)**：重构实例 ref 收集机制为 `WeakMap` 按字段对象引用绑定，彻底杜绝字段被 `splice`、动态增删、重排等直接变异场景下的实例错位；
- **ProComponentProvider (A1)**：`componentVars` 改为 `computed` 响应式提供，子组件及 hooks（`ProForm`、`useGroupFieldAttrs`、`ProTable`）全面响应式对齐；
- **ProForm (A2, B1)**：
  - 未传 `form` 时自动调用 `useForm()` 自建实例并 provide，避免向下游注入空对象；
  - 注入层采用 `Proxy` 动态代理（包含 `set` trap 转发），支持父组件运行期动态替换 `:form` 实例；
- **ProTable (A6, A7)**：
  - 采用响应式派生直读 `table` 属性并对 `columns` 与 `dataSource` 做安全解包，支持动态替换表格实例；
  - 规范分页配置合并优先级，修复全局 `pagination: false` 被忽略的缺陷；
- **SearchForm (A4, A5, A11)**：
  - 增加手动折叠保护机制，避免窗口缩放或重绘时无条件收起用户手动展开的状态；
  - 修复布尔值形态下隐藏字段检测的一致性；
  - 修复 `proFormHeight` 初始渲染时产生 `unsetpx` 脏样式的问题；
- **BaseField (A12, A14, 2.2)**：
  - `inject` 提升至 setup 同步期，消除 `getInitProps` 在 computed 内部调用的时序隐患；
  - 未匹配到组件类型时输出明确警告；
  - `valueFormatter` 优化为按需提取旧值，单参转换场景 0 开销；
- **SizeControl (A13)**：避免 setup 挂载期向 `defineModel` 强制回写默认值造成的父级状态污染；
- **getPopupContainer (A16)**：在表单外使用时增加 `document.body` 兜底。
