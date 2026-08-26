---
'@qin-ui/element-plus-pro': minor
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

### 🐞 缺陷修复与优化 (Bug Fixes & Improvements)

- **BaseFormItem (A3)**：重构实例 ref 收集机制为 `WeakMap` 按字段对象引用绑定，彻底杜绝字段被 `splice`、动态增删、重排等直接变异场景下的实例错位；
- **ProComponentProvider (A1)**：全量配置项改为 `computed` 响应式提供，子组件及 hooks 全面响应式对齐；
- **ProForm (A2, B1)**：
  - 未传 `form` 时自动调用 `useForm()` 自建实例并 provide，避免向下游注入空对象；
  - 注入层采用 `Proxy` 动态代理，支持父组件运行期动态替换 `:form` 实例；
  - 移除显式 `disabled` prop，遵循 Element Plus 原生 `useFormDisabled` / 上下文机制向下级组件注入禁用状态；
- **ProTable (A6, A7, E3, E4, E5)**：
  - 采用响应式派生读取 `table` 内部属性，支持动态替换表格实例；
  - 规范分页三级链合并优先级，修复 `tableAttrs.pagination === false` 以及全局 `pagination: false` 的优先级逻辑；
  - 序号列跨页索引递增计算修复；
  - 统一 `computedControl` 对象形态默认值为 `?? false`，与 antd 系组件库保持一致；
- **SearchForm (A4, A5, A10, A11)**：
  - 增加手动折叠保护机制，避免窗口缩放或重绘时无条件收起用户手动展开的状态；
  - 修复 `proFormHeight` 初始渲染时产生 `unsetpx` 脏样式的问题；
- **BaseField (A12, A14, B4)**：
  - `inject` 提升至 setup 同步期，消除 `getInitProps` 在 computed 内部调用的时序隐患；
  - 移除 `omit` 依赖，改用对象解构分离属性绑定；
  - 未匹配到组件类型时输出明确警告并降级为原生元素渲染；
  - 落地 B4 旧值按需克隆契约。
